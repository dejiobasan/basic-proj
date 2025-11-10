import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, LoginDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: AuthDto) {
    try {
      const hash = await argon.hash(dto.password);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phoneNumber: dto.phoneNumber,
        },
      });
      return {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists!');
        }
        throw error;
      } else {
        throw error;
      }
    }
  }

  async login(dto: LoginDto) {
    try {
      const foundUser = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });
      if (!foundUser) throw new UnauthorizedException('Invalid credentials!');

      const isPasswordValid = await argon.verify(
        foundUser.password,
        dto.password,
      );
      if (!isPasswordValid)
        throw new UnauthorizedException('Invalid credentials!');
      return {
        userId: foundUser.userId,
        email: foundUser.email,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        phoneNumber: foundUser.phoneNumber,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(error.message);
      } else {
        throw error;
      }
    }
  }

  logout() {
    return 'hello';
  }
}
