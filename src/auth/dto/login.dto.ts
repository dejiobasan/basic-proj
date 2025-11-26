import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}

export class LoginResponseDto {
  @ApiProperty()
  success: boolean;
  @ApiProperty()
  statusCode: number;
  @ApiProperty()
  messasge: string;
  @ApiProperty({
    description: 'User data',
    example: {
      userId: '12345678-1234-1234-1234-123456789012',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
    },
  })
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    accessToken: string;
    refreshToken: string;
  };
  @ApiProperty()
  timestamp: string;
}
