import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateScheduleSlotDto {
  @IsOptional()
  @IsIn(['available', 'unavailable'])
  status?: 'available' | 'unavailable';

  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @IsOptional()
  @IsISO8601()
  endAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  note?: string;
}
