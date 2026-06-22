import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, BadRequestException, Query } from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto'
import { QueryTodoDto } from './dto/query-todo.dto';

@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  @Post() //C -> CREATE
  create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    const { userId } = createTodoDto;
    if (!userId) {
      throw new BadRequestException('The provided parameters are invalid. User ID is required');
    }
    return this.todoService.create(createTodoDto);
  }

  @Get() //R -> READ ALL
  findAll(@Query() query :QueryTodoDto): Promise<{data : Todo[]; page :number ; limit: number; total:number}> {
    return this.todoService.findAll(
      query
    );
  }

  @Patch(':id') //U -> UPDATE by id
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTodoDto : UpdateTodoDto,
  ): Promise<Todo> {
    return this.todoService.update(id, updateTodoDto);
  }

  @Delete(':id') //D -> DELETE by id
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<Todo> {
    return this.todoService.remove(id);
  }
}

