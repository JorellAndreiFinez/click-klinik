import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Model } from 'mongoose';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { Patient } from '../patients/schemas/patient.schema';
import { CreateHealthMonitoringLogDto } from './dto/create-health-monitoring-log.dto';
import {
  HealthMonitoringLog,
  HealthMonitoringTrend,
} from './schemas/health-monitoring-log.schema';

const DISCLAIMER =
  'Guidance only. This monitoring summary does not replace professional medical advice or emergency care.';

export type MonitoringSummary = {
  trend: HealthMonitoringTrend;
  summary: string;
  flags: string[];
  latestLog?: HealthMonitoringLog;
  logs: HealthMonitoringLog[];
  disclaimer: string;
};

@Injectable()
export class HealthMonitoringService {
  constructor(
    @InjectModel(HealthMonitoringLog.name)
    private readonly monitoringModel: Model<HealthMonitoringLog>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
  ) {}

  async createMyLog(
    user: DecodedIdToken,
    dto: CreateHealthMonitoringLogDto,
  ): Promise<HealthMonitoringLog> {
    const patient = await this.getPatient(user);
    const hasAnyReading = [
      dto.systolicBp,
      dto.diastolicBp,
      dto.glucoseMgDl,
      dto.temperatureC,
      dto.oxygenSaturation,
      dto.pulseBpm,
      dto.weightKg,
    ].some((value) => typeof value === 'number');

    if (!hasAnyReading && dto.symptoms.length === 0 && !dto.notes?.trim()) {
      throw new BadRequestException(
        'Add at least one reading, symptom, or note before saving.',
      );
    }

    const previousLogs = await this.monitoringModel
      .find({ patientId: String(patient._id) })
      .sort({ loggedAt: -1 })
      .limit(5)
      .exec();
    const analysis = await analyzeMonitoringLog(dto, previousLogs);

    return this.monitoringModel.create({
      patientId: String(patient._id),
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientEmail: patient.email,
      loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
      systolicBp: dto.systolicBp,
      diastolicBp: dto.diastolicBp,
      glucoseMgDl: dto.glucoseMgDl,
      temperatureC: dto.temperatureC,
      oxygenSaturation: dto.oxygenSaturation,
      pulseBpm: dto.pulseBpm,
      weightKg: dto.weightKg,
      symptoms: sanitizeItems(dto.symptoms),
      notes: dto.notes?.trim(),
      trend: analysis.trend,
      analysisSummary: analysis.summary,
      flags: analysis.flags,
      disclaimer: DISCLAIMER,
    });
  }

  async listMyLogs(user: DecodedIdToken): Promise<HealthMonitoringLog[]> {
    const patient = await this.getPatient(user);
    return this.getPatientLogs(String(patient._id));
  }

  async getMySummary(user: DecodedIdToken): Promise<MonitoringSummary> {
    const patient = await this.getPatient(user);
    return this.getPatientSummary(String(patient._id));
  }

  async getPatientLogs(patientId: string, limit = 20): Promise<HealthMonitoringLog[]> {
    return this.monitoringModel
      .find({ patientId })
      .sort({ loggedAt: -1 })
      .limit(limit)
      .exec();
  }

  async getPatientSummary(patientId: string): Promise<MonitoringSummary> {
    const logs = await this.getPatientLogs(patientId, 10);
    const latestLog = logs[0];

    if (!latestLog) {
      return {
        trend: 'first_log',
        summary: 'No home monitoring logs have been submitted yet.',
        flags: [],
        logs,
        disclaimer: DISCLAIMER,
      };
    }

    return {
      trend: latestLog.trend,
      summary: latestLog.analysisSummary,
      flags: latestLog.flags,
      latestLog,
      logs,
      disclaimer: latestLog.disclaimer || DISCLAIMER,
    };
  }

  async getDoctorPatientSummary(
    user: DecodedIdToken,
    patientId: string,
  ): Promise<MonitoringSummary> {
    await this.assertDoctorCanViewPatient(user, patientId);
    return this.getPatientSummary(patientId);
  }

  private async getPatient(user: DecodedIdToken) {
    const patient = await this.patientModel
      .findOne({ firebaseUid: user.uid })
      .exec();

    if (!patient) {
      throw new ForbiddenException('Patient access is required.');
    }

    return patient;
  }

  private async assertDoctorCanViewPatient(
    user: DecodedIdToken,
    patientId: string,
  ): Promise<void> {
    const email =
      typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const doctor = await this.doctorModel
      .findOne({
        $or: [{ firebaseUid: user.uid }, { professionalEmail: email }],
        applicationStatus: 'approved',
      })
      .exec();

    if (!doctor) {
      throw new ForbiddenException('Approved doctor access is required.');
    }

    const appointment = await this.appointmentModel
      .exists({ doctorApplicationId: String(doctor._id), patientId })
      .exec();

    if (!appointment) {
      throw new NotFoundException('Patient monitoring logs are not available.');
    }
  }
}

async function analyzeMonitoringLog(
  dto: CreateHealthMonitoringLogDto,
  previousLogs: HealthMonitoringLog[],
): Promise<{
  trend: HealthMonitoringTrend;
  summary: string;
  flags: string[];
}> {
  const fallback = buildRuleBasedAnalysis(dto, previousLogs[0]);
  const aiSummary = await tryGeminiMonitoringSummary(dto, previousLogs, fallback);
  return aiSummary ?? fallback;
}

function buildRuleBasedAnalysis(
  dto: CreateHealthMonitoringLogDto,
  previous?: HealthMonitoringLog,
): {
  trend: HealthMonitoringTrend;
  summary: string;
  flags: string[];
} {
  const flags: string[] = [];

  if (dto.systolicBp && dto.diastolicBp) {
    if (dto.systolicBp >= 180 || dto.diastolicBp >= 120) {
      flags.push('Very high blood pressure reading');
    } else if (dto.systolicBp >= 140 || dto.diastolicBp >= 90) {
      flags.push('Elevated blood pressure reading');
    }
  }

  if (dto.glucoseMgDl && (dto.glucoseMgDl >= 250 || dto.glucoseMgDl <= 70)) {
    flags.push('Blood glucose outside common home-monitoring range');
  }

  if (dto.temperatureC && dto.temperatureC >= 38) {
    flags.push('Fever-range temperature');
  }

  if (dto.oxygenSaturation && dto.oxygenSaturation < 94) {
    flags.push('Low oxygen saturation reading');
  }

  if (dto.pulseBpm && (dto.pulseBpm > 120 || dto.pulseBpm < 50)) {
    flags.push('Pulse reading needs attention');
  }

  const hasMeaningfulChange = previous
    ? readingChanged(dto.systolicBp, previous.systolicBp, 15) ||
      readingChanged(dto.diastolicBp, previous.diastolicBp, 10) ||
      readingChanged(dto.glucoseMgDl, previous.glucoseMgDl, 40) ||
      readingChanged(dto.temperatureC, previous.temperatureC, 0.8) ||
      readingChanged(dto.oxygenSaturation, previous.oxygenSaturation, 3) ||
      readingChanged(dto.pulseBpm, previous.pulseBpm, 20) ||
      readingChanged(dto.weightKg, previous.weightKg, 2)
    : false;
  const trend: HealthMonitoringTrend =
    flags.length > 0
      ? 'needs_attention'
      : !previous
        ? 'first_log'
        : hasMeaningfulChange
          ? 'changed'
          : 'stable';

  const summary =
    trend === 'needs_attention'
      ? `Some readings need attention: ${flags.join('; ')}. Consider contacting a doctor or seeking urgent care for severe symptoms.`
      : trend === 'changed'
        ? 'Current readings changed compared with recent home logs. Continue monitoring and mention this trend during consultation.'
        : trend === 'stable'
          ? 'Current readings look generally stable compared with the latest saved log.'
          : 'First monitoring log saved. Future logs will help show whether readings are stable or changing.';

  return { trend, summary, flags };
}

async function tryGeminiMonitoringSummary(
  dto: CreateHealthMonitoringLogDto,
  previousLogs: HealthMonitoringLog[],
  fallback: { trend: HealthMonitoringTrend; summary: string; flags: string[] },
): Promise<{
  trend: HealthMonitoringTrend;
  summary: string;
  flags: string[];
} | null> {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    return null;
  }

  const prompt = [
    'You summarize home health monitoring logs for a telehealth app.',
    'Do not diagnose. Use guidance-only wording.',
    'Return strict JSON: {"trend":"stable|changed|needs_attention|first_log","summary":"short patient-friendly summary","flags":["short flags"]}.',
    `Current log: ${JSON.stringify(dto)}`,
    `Recent logs: ${JSON.stringify(previousLogs.slice(0, 3))}`,
    `Rule fallback: ${JSON.stringify(fallback)}`,
  ].join('\n');

  for (const key of keys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
          }),
        },
      );

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const parsed = safeParseAiAnalysis(text);

      if (parsed) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function safeParseAiAnalysis(value: string): {
  trend: HealthMonitoringTrend;
  summary: string;
  flags: string[];
} | null {
  const jsonText = value.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(jsonText) as {
      trend?: string;
      summary?: string;
      flags?: string[];
    };
    const allowed = ['stable', 'changed', 'needs_attention', 'first_log'];
    if (!parsed.trend || !allowed.includes(parsed.trend) || !parsed.summary) {
      return null;
    }
    return {
      trend: parsed.trend as HealthMonitoringTrend,
      summary: parsed.summary.slice(0, 500),
      flags: Array.isArray(parsed.flags) ? parsed.flags.slice(0, 6) : [],
    };
  } catch {
    return null;
  }
}

function readingChanged(
  current: number | undefined,
  previous: number | undefined,
  threshold: number,
): boolean {
  return (
    typeof current === 'number' &&
    typeof previous === 'number' &&
    Math.abs(current - previous) >= threshold
  );
}

function sanitizeItems(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function getGeminiApiKeys(): string[] {
  return [process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEY]
    .filter(Boolean)
    .flatMap((value) => value!.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}
