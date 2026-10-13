import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, Length } from 'class-validator';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthService } from '../auth/auth.service.js';
import type { LoginRequest, LoginResponse } from '../contracts/admin.contract.js';

class LoginDto implements LoginRequest {
  @IsString()
  @Length(1, 200)
  password: string;
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  /** Max. 5 attempts per minute and IP against brute force. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto): Promise<LoginResponse> {
    return this.authService.login(body.password);
  }

  @UseGuards(AdminGuard)
  @Get('session')
  session(): { valid: true } {
    return { valid: true };
  }
}
