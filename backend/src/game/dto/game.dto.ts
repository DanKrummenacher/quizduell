import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  playerName: string;
}

export class JoinGameDto {
  @IsString()
  @IsNotEmpty()
  gameCode: string;

  @IsString()
  @IsNotEmpty()
  playerName: string;
}

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  gameCode: string;

  @IsNumber()
  @Min(0)
  @Max(3)
  answerIndex: number;

  @IsNumber()
  @Min(0)
  timeTakenMs: number;
}
