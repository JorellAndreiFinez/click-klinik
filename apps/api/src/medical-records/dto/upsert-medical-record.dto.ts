import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PrescriptionItemDto {
  @IsString()
  @MaxLength(120)
  medicine!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  dosage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  instruction?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  duration?: string;
}

class MedicalCertificateDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;
}

export class UpsertMedicalRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  consultationSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  publicNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  privateNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  recommendations?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  @ArrayMaxSize(20)
  @IsOptional()
  prescriptions?: PrescriptionItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500000)
  doctorSignatureDataUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  doctorSignatureText?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalCertificateDto)
  medicalCertificate?: MedicalCertificateDto;
}
