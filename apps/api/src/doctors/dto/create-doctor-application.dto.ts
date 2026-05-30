import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const SPECIALIZATION_CODES = [
  'CARD',
  'DERM',
  'IMMONCO',
  'GPHY',
  'GP',
  'GS',
  'IM',
  'CARDADULT',
  'HEMA',
  'IMID',
  'PULMO',
  'MEDSPEC',
  'NEURO',
  'OBGYN',
  'OPTH',
  'ENT',
  'PEDIA',
  'PHYTHERA',
  'PSYCH',
  'PSYCHO',
  'REHAB',
  'URO',
  'OTHER',
] as const;

export class CreateDoctorApplicationDto {
  @IsString()
  @MaxLength(60)
  firstName!: string;

  @IsString()
  @MaxLength(60)
  lastName!: string;

  @IsIn(['MD', 'DO', 'RPsy', 'RPT', 'Other'])
  suffix!: string;

  @ValidateIf((dto: CreateDoctorApplicationDto) => dto.suffix === 'Other')
  @IsString()
  @MaxLength(20)
  otherSuffix?: string;

  @IsString()
  @Matches(/^\+639\d{9}$/, {
    message: 'Enter a valid Philippine mobile number.',
  })
  mobileNumber!: string;

  @IsString()
  @MaxLength(40)
  prcLicenseNumber!: string;

  @IsIn(SPECIALIZATION_CODES)
  specializationCode!: (typeof SPECIALIZATION_CODES)[number];

  @ValidateIf(
    (dto: CreateDoctorApplicationDto) => dto.specializationCode === 'OTHER',
  )
  @IsString()
  @MaxLength(100)
  otherSpecialization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  clinicOrHospital?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsString()
  @MaxLength(20)
  regionCode!: string;

  @IsString()
  @MaxLength(120)
  regionName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  provinceCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  provinceName?: string;

  @IsString()
  @MaxLength(20)
  cityMunicipalityCode!: string;

  @IsString()
  @MaxLength(120)
  cityMunicipalityName!: string;

  @IsString()
  @MaxLength(20)
  barangayCode!: string;

  @IsString()
  @MaxLength(120)
  barangayName!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsInt()
  @Min(0)
  @Max(70)
  yearsOfExperience!: number;

  @IsString()
  @MaxLength(600)
  bio!: string;

  @IsBoolean()
  displayOnPublicWebsite!: boolean;

  @IsBoolean()
  credentialReviewConsent!: boolean;
}
