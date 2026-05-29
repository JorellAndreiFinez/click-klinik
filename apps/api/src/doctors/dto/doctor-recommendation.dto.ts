import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DoctorRecommendationDto {
  @IsString()
  @MaxLength(600)
  symptom!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;
}
