import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class createWalletDto {
  @ApiProperty({
    example: 'NGN',
    description: 'Wallet currency',
  })
  @IsString()
  @IsIn(['NGN'], { message: 'Only NGN currency is supported' })
  currency: 'NGN';
}

export class fundWalletDto {
  @ApiProperty({ example: 100.5, description: 'Amount to fund' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Amount must be positive' })
  amount: number;

  @ApiProperty({
    example: 'idempotency-key-123',
    description: 'Idempotency key to prevent duplicate transactions',
    required: false,
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({ example: 'Initial funding', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class transferDto {
  @ApiProperty({
    example: 'uuid-receiver-wallet-id',
    description: 'Receiver wallet ID',
  })
  @IsString()
  @IsUUID()
  receiverWalletId: string;

  @ApiProperty({ example: 50.25, description: 'Amount to transfer' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Amount must be positive' })
  amount: number;

  @ApiProperty({
    example: 'idempotency-key-456',
    description: 'Idempotency key to prevent duplicate transactions',
    required: false,
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({ example: 'Payment for services', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class TransactionResponseDto {
  @ApiProperty()
  success: boolean;
  @ApiProperty()
  statusCode: number;
  @ApiProperty()
  message: string;
  @ApiProperty({
    description: 'Transaction data',
    example: {
      transactionId: '12345678-1234-1234-1234-123456789012',
      type: 'funding',
      amount: '1000.00',
      currency: 'NGN',
      status: 'pending',
      senderWalletId: '12345678-1234-1234-1234-123456789012',
      receiverWalletId: '12345678-1234-1234-1234-123456789012',
      description: 'Initial funding',
      createdAt: '2021-01-01T00:00:00.000Z',
    },
  })
  data: {
    transactionId: string;
    type: string;
    amount: string;
    currency: string;
    status: string;
    senderWalletId?: string;
    receiverWalletId?: string;
    description?: string;
    createdAt: Date;
  };
}

export class WalletResponseDto {
  @ApiProperty()
  success: boolean;
  @ApiProperty()
  statusCode: number;
  @ApiProperty()
  message: string;
  @ApiProperty({
    description: 'Wallet data',
    example: {
      walletId: '12345678-1234-1234-1234-123456789012',
      userId: '12345678-1234-1234-1234-123456789012',
      currency: 'NGN',
      balance: '1000.00',
      createdAt: '2021-01-01T00:00:00.000Z',
      updatedAt: '2021-01-01T00:00:00.000Z',
      transactions: [
        {
          transactionId: '12345678-1234-1234-1234-123456789012',
          type: 'deposit',
          amount: '1000.00',
          currency: 'NGN',
          status: 'completed',
          createdAt: '2021-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  data: {
    walletId: string;
    userId: string;
    currency: string;
    balance: string;
    createdAt: Date;
    updatedAt: Date;
    transactions?: TransactionResponseDto[];
  };
}
