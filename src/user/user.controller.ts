import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';

interface JwtPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}
@Controller('user')
export class UserController {
  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@Req() req: Request & { user: JwtPayload }) {
    return req.user;
  }
}
