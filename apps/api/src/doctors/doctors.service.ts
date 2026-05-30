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
import { DoctorRecommendationDto } from './dto/doctor-recommendation.dto';
import { ReviewDoctorApplicationDto } from './dto/review-doctor-application.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { Doctor } from './schemas/doctor.schema';
import { SPECIALIZATIONS } from './specializations';

import { SearchDoctorsDto } from './dto/search-doctors.dto';

type DoctorRecommendationResult = {
  specializationCode: string;
  specializationName: string;
  relatedSpecializations: Array<{
    code: string;
    name: string;
  }>;
  reasoning: string;
  symptomKeywords: string[];
  disclaimer: string;
  doctors: Doctor[];
};

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

  async updateMyProfile(
    user: DecodedIdToken,
    dto: UpdateDoctorProfileDto,
  ): Promise<Doctor> {
    const application = await this.getMyApplication(user);
    const suffix =
      dto.suffix === 'Other' ? dto.otherSuffix?.trim() : dto.suffix;
    const specializationName =
      dto.specializationCode === 'OTHER'
        ? dto.otherSpecialization?.trim()
        : SPECIALIZATIONS[dto.specializationCode];

    if (!suffix) {
      throw new BadRequestException('Select or enter a professional suffix.');
    }

    if (!specializationName) {
      throw new BadRequestException('Select or enter a specialization.');
    }

    const mobileNumber = normalizePhilippineMobileNumber(dto.mobileNumber);
    await this.assertMobileNumberAvailable(user.uid, mobileNumber);

    const updated = await this.doctorModel
      .findByIdAndUpdate(
        getDocumentId(application),
        {
          $set: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            suffix,
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
            latitude: dto.latitude,
            longitude: dto.longitude,
            geoLocationUpdatedAt: hasGeoPin(dto) ? new Date() : undefined,
            yearsOfExperience: dto.yearsOfExperience,
            bio: dto.bio.trim(),
            displayOnPublicWebsite: dto.displayOnPublicWebsite,
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Doctor profile not found.');
    }

    return updated;
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
        latitude: dto.latitude,
        longitude: dto.longitude,
        geoLocationUpdatedAt: hasGeoPin(dto) ? new Date() : undefined,
        yearsOfExperience: dto.yearsOfExperience,
        bio: dto.bio.trim(),
        displayOnPublicWebsite: dto.displayOnPublicWebsite,
        applicationStatus: 'approved',
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
      andConditions.push(getSpecializationMatchCondition([specializationCode]));
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

    if (symptom && !specializationCode) {
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
        'regionName',
        'provinceName',
        'cityMunicipalityName',
        'barangayName',
        'latitude',
        'longitude',
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

  async recommendDoctors(
    dto: DoctorRecommendationDto,
  ): Promise<DoctorRecommendationResult> {
    const recommendation = await this.getAiDoctorRecommendation(dto);
    const doctors = await this.discoverDoctorsForSpecializations(
      recommendation.relatedSpecializations.map((item) => item.code),
      {
        query: dto.query,
        location: dto.location,
        symptom: [dto.symptom, ...recommendation.symptomKeywords].join(' '),
      },
    );

    return {
      ...recommendation,
      doctors,
      disclaimer:
        'Guidance only. This AI recommendation does not replace professional medical advice or emergency care.',
    };
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
        'regionName',
        'provinceName',
        'cityMunicipalityName',
        'barangayName',
        'latitude',
        'longitude',
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

  private async getAiDoctorRecommendation(
    dto: DoctorRecommendationDto,
  ): Promise<Omit<DoctorRecommendationResult, 'doctors' | 'disclaimer'>> {
    const specializationEntries = Object.entries(SPECIALIZATIONS);
    const fallback = recommendFromKeywords(dto.symptom);
    const prompt = [
      'You are helping a Philippine telehealth app route patients to the right doctor specialization.',
      'Return strict JSON only with keys: specializationCode, relatedSpecializationCodes, reasoning, symptomKeywords.',
      `Choose only from these specializations: ${specializationEntries.map(([code, name]) => `${code}: ${name}`).join('; ')}.`,
      `Patient symptoms/medical need: ${dto.symptom}`,
      dto.location ? `Patient location: ${dto.location}` : '',
      dto.query ? `Extra search text: ${dto.query}` : '',
      `A symptom may fit more than one doctor type. Put the best main match in specializationCode, then up to 3 relevant alternatives in relatedSpecializationCodes.`,
      `If uncertain, choose ${fallback.code}. Keep reasoning under 25 words. symptomKeywords should be a short array of useful search phrases.`,
    ]
      .filter(Boolean)
      .join('\n');

    for (const apiKey of getGeminiApiKeys()) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          },
        );

        if (!response.ok) {
          continue;
        }

        const payload = (await response.json()) as GeminiResponse;
        const text =
          payload.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? '')
            .join('')
            .trim() ?? '';

        if (!text) {
          continue;
        }

        const parsed = safeParseGeminiRecommendation(text);
        const specializationCode = sanitizeSpecializationCode(
          parsed?.specializationCode,
          fallback.code,
        );
        const relatedCodes = normalizeSpecializationCodes(
          parsed?.relatedSpecializationCodes,
          fallback.relatedSpecializations.map((item) => item.code),
          specializationCode,
        );

        return {
          specializationCode,
          specializationName: SPECIALIZATIONS[specializationCode],
          relatedSpecializations: relatedCodes.map((code) => ({
            code,
            name: SPECIALIZATIONS[code],
          })),
          reasoning:
            parsed?.reasoning?.trim() ||
            `Matched to ${SPECIALIZATIONS[specializationCode]} based on the described symptoms.`,
          symptomKeywords:
            parsed?.symptomKeywords?.filter(Boolean).slice(0, 5) ?? [],
        };
      } catch {
        continue;
      }
    }

    return {
      specializationCode: fallback.code,
      specializationName: fallback.name,
      relatedSpecializations: fallback.relatedSpecializations,
      reasoning: fallback.reasoning,
      symptomKeywords: fallback.keywords,
    };
  }

  private async discoverDoctorsForSpecializations(
    specializationCodes: string[],
    filters: {
      query?: string;
      symptom?: string;
      location?: string;
    },
  ): Promise<Doctor[]> {
    const query = filters.query?.trim();
    const symptom = filters.symptom?.trim();
    const location = filters.location?.trim();

    const andConditions: Record<string, unknown>[] = [
      { applicationStatus: 'approved' },
      { displayOnPublicWebsite: true },
      getSpecializationMatchCondition(specializationCodes),
    ];

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

    if (symptom && specializationCodes.length === 0) {
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
        'latitude',
        'longitude',
        'yearsOfExperience',
        'bio',
        'displayOnPublicWebsite',
      ])
      .sort({
        yearsOfExperience: -1,
        lastName: 1,
        firstName: 1,
      })
      .lean()
      .exec();
  }
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function safeParseGeminiRecommendation(value: string): {
  specializationCode?: string;
  relatedSpecializationCodes?: string[];
  reasoning?: string;
  symptomKeywords?: string[];
} | null {
  try {
    return JSON.parse(value) as {
      specializationCode?: string;
      relatedSpecializationCodes?: string[];
      reasoning?: string;
      symptomKeywords?: string[];
    };
  } catch {
    return null;
  }
}

function sanitizeSpecializationCode(
  value: string | undefined,
  fallbackCode: string,
): string {
  if (!value) {
    return fallbackCode;
  }

  const normalized = value.trim().toUpperCase();
  return normalized in SPECIALIZATIONS ? normalized : fallbackCode;
}

function getSpecializationMatchCondition(
  specializationCodes: string[],
): Record<string, unknown> {
  const normalizedCodes = specializationCodes
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code in SPECIALIZATIONS);
  const specializationNames = normalizedCodes.map(
    (code) => SPECIALIZATIONS[code],
  );

  return {
    $or: [
      { specializationCode: { $in: normalizedCodes } },
      ...specializationNames.map((name) => ({
        specializationName: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
      })),
    ],
  };
}

function hasGeoPin(
  dto: CreateDoctorApplicationDto | UpdateDoctorProfileDto,
): boolean {
  return typeof dto.latitude === 'number' && typeof dto.longitude === 'number';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getGeminiApiKeys(): string[] {
  const envList = [process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEY]
    .filter(Boolean)
    .flatMap((value) => value!.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(envList));
}

function recommendFromKeywords(input: string): {
  code: string;
  name: string;
  relatedSpecializations: Array<{ code: string; name: string }>;
  reasoning: string;
  keywords: string[];
} {
  const symptom = input.toLowerCase();
  const rules: Array<{
    code: string;
    keywords: string[];
    relatedCodes?: string[];
  }> = [
    {
      code: 'CARD',
      keywords: ['chest pain', 'palpitations', 'heart', 'bp'],
      relatedCodes: ['IM', 'GPHY'],
    },
    {
      code: 'PULMO',
      keywords: ['cough', 'asthma', 'shortness of breath'],
      relatedCodes: ['IM', 'GPHY'],
    },
    {
      code: 'PSYCH',
      keywords: ['anxiety', 'depression', 'panic', 'suicidal'],
      relatedCodes: ['PSYCHO', 'GPHY'],
    },
    {
      code: 'PSYCHO',
      keywords: ['stress', 'counseling', 'therapy'],
      relatedCodes: ['PSYCH', 'GPHY'],
    },
    {
      code: 'DERM',
      keywords: ['rash', 'itch', 'acne', 'skin'],
      relatedCodes: ['GPHY'],
    },
    {
      code: 'OBGYN',
      keywords: ['pregnancy', 'period', 'pelvic', 'vaginal'],
      relatedCodes: ['GPHY'],
    },
    {
      code: 'PEDIA',
      keywords: ['child', 'baby', 'infant', 'fever child'],
      relatedCodes: ['GPHY'],
    },
    {
      code: 'ENT',
      keywords: ['ear', 'nose', 'throat', 'sinus'],
      relatedCodes: ['GPHY'],
    },
    {
      code: 'NEURO',
      keywords: ['headache', 'seizure', 'migraine', 'numbness'],
      relatedCodes: ['IM', 'GPHY'],
    },
    {
      code: 'URO',
      keywords: ['urine', 'kidney', 'uti', 'prostate'],
      relatedCodes: ['IM', 'GPHY'],
    },
    {
      code: 'OPTH',
      keywords: ['eye', 'vision', 'blurred vision'],
      relatedCodes: ['GPHY'],
    },
    {
      code: 'REHAB',
      keywords: ['injury', 'stroke recovery', 'mobility'],
      relatedCodes: ['PHYTHERA', 'GPHY'],
    },
    {
      code: 'IM',
      keywords: [
        'diabetes',
        'hypertension',
        'cholesterol',
        'fatigue',
        'adult checkup',
      ],
      relatedCodes: ['GPHY', 'MEDSPEC'],
    },
  ];

  const matchedRule = rules.find((rule) =>
    rule.keywords.some((keyword) => symptom.includes(keyword)),
  );

  const code = matchedRule?.code ?? 'GPHY';
  const relatedCodes = normalizeSpecializationCodes(
    matchedRule?.relatedCodes,
    ['GPHY'],
    code,
  );
  return {
    code,
    name: SPECIALIZATIONS[code],
    relatedSpecializations: relatedCodes.map((item) => ({
      code: item,
      name: SPECIALIZATIONS[item],
    })),
    reasoning: `Matched to ${SPECIALIZATIONS[code]} with related alternatives using symptom keywords while AI recommendation is unavailable.`,
    keywords: matchedRule?.keywords.slice(0, 3) ?? [],
  };
}

function normalizeSpecializationCodes(
  input: string[] | undefined,
  fallbackCodes: string[],
  primaryCode: string,
): string[] {
  const values = (input && input.length > 0 ? input : fallbackCodes)
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value in SPECIALIZATIONS);

  const merged = [primaryCode, ...values];
  return Array.from(new Set(merged)).slice(0, 4);
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

function getDocumentId(document: unknown): string {
  if (
    typeof document === 'object' &&
    document !== null &&
    '_id' in document &&
    document._id
  ) {
    return String(document._id);
  }

  throw new NotFoundException('Document id is missing.');
}
