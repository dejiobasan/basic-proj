import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUsersQueryDto } from './dto/allUsers.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(query: GetUsersQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const skip = (page - 1) * limit;

    const whereClause = search
      ? {
          OR: [
            {
              firstName: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              lastName: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const [users, totalUsers] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      message: 'Users fetched successfully',
      data: {
        users,
        currentPage: page,
        totalPages,
        totalUsers,
      },
    };
  }
}
