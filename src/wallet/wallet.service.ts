import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createWalletDto, fundWalletDto, transferDto } from './dto/wallet.dto';
import { Decimal } from 'generated/prisma/internal/prismaNamespace';
import { TransactionType, TransactionStatus } from 'generated/prisma/enums';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async createWallet(userId: string, dto: createWalletDto) {
    const { currency } = dto;
    const existingWallet = await this.prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    if (existingWallet) {
      throw new ConflictException(
        `Wallet with currency ${currency} already exists for this user`,
      );
    }

    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        currency,
        balance: new Decimal(0),
      },
    });

    return {
      message: 'Wallet created successfully',
      data: {
        walletId: wallet.walletId,
        userId: wallet.userId,
        currency: wallet.currency,
        balance: wallet.balance,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
    };
  }

  async fundWallet(userId: string, walletId: string, dto: fundWalletDto) {
    const { amount, idempotencyKey, description } = dto;
    if (idempotencyKey) {
      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { idempotencyKey },
      });

      if (existingTransaction) {
        const wallet = await this.prisma.wallet.findUnique({
          where: { walletId },
        });
        if (!wallet) throw new NotFoundException('Wallet not found!');

        return {
          message: 'Transaction already exists',
          data: {
            walletId: wallet.walletId,
            userId: wallet.userId,
            currency: wallet.currency,
            balance: wallet.balance.toString(),
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
            transactions: [
              {
                transactionId: existingTransaction.transactionId,
                type: existingTransaction.type.toLowerCase(),
                amount: existingTransaction.amount.toString(),
                currency: existingTransaction.currency,
                status: existingTransaction.status.toLowerCase(),
                description: existingTransaction.description || null,
                createdAt: existingTransaction.createdAt,
              },
            ],
          },
        };
      }
    }
    const wallet = await this.prisma.wallet.findFirst({
      where: { walletId, userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found!');
    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.FUNDING,
          amount: new Decimal(amount),
          currency: wallet.currency,
          status: TransactionStatus.COMPLETED,
          walletId: wallet.walletId,
          description,
          idempotencyKey,
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { increment: new Decimal(amount) } },
      });

      return { updatedWallet, transaction };
    });

    return {
      message: 'Wallet funded successfully',
      data: {
        walletId: result.updatedWallet.walletId,
        userId: result.updatedWallet.userId,
        currency: result.updatedWallet.currency,
        balance: result.updatedWallet.balance.toString(),
        createdAt: result.updatedWallet.createdAt,
        updatedAt: result.updatedWallet.updatedAt,
        transactions: [
          {
            transactionId: result.transaction.transactionId,
            type: result.transaction.type.toLowerCase(),
            amount: result.transaction.amount.toString(),
            currency: result.transaction.currency,
            status: result.transaction.status.toLowerCase(),
            description: result.transaction.description || null,
            createdAt: result.transaction.createdAt,
          },
        ],
      },
    };
  }

  async transfer(userId: string, walletId: string, dto: transferDto) {
    const { receiverWalletId, amount, idempotencyKey, description } = dto;

    if (idempotencyKey) {
      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { idempotencyKey },
      });

      if (existingTransaction) {
        const wallet = await this.prisma.wallet.findUnique({
          where: { walletId: walletId },
        });
        if (!wallet) throw new NotFoundException('Wallet not found!');
        return {
          message: 'Transaction already exists',
          data: {
            walletId: wallet.walletId,
            userId: wallet.userId,
            currency: wallet.currency,
            balance: wallet.balance.toString(),
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
            transactions: [
              {
                transactionId: existingTransaction.transactionId,
                type: existingTransaction.type.toLowerCase(),
                amount: existingTransaction.amount.toString(),
                currency: existingTransaction.currency,
                status: existingTransaction.status.toLowerCase(),
                description: existingTransaction.description || null,
                createdAt: existingTransaction.createdAt,
              },
            ],
          },
        };
      }
    }

    const senderWallet = await this.prisma.wallet.findFirst({
      where: {
        walletId: walletId,
        userId,
      },
    });

    if (!senderWallet) throw new NotFoundException('Sender wallet not found!');

    const receiverWallet = await this.prisma.wallet.findUnique({
      where: { walletId: receiverWalletId },
    });

    if (!receiverWallet) {
      throw new NotFoundException('Receiver wallet not found');
    }

    if (senderWallet.walletId === receiverWallet.walletId) {
      throw new BadRequestException('Cannot transfer to the same wallet');
    }

    if (senderWallet.currency !== receiverWallet.currency) {
      throw new BadRequestException(
        'Cannot transfer between wallets with different currencies',
      );
    }

    const senderBalance = new Decimal(senderWallet.balance.toString());
    const transferAmount = new Decimal(amount);

    if (senderBalance.lessThan(transferAmount)) {
      throw new BadRequestException('Insufficient balance');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.TRANSFER,
          amount: transferAmount,
          currency: senderWallet.currency,
          status: TransactionStatus.COMPLETED,
          senderWalletId: senderWallet.walletId,
          receiverWalletId: receiverWallet.walletId,
          description,
          idempotencyKey,
        },
      });

      const updatedSenderWallet = await tx.wallet.update({
        where: { walletId: senderWallet.walletId },
        data: { balance: { decrement: transferAmount } },
      });

      const updatedReceiverWallet = await tx.wallet.update({
        where: { walletId: receiverWallet.walletId },
        data: { balance: { increment: transferAmount } },
      });

      return { updatedSenderWallet, updatedReceiverWallet, transaction };
    });

    return {
      message: 'Transfer successful',
      data: {
        walletId: result.updatedSenderWallet.walletId,
        userId: result.updatedSenderWallet.userId,
        currency: result.updatedSenderWallet.currency,
        balance: result.updatedSenderWallet.balance.toString(),
        createdAt: result.updatedSenderWallet.createdAt,
        updatedAt: result.updatedSenderWallet.updatedAt,
        transactions: [
          {
            transactionId: result.transaction.transactionId,
            type: result.transaction.type.toLowerCase(),
            amount: result.transaction.amount.toString(),
            currency: result.transaction.currency,
            status: result.transaction.status.toLowerCase(),
            senderWalletId: result.transaction.senderWalletId,
            receiverWalletId: result.transaction.receiverWalletId,
            description: result.transaction.description || null,
            createdAt: result.transaction.createdAt,
          },
        ],
      },
    };
  }

  async getUserWallets(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
    });
    return {
      message: 'Wallets fetched successfully',
      data: {
        wallets: wallets.map((wallet) => ({
          walletId: wallet.walletId,
          userId: wallet.userId,
          currency: wallet.currency,
          balance: wallet.balance.toString(),
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        })),
      },
    };
  }

  async getUserWalletsTransactionHistory(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { walletId, userId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        walletId: walletId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      message: 'Transactions fetched successfully',
      data: {
        transactions: transactions.map((transaction) => ({
          transactionId: transaction.transactionId,
          type: transaction.type.toLowerCase(),
          amount: transaction.amount.toString(),
          currency: transaction.currency,
          status: transaction.status.toLowerCase(),
          senderWalletId: transaction.senderWalletId,
          receiverWalletId: transaction.receiverWalletId,
          description: transaction.description || null,
          createdAt: transaction.createdAt,
        })),
      },
    };
  }
}
