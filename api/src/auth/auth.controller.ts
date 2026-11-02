import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class LoginDto {
  email!: string;
  password!: string;
}

class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() request: { user: { sub: string } }, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(request.user.sub, body.currentPassword, body.newPassword);
  }
}
