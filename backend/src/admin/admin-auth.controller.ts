import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, Length } from 'class-validator';
import { AdminGuard, bearerToken } from '../auth/admin.guard.js';
import { AuthService } from '../auth/auth.service.js';
import type { LoginRequest, LoginResponse } from '../contracts/admin.contract.js';

/** Overridable for automated end-to-end tests only. */
function loginAttemptsPerMinute(): number {
  const configured = Number(process.env['ADMIN_LOGIN_ATTEMPTS_PER_MINUTE']);
  return Number.isInteger(configured) && configured > 0 ? configured : 5;
}

class LoginDto implements LoginRequest {
  @IsString()
  @Length(1, 200)
  password: string;
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  /** Max. 5 attempts per minute and IP against brute force. */
  @Throttle({ default: { limit: loginAttemptsPerMinute, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto): Promise<LoginResponse> {
    return this.authService.login(body.password);
  }

  @UseGuards(AdminGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Headers('authorization') authorization: string): Promise<void> {
    const token = bearerToken(authorization);
    if (token) {
      await this.authService.logout(token);
    }
  }

  @UseGuards(AdminGuard)
  @Get('session')
  session(): { valid: true } {
    return { valid: true };
  }
}
