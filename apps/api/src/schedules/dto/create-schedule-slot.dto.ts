import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateScheduleSlotDto {
  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;

  @IsIn(['available', 'unavailable'])
  status!: 'available' | 'unavailable';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  note?: string;
}
