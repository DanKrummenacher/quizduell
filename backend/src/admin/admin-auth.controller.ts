import {
  BadRequestException,
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
import { ChangePasswordDto, LoginDto } from './admin.dto.js';
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
    if (!(await this.auth.checkPassword(body.password))) {
      throw new UnauthorizedException();
    }
    await this.audit.record('login', 'Angemeldet');
    return this.auth.issue();
  }

  /**
   * Sets a new password. Every session ends with it, so the caller gets a
   * fresh one to stay signed in.
   */
  @Post('password')
  @HttpCode(200)
  @UseGuards(AdminGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async changePassword(@Body() body: ChangePasswordDto): Promise<AdminSession> {
    if (body.newPassword === body.currentPassword) {
      throw new BadRequestException(
        'Das neue Passwort muss sich vom bisherigen unterscheiden.',
      );
    }
    await this.auth.changePassword(body.currentPassword, body.newPassword);
    await this.audit.record('password.change', 'Admin-Passwort geändert');
    return this.auth.issue();
  }

  /** Lets the admin check its token, e.g. after a reload. */
  @Get('session')
  @UseGuards(AdminGuard)
  session(): { ok: true } {
    return { ok: true };
  }
}
