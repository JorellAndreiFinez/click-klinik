import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Model } from 'mongoose';
import { Patient } from '../patients/schemas/patient.schema';
import { CreateDoctorApplicationDto } from './dto/create-doctor-application.dto';
import { ReviewDoctorApplicationDto } from './dto/review-doctor-application.dto';
import { Doctor } from './schemas/doctor.schema';
import { SPECIALIZATIONS } from './specializations';

import { SearchDoctorsDto } from './dto/search-doctors.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
  ) {}

  async getMyApplication(user: DecodedIdToken): Promise<Doctor> {
    const application = await this.findApplicationForAccount(user);

    if (!application) {
      throw new NotFoundException('Doctor application not found.');
    }

    return application;
  }

  async getMyApprovedAccess(user: DecodedIdToken): Promise<Doctor> {
    const application = await this.getMyApplication(user);

    if (application.applicationStatus === 'pending_review') {
      throw new ForbiddenException(
        'Your doctor application is still pending review.',
      );
    }

    if (application.applicationStatus === 'rejected') {
      throw new ForbiddenException('Your doctor application was not approved.');
    }

    return application;
  }

  async submitApplication(
    user: DecodedIdToken,
    dto: CreateDoctorApplicationDto,
  ): Promise<Doctor> {
    const professionalEmail = getAccountEmail(user);
    await this.assertCanSubmitApplication(user.uid, professionalEmail);

    if (!dto.credentialReviewConsent) {
      throw new BadRequestException(
        'Consent is required before submitting credentials for review.',
      );
    }

    const specializationName =
      dto.specializationCode === 'OTHER'
        ? dto.otherSpecialization?.trim()
        : SPECIALIZATIONS[dto.specializationCode];

    if (!specializationName) {
      throw new BadRequestException('Select or enter a specialization.');
    }

    const suffix =
      dto.suffix === 'Other' ? dto.otherSuffix?.trim() : dto.suffix;

    if (!suffix) {
      throw new BadRequestException('Select or enter a professional suffix.');
    }

    const mobileNumber = normalizePhilippineMobileNumber(dto.mobileNumber);
    await this.assertMobileNumberAvailable(user.uid, mobileNumber);

    try {
      return await this.doctorModel.create({
        firebaseUid: user.uid,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        suffix,
        professionalEmail,
        mobileNumber,
        prcLicenseNumber: dto.prcLicenseNumber.trim(),
        specializationCode: dto.specializationCode,
        specializationName,
        clinicOrHospital: dto.clinicOrHospital?.trim(),
        location: dto.location?.trim() ?? dto.cityMunicipalityName.trim(),
        regionCode: dto.regionCode.trim(),
        regionName: dto.regionName.trim(),
        provinceCode: dto.provinceCode?.trim(),
        provinceName: dto.provinceName?.trim(),
        cityMunicipalityCode: dto.cityMunicipalityCode.trim(),
        cityMunicipalityName: dto.cityMunicipalityName.trim(),
        barangayCode: dto.barangayCode.trim(),
        barangayName: dto.barangayName.trim(),
        yearsOfExperience: dto.yearsOfExperience,
        bio: dto.bio.trim(),
        displayOnPublicWebsite: dto.displayOnPublicWebsite,
        applicationStatus: 'pending_review',
        credentialReviewConsentAcceptedAt: new Date(),
      });
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new ConflictException(
          'An application already exists for this account, mobile number, email, or PRC license number.',
        );
      }

      throw error;
    }
  }

  async checkSignupEligibility(
    user: DecodedIdToken,
  ): Promise<{ available: true }> {
    await this.assertCanSubmitApplication(user.uid, getAccountEmail(user));
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

  async listApplications(): Promise<Doctor[]> {
    return this.doctorModel
      .find()
      .sort({ applicationStatus: 1, createdAt: -1 })
      .exec();
  }

  async reviewApplication(
    id: string,
    dto: ReviewDoctorApplicationDto,
    reviewerEmail: string,
  ): Promise<Doctor> {
    const application = await this.doctorModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            applicationStatus: dto.action,
            reviewNotes: dto.reviewNotes?.trim(),
            reviewedByEmail: reviewerEmail.trim().toLowerCase(),
            reviewedAt: new Date(),
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!application) {
      throw new NotFoundException('Doctor application not found.');
    }

    return application;
  }

  async discoverDoctors(filters: SearchDoctorsDto): Promise<Doctor[]> {
    const query = filters.query?.trim();
    const symptom = filters.symptom?.trim();
    const specializationCode = filters.specializationCode?.trim();
    const location = filters.location?.trim();

    const andConditions: Record<string, unknown>[] = [
      { applicationStatus: 'approved' },
      { displayOnPublicWebsite: true },
    ];

    if (specializationCode) {
      andConditions.push({ specializationCode });
    }

    if (query) {
      andConditions.push({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { specializationName: { $regex: query, $options: 'i' } },
          { clinicOrHospital: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } },
        ],
      });
    }

    if (symptom) {
      andConditions.push({
        $or: [
          {
            searchableSymptoms: {
              $elemMatch: { $regex: symptom, $options: 'i' },
            },
          },
          { specializationName: { $regex: symptom, $options: 'i' } },
          { bio: { $regex: symptom, $options: 'i' } },
        ],
      });
    }

    if (location) {
      andConditions.push({
        $or: [
          { location: { $regex: location, $options: 'i' } },
          { clinicOrHospital: { $regex: location, $options: 'i' } },
          { bio: { $regex: location, $options: 'i' } },
        ],
      });
    }

    return this.doctorModel
      .find({ $and: andConditions })
      .select([
        'firstName',
        'lastName',
        'suffix',
        'specializationCode',
        'specializationName',
        'clinicOrHospital',
        'location',
        'yearsOfExperience',
        'bio',
        'displayOnPublicWebsite',
      ])
      .sort({
        ...(location ? { location: 1 } : {}),
        yearsOfExperience: -1,
        lastName: 1,
        firstName: 1,
      })
      .lean()
      .exec();
  }

  async getPublicDoctorProfile(id: string): Promise<Doctor> {
    const doctor = await this.doctorModel
      .findOne({
        _id: id,
        applicationStatus: 'approved',
        displayOnPublicWebsite: true,
      })
      .select([
        'firstName',
        'lastName',
        'suffix',
        'specializationCode',
        'specializationName',
        'clinicOrHospital',
        'location',
        'yearsOfExperience',
        'bio',
        'displayOnPublicWebsite',
      ])
      .lean()
      .exec();

    if (!doctor) {
      throw new NotFoundException('Public doctor profile not found.');
    }

    return doctor;
  }

  private findApplicationForAccount(
    user: DecodedIdToken,
  ): ReturnType<Model<Doctor>['findOne']> {
    const professionalEmail = getAccountEmail(user);

    return this.doctorModel.findOne({
      $or: [{ firebaseUid: user.uid }, { professionalEmail }],
    });
  }

  private async assertMobileNumberAvailable(
    firebaseUid: string,
    mobileNumber: string,
  ): Promise<void> {
    const [existingDoctorOwner, existingPatientOwner] = await Promise.all([
      this.doctorModel
        .exists({
          mobileNumber,
          firebaseUid: { $ne: firebaseUid },
        })
        .exec(),
      this.patientModel.exists({ mobileNumber }).exec(),
    ]);

    if (existingDoctorOwner || existingPatientOwner) {
      throw new ConflictException(
        'This mobile number is already registered in Click Klinik.',
      );
    }
  }

  private async assertCanSubmitApplication(
    firebaseUid: string,
    professionalEmail: string,
  ): Promise<void> {
    const [existingApplication, existingPatient] = await Promise.all([
      this.doctorModel
        .exists({
          $or: [{ firebaseUid }, { professionalEmail }],
        })
        .exec(),
      this.patientModel
        .exists({
          $or: [{ firebaseUid }, { email: professionalEmail }],
        })
        .exec(),
    ]);

    if (existingApplication) {
      throw new ConflictException(
        'You already submitted a doctor application. Please log in to check your account status.',
      );
    }

    if (existingPatient) {
      throw new ConflictException(
        'This account is already registered as a patient. Use a separate professional account to apply as a doctor.',
      );
    }
  }
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
