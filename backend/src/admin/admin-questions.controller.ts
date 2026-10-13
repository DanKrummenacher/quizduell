import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import type {
  AdminQuestion,
  DeleteResult,
  ImportResult,
} from '../contracts/admin.contract.js';
import { QuestionDto, SetActiveDto } from '../questions/questions.dto.js';
import { QuestionsService } from '../questions/questions.service.js';

@UseGuards(AdminGuard)
@Controller('admin/questions')
export class AdminQuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  list(): Promise<AdminQuestion[]> {
    return this.questionsService.list();
  }

  @Post()
  create(@Body() body: QuestionDto): Promise<AdminQuestion> {
    return this.questionsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: QuestionDto,
  ): Promise<AdminQuestion> {
    return this.questionsService.update(id, body);
  }

  @Patch(':id/active')
  setActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SetActiveDto,
  ): Promise<AdminQuestion> {
    return this.questionsService.setActive(id, body.active);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.questionsService.remove(id);
  }

  @Delete()
  async removeAll(): Promise<DeleteResult> {
    return { deleted: await this.questionsService.removeAll() };
  }

  @Post('import-samples')
  async importSamples(): Promise<ImportResult> {
    return { imported: await this.questionsService.importSamples() };
  }
}
