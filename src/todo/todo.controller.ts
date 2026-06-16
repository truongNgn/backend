import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from '../entities/todo.entity';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  @Post() //C -> CREATE
  create(@Body('title') title: string, @Body('completed') completed?: boolean): Promise<Todo> {
    return this.todoService.create(title, completed);
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
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.todoService.remove(id);
  }
}

