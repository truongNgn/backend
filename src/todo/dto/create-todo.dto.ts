import { IsNotEmpty, IsOptional, IsString, MaxLength, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TodoPriority } from '../enums/todo.enum';

export class CreateTodoDto {
  @ApiProperty({ example: 'Buy groceries', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  uuid: string;

  @ApiPropertyOptional({ example: 'Milk, eggs, and bread from the store' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TodoPriority, example: TodoPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TodoPriority)
  priority?: TodoPriority;

  @ApiProperty({ example: '2026-06-30T00:00:00.000Z' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  userId: string;
}
