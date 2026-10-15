import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import type { AdminSettingsResponse } from '../contracts/admin.contract.js';
import { DEFAULT_SETTINGS, SETTINGS_LIMITS } from '../settings/game-settings.js';
import { UpdateSettingsDto } from '../settings/settings.dto.js';
import { SettingsService } from '../settings/settings.service.js';

@UseGuards(AdminGuard)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(): AdminSettingsResponse {
    return {
      settings: this.settingsService.get(),
      defaults: DEFAULT_SETTINGS,
      limits: SETTINGS_LIMITS,
    };
  }

  @Put()
  async update(@Body() body: UpdateSettingsDto): Promise<AdminSettingsResponse> {
    const settings = await this.settingsService.update(body);
    return { settings, defaults: DEFAULT_SETTINGS, limits: SETTINGS_LIMITS };
  }
}
