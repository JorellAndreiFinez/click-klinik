import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Model } from 'mongoose';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { UpsertPatientProfileDto } from './dto/upsert-patient-profile.dto';
import { Patient } from './schemas/patient.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
  ) {}

  async getProfile(user: DecodedIdToken): Promise<Patient> {
    const email = getAccountEmail(user);
    const patient = await this.patientModel
      .findOne({ $or: [{ firebaseUid: user.uid }, { email }] })
      .exec();

    if (!patient) {
      throw new NotFoundException('Patient profile has not been completed.');
    }

    if (patient.firebaseUid !== user.uid) {
      await this.patientModel
        .findByIdAndUpdate(patient._id, { $set: { firebaseUid: user.uid } })
        .exec();
      patient.firebaseUid = user.uid;
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

    await this.assertPatientEmailAvailable(user.uid, email);
    await this.assertNotRegisteredAsDoctor(user.uid, email);
    await this.assertMobileNumberAvailable(user.uid, mobileNumber);

    try {
      const patient = await this.patientModel
        .findOneAndUpdate(
          { firebaseUid: user.uid },
          {
            $set: {
              role: 'patient',
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              suffix: dto.suffix?.trim(),
              email: email.toLowerCase(),
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
              regionCode: dto.regionCode.trim(),
              regionName: dto.regionName.trim(),
              provinceCode: dto.provinceCode?.trim(),
              provinceName: dto.provinceName?.trim(),
              cityMunicipalityCode: dto.cityMunicipalityCode.trim(),
              cityMunicipalityName: dto.cityMunicipalityName.trim(),
              barangayCode: dto.barangayCode.trim(),
              barangayName: dto.barangayName.trim(),
              latitude: dto.latitude,
              longitude: dto.longitude,
              geoLocationUpdatedAt: hasGeoPin(dto) ? new Date() : undefined,
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
        throw new ConflictException(
          'This email address or mobile number is already registered.',
        );
      }

      throw error;
    }
  }

  async checkSignupEligibility(
    user: DecodedIdToken,
  ): Promise<{ available: true }> {
    const email = getAccountEmail(user);
    const existingPatient = await this.patientModel
      .exists({ $or: [{ firebaseUid: user.uid }, { email }] })
      .exec();

    if (existingPatient) {
      throw new ConflictException(
        'This account already has a patient profile. Please log in instead.',
      );
    }

    await this.assertNotRegisteredAsDoctor(user.uid, email);
    return { available: true };
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
    const [existingPatientOwner, existingDoctorOwner] = await Promise.all([
      this.patientModel
        .exists({
          mobileNumber,
          firebaseUid: { $ne: firebaseUid },
        })
        .exec(),
      this.doctorModel.exists({ mobileNumber }).exec(),
    ]);

    if (existingPatientOwner || existingDoctorOwner) {
      throwMobileNumberConflict();
    }
  }

  private async assertPatientEmailAvailable(
    firebaseUid: string,
    email: string,
  ): Promise<void> {
    const existingOwner = await this.patientModel
      .exists({ email, firebaseUid: { $ne: firebaseUid } })
      .exec();

    if (existingOwner) {
      throw new ConflictException(
        'This email address is already registered to another patient account.',
      );
    }
  }

  private async assertNotRegisteredAsDoctor(
    firebaseUid: string,
    email: string,
  ): Promise<void> {
    const existingDoctor = await this.doctorModel
      .exists({
        $or: [{ firebaseUid }, { professionalEmail: email.toLowerCase() }],
      })
      .exec();

    if (existingDoctor) {
      throw new ConflictException(
        'This account already has a doctor application. Please use doctor login instead.',
      );
    }
  }
}

function sanitizeItems(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function hasGeoPin(dto: UpsertPatientProfileDto): boolean {
  return typeof dto.latitude === 'number' && typeof dto.longitude === 'number';
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

function getAccountEmail(user: DecodedIdToken): string {
  const email =
    typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';

  if (!email) {
    throw new BadRequestException('An account email is required.');
  }

  return email;
}

function throwMobileNumberConflict(): never {
  throw new ConflictException(
    'This mobile number is already registered to another patient account.',
  );
}
