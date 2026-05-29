import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AppointmentTriageDto {
  @IsString()
  @IsIn(['google_meet', 'physical_visit', 'cellular'])
  consultMethod!: 'google_meet' | 'physical_visit' | 'cellular';

  @IsString()
  @MaxLength(500)
  chiefComplaint!: string;

  @IsString()
  @MaxLength(5000)
  detailedSymptoms!: string;

  @IsString()
  onsetDate!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  medications!: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  allergies!: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  healthProblems!: string[];

  @IsString()
  @IsIn(['yes', 'no', 'prefer_not_to_say'])
  smokes!: 'yes' | 'no' | 'prefer_not_to_say';

  @IsString()
  @IsIn(['yes', 'no', 'prefer_not_to_say'])
  drinksAlcohol!: 'yes' | 'no' | 'prefer_not_to_say';

  @IsBoolean()
  insurancePartnersConsent!: boolean;

  @IsBoolean()
  laboratoryPartnersConsent!: boolean;

  @IsBoolean()
  pharmacyPartnersConsent!: boolean;

  @IsBoolean()
  emergencyDisclosureConsent!: boolean;
}

export class CreateAppointmentDto {
  @IsMongoId()
  doctorId!: string;

  @IsMongoId()
  scheduleSlotId!: string;

  @IsString()
  scheduledStartAt!: string;

  @IsString()
  scheduledEndAt!: string;

  @IsString()
  consultationCode!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  @IsOptional()
  addOnCodes?: string[];

  @IsString()
  @IsIn(['xendit'])
  paymentProvider!: 'xendit';

  @IsString()
  @IsIn(['pay_now', 'pay_after_consultation'])
  @IsOptional()
  paymentPlan?: 'pay_now' | 'pay_after_consultation';

  @ValidateNested()
  @Type(() => AppointmentTriageDto)
  triage!: AppointmentTriageDto;
}
