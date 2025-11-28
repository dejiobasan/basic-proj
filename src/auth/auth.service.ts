import {
  ConflictException,
  Injectable,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, LoginDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthCookies {
  access_token?: string;
  refresh_token?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

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
        message: 'User created successfully',
        data: {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
        },
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

  async login(dto: LoginDto, res: Response) {
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

      const tokens = await this.signToken(foundUser.userId, foundUser.email);
      const accessToken = tokens.access_token;
      const refreshToken = tokens.refresh_token;
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return {
        message: 'Login successful',
        data: {
          userId: foundUser.userId,
          email: foundUser.email,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          phoneNumber: foundUser.phoneNumber,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(error.message);
      } else {
        throw error;
      }
    }
  }

  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return 'Logged out successfully';
  }

  async signToken(
    userId: string,
    email: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.REFRESH_SECRET,
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(req: Request, res: Response) {
    const cookies = req.cookies as AuthCookies;
    const refreshToken = cookies.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.REFRESH_SECRET,
      });

      const foundUser = await this.prisma.user.findUnique({
        where: {
          email: payload.email,
        },
      });

      if (!foundUser) throw new UnauthorizedException('User not found');

      const { access_token } = await this.signToken(payload.sub, payload.email);

      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      return {
        message: 'Access token refreshed successfully',
        data: {
          access_token,
          userId: foundUser.userId,
          email: foundUser.email,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          phoneNumber: foundUser.phoneNumber,
        },
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
