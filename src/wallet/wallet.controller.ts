import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import {
  createWalletDto,
  fundWalletDto,
  transferDto,
  WalletResponseDto,
} from './dto/wallet.dto';
interface JwtPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('create')
  @ApiCreatedResponse({
    description: 'Wallet created successfully',
    type: WalletResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Wallet already exists' })
  async createWallet(
    @Req() req: Request & { user: JwtPayload },
    @Body() createWalletDto: createWalletDto,
  ) {
    const userId = req.user.userId;
    return this.walletService.createWallet(userId, createWalletDto);
  }

  @Post('fund/:walletId')
  @ApiCreatedResponse({
    description: 'Wallet funded successfully',
    type: WalletResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 400, description: 'Invalid amount' })
  async fundWallet(
    @Req() req: Request & { user: JwtPayload },
    @Param('walletId') walletId: string,
    @Body() fundWalletDto: fundWalletDto,
  ) {
    const userId = req.user.userId;
    return this.walletService.fundWallet(userId, walletId, fundWalletDto);
  }

  @Post('transfer/:walletId')
  @ApiCreatedResponse({
    description: 'Wallet transferred successfully',
    type: WalletResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 400, description: 'Invalid amount' })
  async transfer(
    @Req() req: Request & { user: JwtPayload },
    @Param('walletId') walletId: string,
    @Body() transferDto: transferDto,
  ) {
    const userId = req.user.userId;
    return this.walletService.transfer(userId, walletId, transferDto);
  }

  @Get('wallets')
  @ApiCreatedResponse({
    description: 'Wallets fetched successfully',
    type: WalletResponseDto,
  })
  async getUserWallets(@Req() req: Request & { user: JwtPayload }) {
    const userId = req.user.userId;
    return this.walletService.getUserWallets(userId);
  }

  @Get('transactions/:walletId')
  @ApiCreatedResponse({
    description: 'Transactions fetched successfully',
    type: WalletResponseDto,
  })
  async getUserWalletsTransactionHistory(
    @Req() req: Request & { user: JwtPayload },
    @Param('walletId') walletId: string,
  ) {
    const userId = req.user.userId;
    return this.walletService.getUserWalletsTransactionHistory(
      userId,
      walletId,
    );
  }
}
