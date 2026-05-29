import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHealthMonitoringLogDto {
  @IsOptional()
  @IsDateString()
  loggedAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(260)
  systolicBp?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(160)
  diastolicBp?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(600)
  glucoseMgDl?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperatureC?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(100)
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(240)
  pulseBpm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(400)
  weightKg?: number;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  symptoms!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(600)
  notes?: string;
}
