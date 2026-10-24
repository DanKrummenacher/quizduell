import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  ADMIN_LIMITS,
  type BulkAction,
  type BulkRequest,
  type ImportRequest,
  type QuestionInput,
  type QuestionUpdate,
} from '../contracts/admin.contract.js';
import { ANSWER_OPTION_COUNT } from '../contracts/game.contract.js';

export class LoginDto {
  @IsString()
  @MaxLength(200)
  password: string;
}

/** Shape and rough limits; the service trims and checks the details. */
export class QuestionInputDto implements QuestionInput {
  @IsString()
  @MaxLength(ADMIN_LIMITS.questionText + 50)
  text: string;

  @IsArray()
  @ArrayMinSize(ANSWER_OPTION_COUNT)
  @ArrayMaxSize(ANSWER_OPTION_COUNT)
  @IsString({ each: true })
  @MaxLength(ADMIN_LIMITS.optionText + 50, { each: true })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(ANSWER_OPTION_COUNT - 1)
  correctIndex: number;

  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(ADMIN_LIMITS.category + 50)
  category: string | null;

  @IsBoolean()
  active: boolean;
}

export class QuestionUpdateDto extends QuestionInputDto implements QuestionUpdate {
  @IsOptional()
  @IsBoolean()
  resetStats?: boolean;
}

const BULK_ACTIONS: BulkAction[] = [
  'activate',
  'deactivate',
  'delete',
  'category',
  'reset',
];

export class BulkDto implements BulkRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @IsInt({ each: true })
  ids: number[];

  @IsIn(BULK_ACTIONS)
  action: BulkAction;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(ADMIN_LIMITS.category + 50)
  category?: string | null;
}

export class ImportDto implements ImportRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(ADMIN_LIMITS.importRows)
  @ValidateNested({ each: true })
  @Type(() => QuestionInputDto)
  questions: QuestionInputDto[];

  @IsBoolean()
  skipDuplicates: boolean;
}

export class AuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  before?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  /** `false` leaves out the sign-ins. */
  @IsOptional()
  @IsIn(['true', 'false'])
  logins?: 'true' | 'false';
}

export class RangeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsIn([7, 30, 90])
  range?: 7 | 30 | 90;
}

export class HistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(90)
  days?: number;
}
