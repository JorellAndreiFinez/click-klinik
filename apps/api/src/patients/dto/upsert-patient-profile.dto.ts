import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertPatientProfileDto {
  @IsString()
  @MaxLength(60)
  firstName!: string;

  @IsString()
  @MaxLength(60)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  suffix?: string;

  @IsString()
  @Matches(/^\+639\d{9}$/, {
    message: 'Enter a valid Philippine mobile number.',
  })
  mobileNumber!: string;

  @IsDateString()
  birthdate!: string;

  @IsIn(['female', 'male', 'prefer_not_to_say'])
  sex!: string;

  @IsNumber()
  @Min(1)
  @Max(400)
  weightKg!: number;

  @IsNumber()
  @Min(30)
  @Max(260)
  heightCm!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactNumber?: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  allergies!: string[];

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  existingConditions!: string[];

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  currentMedications!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(600)
  basicMedicalHistory?: string;

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

  @IsBoolean()
  privacyPolicyAccepted!: boolean;

  @IsBoolean()
  healthDataProcessingAccepted!: boolean;

  @IsBoolean()
  aiAssistanceAccepted!: boolean;
}
