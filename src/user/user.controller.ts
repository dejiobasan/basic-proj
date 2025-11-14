import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import {
  GetUsersQueryDto,
  PaginatedUsersResponseDto,
} from './dto/allUsers.dto';
import { UserService } from './user.service';

interface JwtPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('me')
  getMe(@Req() req: Request & { user: JwtPayload }) {
    return req.user;
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Get('allUsers')
  @ApiOkResponse({
    description: 'Paginated list of users',
    type: PaginatedUsersResponseDto,
  })
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.userService.getAllUsers(query);
  }
}
