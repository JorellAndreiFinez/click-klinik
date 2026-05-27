import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchDoctorsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  specializationCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  symptom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;
}
