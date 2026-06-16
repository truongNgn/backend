import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Request, UnauthorizedException } from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';

@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  @Post() //C -> CREATE
  create(@Body() createTodoDto: CreateTodoDto, @Request() req: any): Promise<Todo> {

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.todoService.create(createTodoDto, userId);
  }

  @Get() //R -> READ ALL
  findAll(): Promise<Todo[]> {
    return this.todoService.findAll();
  }

  @Patch(':id') //U -> UPDATE by id
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() attrs: Partial<Todo>,
  ): Promise<Todo> {
    return this.todoService.update(id, attrs);
  }

  @Delete(':id') //D -> DELETE by id
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<Todo> {
    return this.todoService.remove(id);
  }
}

