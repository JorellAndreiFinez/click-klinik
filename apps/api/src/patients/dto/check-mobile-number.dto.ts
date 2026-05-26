import { IsString, Matches } from 'class-validator';

export class CheckMobileNumberDto {
  @IsString()
  @Matches(/^\+639\d{9}$/, {
    message: 'Enter a valid Philippine mobile number.',
  })
  mobileNumber!: string;
}
