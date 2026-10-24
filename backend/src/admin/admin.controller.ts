import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminQuestion,
  AdminSettingsView,
  Analytics,
  AuditPage,
  BulkResult,
  Hint,
  ImportResult,
  LiveSnapshot,
  QuestionDay,
} from '../contracts/admin.contract.js';
import { GameService } from '../game/game.service.js';
import { QuestionsService } from '../questions/questions.service.js';
import { DEFAULT_SETTINGS, SETTINGS_LIMITS } from '../settings/game-settings.js';
import { UpdateSettingsDto } from '../settings/settings.dto.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  AuditQueryDto,
  BulkDto,
  HistoryQueryDto,
  ImportDto,
  QuestionInputDto,
  QuestionUpdateDto,
  RangeQueryDto,
} from './admin.dto.js';
import { AdminGuard } from './admin.guard.js';
import { AnalyticsService } from './analytics.service.js';
import { AuditService } from './audit.service.js';
import { describeSettingsChange, shorten } from './audit-text.js';
import { HintsService } from './hints.service.js';

const HINT_KEY = /^[a-z-]+(:\d+)?$/;

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly questions: QuestionsService,
    private readonly settings: SettingsService,
    private readonly game: GameService,
    private readonly analytics: AnalyticsService,
    private readonly hints: HintsService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Live and analytics
  // ---------------------------------------------------------------------------

  @Get('live')
  live(): LiveSnapshot {
    return this.game.getLiveSnapshot();
  }

  @Get('analytics')
  getAnalytics(@Query() query: RangeQueryDto): Promise<Analytics> {
    return this.analytics.get(query.range ?? 30);
  }

  // ---------------------------------------------------------------------------
  // Questions
  // ---------------------------------------------------------------------------

  @Get('questions')
  listQuestions(): Promise<AdminQuestion[]> {
    return this.questions.listForAdmin();
  }

  @Get('questions/:id/history')
  questionHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryQueryDto,
  ): Promise<QuestionDay[]> {
    return this.questions.history(id, query.days ?? 30);
  }

  @Post('questions')
  async createQuestion(@Body() body: QuestionInputDto): Promise<AdminQuestion> {
    const row = await this.questions.create(body);
    await this.audit.record(
      'question.create',
      `Frage F-${row.id} erfasst: «${shorten(row.text)}»`,
    );
    return this.questions.getForAdmin(row.id);
  }

  @Put('questions/:id')
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: QuestionUpdateDto,
  ): Promise<AdminQuestion> {
    const { resetStats = false, ...input } = body;
    const { before, after } = await this.questions.update(id, input, resetStats);
    const changes: string[] = [];
    if (before.text !== after.text) {
      changes.push('Text');
    }
    if (before.options.join('\n') !== after.options.join('\n')) {
      changes.push('Antworten');
    }
    if (before.correctIndex !== after.correctIndex) {
      changes.push('richtige Antwort');
    }
    if (before.category !== after.category) {
      changes.push('Kategorie');
    }
    if (before.active !== after.active) {
      changes.push(after.active ? 'aktiviert' : 'pausiert');
    }
    if (resetStats) {
      changes.push('Statistik zurückgesetzt');
    }
    await this.audit.record(
      'question.update',
      `Frage F-${id} geändert${changes.length ? ` (${changes.join(', ')})` : ''}: «${shorten(after.text)}»`,
    );
    return this.questions.getForAdmin(id);
  }

  @Delete('questions/:id')
  @HttpCode(204)
  async deleteQuestion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const row = await this.questions.remove(id);
    await this.hints.forgetQuestion(id);
    await this.audit.record(
      'question.delete',
      `Frage F-${id} gelöscht: «${shorten(row.text)}»`,
    );
  }

  @Post('questions/bulk')
  @HttpCode(200)
  async bulk(@Body() body: BulkDto): Promise<BulkResult> {
    const ids = [...new Set(body.ids)];
    let affected = 0;
    let summary = '';
    switch (body.action) {
      case 'activate':
        affected = await this.questions.setActive(ids, true);
        summary = `${questions(ids, affected)} aktiviert`;
        break;
      case 'deactivate':
        affected = await this.questions.setActive(ids, false);
        summary = `${questions(ids, affected)} pausiert`;
        break;
      case 'category': {
        if (body.category === undefined) {
          throw new BadRequestException('Die Kategorie fehlt.');
        }
        affected = await this.questions.setCategory(ids, body.category);
        const category = body.category?.trim();
        summary = category
          ? `${questions(ids, affected)} in die Kategorie «${shorten(category)}» verschoben`
          : `Kategorie entfernt bei ${questions(ids, affected)}`;
        break;
      }
      case 'reset':
        affected = await this.questions.resetStats(ids);
        summary = `Statistik zurückgesetzt bei ${questions(ids, affected)}`;
        break;
      case 'delete':
        affected = await this.questions.removeMany(ids);
        for (const id of ids) {
          await this.hints.forgetQuestion(id);
        }
        summary = `${questions(ids, affected)} gelöscht`;
        break;
    }
    if (affected > 0) {
      await this.audit.record('questions.bulk', summary);
    }
    return { affected };
  }

  @Post('questions/import')
  @HttpCode(200)
  async importQuestions(@Body() body: ImportDto): Promise<ImportResult> {
    const result = await this.questions.importMany(
      body.questions,
      body.skipDuplicates,
    );
    if (result.imported > 0) {
      await this.audit.record(
        'questions.import',
        `${result.imported === 1 ? '1 Frage' : `${result.imported} Fragen`} importiert` +
          (result.skipped ? `, ${result.skipped} doppelte übersprungen` : ''),
      );
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  @Get('settings')
  getSettings(): Promise<AdminSettingsView> {
    return this.settingsView();
  }

  @Put('settings')
  async updateSettings(@Body() body: UpdateSettingsDto): Promise<AdminSettingsView> {
    const before = this.settings.get();
    const after = await this.settings.update(body);
    const summary = describeSettingsChange(before, after);
    if (summary) {
      await this.audit.record('settings.update', summary, { before, after });
    }
    return this.settingsView();
  }

  // ---------------------------------------------------------------------------
  // Hints
  // ---------------------------------------------------------------------------

  @Get('hints')
  listHints(): Promise<Hint[]> {
    return this.hints.list();
  }

  @Post('hints/:key/ignore')
  @HttpCode(204)
  async ignoreHint(@Param('key') key: string): Promise<void> {
    this.assertHintKey(key);
    await this.hints.ignore(key);
    await this.audit.record('hint.ignore', `Hinweis ${hintLabel(key)} ignoriert`);
  }

  @Delete('hints/:key/ignore')
  @HttpCode(204)
  async restoreHint(@Param('key') key: string): Promise<void> {
    this.assertHintKey(key);
    await this.hints.restore(key);
    await this.audit.record(
      'hint.restore',
      `Hinweis ${hintLabel(key)} wieder aktiv`,
    );
  }

  // ---------------------------------------------------------------------------
  // Audit log
  // ---------------------------------------------------------------------------

  @Get('audit')
  auditLog(@Query() query: AuditQueryDto): Promise<AuditPage> {
    return this.audit.page(
      query.limit ?? 50,
      query.before,
      query.logins !== 'false',
    );
  }

  /** Sets the rules back to how they were before entry `id`. */
  @Post('audit/:id/restore')
  @HttpCode(200)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<AdminSettingsView> {
    const target = await this.audit.settingsBefore(id);
    const before = this.settings.get();
    const after = await this.settings.update(target);
    const change = describeSettingsChange(before, after);
    if (change) {
      await this.audit.record('settings.restore', `Wiederhergestellt: ${change}`, {
        before,
        after,
      });
    }
    return this.settingsView();
  }

  private async settingsView(): Promise<AdminSettingsView> {
    return {
      settings: this.settings.get(),
      limits: SETTINGS_LIMITS,
      defaults: DEFAULT_SETTINGS,
      updatedAt: (await this.audit.lastSettingsChange())?.toISOString() ?? null,
    };
  }

  private assertHintKey(key: string): void {
    if (!HINT_KEY.test(key) || key.length > 80) {
      throw new BadRequestException();
    }
  }
}

/** «F-12» for one question, «3 Fragen» for several. */
function questions(ids: number[], affected: number): string {
  if (affected === 1 && ids.length === 1) {
    return `F-${ids[0]}`;
  }
  return affected === 1 ? '1 Frage' : `${affected} Fragen`;
}

function hintLabel(key: string): string {
  const [, id] = key.split(':');
  return id ? `zu Frage F-${id}` : 'zum Fragenbestand';
}
