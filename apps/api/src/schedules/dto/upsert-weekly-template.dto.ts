import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class WeeklyTemplateEntryDto {
  @IsIn([0, 1, 2, 3, 4, 5, 6])
  dayOfWeek!: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  @IsIn(['off', 'available'])
  status!: 'off' | 'available';

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime?: string;
}

export class UpsertWeeklyTemplateDto {
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WeeklyTemplateEntryDto)
  entries!: WeeklyTemplateEntryDto[];
}

export type WeeklyTemplateEntryInput = WeeklyTemplateEntryDto;
