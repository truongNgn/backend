import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from '../todo.entity';

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
    @Param('id', ParseIntPipe) id: number,
    @Body() attrs: Partial<Todo>,
  ): Promise<Todo> {
    return this.todoService.update(id, attrs);
  }

  @Delete(':id') //D -> DELETE by id
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.todoService.remove(id);
  }
}

