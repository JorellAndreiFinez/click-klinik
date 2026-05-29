import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { HydratedDocument, Model } from 'mongoose';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { Patient } from '../patients/schemas/patient.schema';
import { UpsertMedicalRecordDto } from './dto/upsert-medical-record.dto';
import { MedicalRecord } from './schemas/medical-record.schema';

type DoctorPatientListItem = {
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientMobileNumber: string;
  sex: Patient['sex'];
  age?: number;
  latestAppointmentAt: Date;
  latestAppointmentStatus: Appointment['status'];
  latestConcern: string;
  recordCount: number;
};

type DoctorPatientDetail = {
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    sex: Patient['sex'];
    birthdate?: Date;
    age?: number;
    allergies: string[];
    existingConditions: string[];
    currentMedications: string[];
    basicMedicalHistory?: string;
  };
  appointments: Appointment[];
  records: Array<
    Omit<MedicalRecord, 'privateNote'> & {
      privateNote?: string;
      canViewPrivateNote: boolean;
    }
  >;
};

type PatientRecordsView = {
  appointments: Appointment[];
  records: MedicalRecord[];
};

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectModel(MedicalRecord.name)
    private readonly medicalRecordModel: Model<MedicalRecord>,
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
  ) {}

  async listDoctorPatients(user: DecodedIdToken): Promise<DoctorPatientListItem[]> {
    const doctor = await this.getApprovedDoctor(user);
    const doctorApplicationId = String(doctor._id);

    const appointments = await this.appointmentModel
      .find({ doctorApplicationId })
      .sort({ scheduledStartAt: -1 })
      .exec();

    const patientIds = [...new Set(appointments.map((item) => item.patientId))];
    const patients = await this.patientModel
      .find({ _id: { $in: patientIds } })
      .exec();
    const records = await this.medicalRecordModel
      .find({ doctorApplicationId })
      .exec();
    const recordsByPatient = new Map<string, number>();
    for (const record of records) {
      recordsByPatient.set(
        record.patientId,
        (recordsByPatient.get(record.patientId) ?? 0) + 1,
      );
    }

    return patientIds
      .map((patientId) => {
        const latestAppointment = appointments.find(
          (item) => item.patientId === patientId,
        );
        const patient = patients.find((item) => String(item._id) === patientId);

        if (!latestAppointment || !patient) {
          return null;
        }

        return {
          patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientEmail: patient.email,
          patientMobileNumber: patient.mobileNumber,
          sex: patient.sex,
          age: computeAge(patient.birthdate),
          latestAppointmentAt: latestAppointment.scheduledStartAt,
          latestAppointmentStatus: latestAppointment.status,
          latestConcern: latestAppointment.consultationLabel || latestAppointment.specializationName,
          recordCount: recordsByPatient.get(patientId) ?? 0,
        };
      })
      .filter(Boolean) as DoctorPatientListItem[];
  }

  async getDoctorPatientDetail(
    user: DecodedIdToken,
    patientId: string,
  ): Promise<DoctorPatientDetail> {
    const doctor = await this.getApprovedDoctor(user);
    const doctorApplicationId = String(doctor._id);

    const hasRelationship = await this.appointmentModel.exists({
      doctorApplicationId,
      patientId,
    });

    if (!hasRelationship) {
      throw new ForbiddenException(
        'You can only view records for patients who consulted with you in the app.',
      );
    }

    const patient = await this.patientModel.findById(patientId).exec();
    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const appointments = await this.appointmentModel
      .find({ patientId })
      .sort({ scheduledStartAt: -1 })
      .exec();

    const records = await this.medicalRecordModel
      .find({ patientId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      patient: {
        _id: String(patient._id),
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        mobileNumber: patient.mobileNumber,
        sex: patient.sex,
        birthdate: patient.birthdate,
        age: computeAge(patient.birthdate),
        allergies: patient.allergies,
        existingConditions: patient.existingConditions,
        currentMedications: patient.currentMedications,
        basicMedicalHistory: patient.basicMedicalHistory,
      },
      appointments,
      records: records.map((record) => ({
        ...record,
        privateNote:
          record.doctorApplicationId === doctorApplicationId
            ? record.privateNote
            : undefined,
        canViewPrivateNote: record.doctorApplicationId === doctorApplicationId,
      })),
    };
  }

  async getDoctorAppointmentRecord(
    user: DecodedIdToken,
    appointmentId: string,
  ): Promise<MedicalRecord | null> {
    const doctor = await this.getApprovedDoctor(user);
    await this.assertDoctorOwnsAppointment(String(doctor._id), appointmentId);

    return this.medicalRecordModel.findOne({ appointmentId }).exec();
  }

  async upsertDoctorAppointmentRecord(
    user: DecodedIdToken,
    appointmentId: string,
    dto: UpsertMedicalRecordDto,
  ): Promise<MedicalRecord> {
    const doctor = await this.getApprovedDoctor(user);
    const appointment = await this.assertDoctorOwnsAppointment(
      String(doctor._id),
      appointmentId,
    );

    return (await this.medicalRecordModel
      .findOneAndUpdate(
        { appointmentId },
        {
          $set: {
            patientId: appointment.patientId,
            patientName: appointment.patientName,
            doctorApplicationId: appointment.doctorApplicationId,
            doctorName: appointment.doctorName,
            specializationName: appointment.specializationName,
            consultationSummary: dto.consultationSummary?.trim() || undefined,
            publicNote: dto.publicNote?.trim() || undefined,
            privateNote: dto.privateNote?.trim() || undefined,
            recommendations: dto.recommendations?.trim() || undefined,
            prescriptions:
              dto.prescriptions
                ?.map((item) => ({
                  medicine: item.medicine.trim(),
                  dosage: item.dosage?.trim() || undefined,
                  instruction: item.instruction?.trim() || undefined,
                  duration: item.duration?.trim() || undefined,
                }))
                .filter((item) => item.medicine) ?? [],
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
      )
      .exec()) as MedicalRecord;
  }

  async getPatientRecords(user: DecodedIdToken): Promise<PatientRecordsView> {
    const patient = await this.patientModel
      .findOne({ firebaseUid: user.uid })
      .exec();

    if (!patient) {
      throw new ForbiddenException('Patient access is required.');
    }

    const patientId = String(patient._id);
    const appointments = await this.appointmentModel
      .find({ patientId })
      .sort({ scheduledStartAt: -1 })
      .exec();
    const records = await this.medicalRecordModel
      .find({ patientId })
      .sort({ createdAt: -1 })
      .exec();

    return { appointments, records };
  }

  private async getApprovedDoctor(
    user: DecodedIdToken,
  ): Promise<HydratedDocument<Doctor>> {
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

    return doctor;
  }

  private async assertDoctorOwnsAppointment(
    doctorApplicationId: string,
    appointmentId: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findOne({
        _id: appointmentId,
        doctorApplicationId,
      })
      .exec();

    if (!appointment) {
      throw new ForbiddenException(
        'You can only write notes and prescriptions for your own consultations.',
      );
    }

    return appointment;
  }
}

function computeAge(birthdate?: Date): number | undefined {
  if (!birthdate) {
    return undefined;
  }

  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const monthDelta = now.getMonth() - birthdate.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getDate() < birthdate.getDate())
  ) {
    age -= 1;
  }

  return age;
}
