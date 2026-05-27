import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsMongoId()
  doctorId!: string;

  @IsMongoId()
  scheduleSlotId!: string;

  @IsString()
  scheduledStartAt!: string;

  @IsString()
  scheduledEndAt!: string;

  @IsString()
  consultationCode!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  @IsOptional()
  addOnCodes?: string[];

  @IsString()
  @IsIn(['pay_later', 'paymongo', 'xendit'])
  paymentProvider!: 'pay_later' | 'paymongo' | 'xendit';
}
