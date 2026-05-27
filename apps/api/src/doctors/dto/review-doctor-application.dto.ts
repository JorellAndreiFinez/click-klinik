import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewDoctorApplicationDto {
  @IsIn(['approved', 'rejected'])
  action!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reviewNotes?: string;
}
