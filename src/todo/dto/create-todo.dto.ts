import { IsNotEmpty, IsOptional, IsString, MaxLength, IsEnum, IsDateString } from 'class-validator';
import { TodoPriority } from '../enums/todo.enum';

export class CreateTodoDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;
  uuid: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TodoPriority)
  priority?: TodoPriority;

  @IsDateString()
  dueDate: string;

  @IsString()
  userId: string;
}
