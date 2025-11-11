import { Body, Controller, Post, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, AuthResponseDto, LoginDto, LoginResponseDto } from './dto';
import { Response, Request } from 'express';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  register(@Body() dto: AuthDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOkResponse({
    description: 'User successfully logged in',
    type: LoginResponseDto,
  })
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Post('logout')
  @ApiOkResponse({ description: 'User successfully logged out' })
  logout(@Res() res: Response) {
    return this.authService.logout(res);
  }

  @Get('refresh')
  @ApiOkResponse({ description: 'Access token successfully refreshed' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(req, res);
  }
}
