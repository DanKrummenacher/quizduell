import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AdminSession } from '../contracts/admin.contract.js';
import { AdminAuthService } from './admin-auth.service.js';
import { LoginDto } from './admin.dto.js';
import { AdminGuard } from './admin.guard.js';
import { AuditService } from './audit.service.js';

@Controller('admin')
export class AdminAuthController {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly audit: AuditService,
  ) {}

  /** Few attempts per minute and IP make guessing the password hopeless. */
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() body: LoginDto): Promise<AdminSession> {
    if (!this.auth.checkPassword(body.password)) {
      throw new UnauthorizedException();
    }
    await this.audit.record('login', 'Angemeldet');
    return this.auth.issue();
  }

  /** Lets the admin check its token, e.g. after a reload. */
  @Get('session')
  @UseGuards(AdminGuard)
  session(): { ok: true } {
    return { ok: true };
  }
}
