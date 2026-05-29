import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestRefundDto {
  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  contactPreference?: string;
}
