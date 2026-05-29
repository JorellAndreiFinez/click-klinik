import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertMedicalCertificateDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsString()
  @MaxLength(8000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500000)
  doctorSignatureDataUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  doctorSignatureText?: string;
}
