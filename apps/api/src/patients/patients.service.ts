import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Model } from 'mongoose';
import { UpsertPatientProfileDto } from './dto/upsert-patient-profile.dto';
import { Patient } from './schemas/patient.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
  ) {}

  async getProfile(user: DecodedIdToken): Promise<Patient> {
    const patient = await this.patientModel
      .findOne({ firebaseUid: user.uid })
      .exec();

    if (!patient) {
      throw new NotFoundException('Patient profile has not been completed.');
    }

    return patient;
  }

  async upsertProfile(
    user: DecodedIdToken,
    dto: UpsertPatientProfileDto,
  ): Promise<Patient> {
    if (!dto.privacyPolicyAccepted || !dto.healthDataProcessingAccepted) {
      throw new BadRequestException(
        'Privacy notice and health data processing consent are required.',
      );
    }

    const email = typeof user.email === 'string' ? user.email : '';
    if (!email) {
      throw new BadRequestException('A verified account email is required.');
    }

    const mobileNumber = normalizePhilippineMobileNumber(dto.mobileNumber);

    await this.assertMobileNumberAvailable(user.uid, mobileNumber);

    try {
      const patient = await this.patientModel
        .findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $set: {
              role: 'patient',
              fullName: dto.fullName.trim(),
              email,
              mobileNumber,
              birthdate: new Date(dto.birthdate),
              sex: dto.sex,
              weightKg: dto.weightKg,
              heightCm: dto.heightCm,
              emergencyContactName: dto.emergencyContactName?.trim(),
              emergencyContactNumber: dto.emergencyContactNumber?.trim(),
              allergies: sanitizeItems(dto.allergies),
              existingConditions: sanitizeItems(dto.existingConditions),
              currentMedications: sanitizeItems(dto.currentMedications),
              basicMedicalHistory: dto.basicMedicalHistory?.trim(),
              privacyPolicyAccepted: dto.privacyPolicyAccepted,
              healthDataProcessingAccepted: dto.healthDataProcessingAccepted,
              aiAssistanceAccepted: dto.aiAssistanceAccepted,
              consentAcceptedAt: new Date(),
              privacyNoticeVersion: 'hackathon-v1',
            },
          },
          { new: true, upsert: true, runValidators: true },
        )
        .exec();

      return patient;
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throwMobileNumberConflict();
      }

      throw error;
    }
  }

  async checkMobileAvailability(
    user: DecodedIdToken,
    mobileNumber: string,
  ): Promise<{ available: true }> {
    await this.assertMobileNumberAvailable(
      user.uid,
      normalizePhilippineMobileNumber(mobileNumber),
    );

    return { available: true };
  }

  private async assertMobileNumberAvailable(
    firebaseUid: string,
    mobileNumber: string,
  ): Promise<void> {
    const existingMobileOwner = await this.patientModel
      .exists({
        mobileNumber,
        firebaseUid: { $ne: firebaseUid },
      })
      .exec();

    if (existingMobileOwner) {
      throwMobileNumberConflict();
    }
  }
}

function sanitizeItems(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

function normalizePhilippineMobileNumber(mobileNumber: string): string {
  const digits = mobileNumber.replace(/\D/g, '').replace(/^63/, '');

  if (!/^9\d{9}$/.test(digits)) {
    throw new BadRequestException('Enter a valid Philippine mobile number.');
  }

  return `+63${digits}`;
}

function throwMobileNumberConflict(): never {
  throw new ConflictException(
    'This mobile number is already registered to another patient account.',
  );
}
