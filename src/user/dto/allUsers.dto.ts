import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (default: 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page (default: 10)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'john', description: 'Search users by name' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class UserListItemDto {
  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: '+1234567890' })
  phoneNumber: string;
}

export class PaginatedUsersResponseDto {
  @ApiProperty()
  success: boolean;
  @ApiProperty()
  statusCode: number;
  @ApiProperty()
  messasge: string;
  @ApiProperty({
    description: 'User data',
    example: {
      users: [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
        },
      ],
      currentPage: 1,
      totalPages: 1,
      totalUsers: 1,
    },
  })
  data: {
    users: UserListItemDto[];
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
  @ApiProperty()
  timestamp: string;
}

export class userResponseDto {
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
  };
  @ApiProperty()
  timestamp: string;
}
