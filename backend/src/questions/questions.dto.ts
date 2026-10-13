import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import type { QuestionInput } from '../contracts/admin.contract.js';
import { ANSWER_OPTION_COUNT } from '../contracts/game.contract.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimAll = ({ value }: { value: unknown }): unknown =>
  Array.isArray(value)
    ? value.map((item: unknown) => (typeof item === 'string' ? item.trim() : item))
    : value;

const emptyToNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value ?? null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export class QuestionDto implements QuestionInput {
  @Transform(trim)
  @IsString()
  @Length(5, 300)
  text: string;

  @Transform(trimAll)
  @IsArray()
  @ArrayMinSize(ANSWER_OPTION_COUNT)
  @ArrayMaxSize(ANSWER_OPTION_COUNT)
  @IsString({ each: true })
  @Length(1, 100, { each: true })
  @ArrayUnique((option: string) => option.toLowerCase(), {
    message: 'options must be unique',
  })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(ANSWER_OPTION_COUNT - 1)
  correctIndex: number;

  @Transform(emptyToNull)
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Length(1, 50)
  category: string | null;

  @IsBoolean()
  active: boolean;
}

export class SetActiveDto {
  @IsBoolean()
  active: boolean;
}
