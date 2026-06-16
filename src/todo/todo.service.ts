import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) { }

  async create(createTodoDto: CreateTodoDto): Promise<Todo> { //CREATE
    const { title, description, priority, dueDate, userId } = createTodoDto;
    const todo = this.todoRepository.create({
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId,
    });


    return this.todoRepository.save(todo);
  }

  async findAll(): Promise<Todo[]> { //READ ALL
    return this.todoRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Todo> {  //READ SINGLE by id
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }
    return todo;
  }

  async update(id: string, attrs: Partial<Todo>): Promise<Todo> { //UPDATE by id 
    const todo = await this.findOne(id);
    Object.assign(todo, attrs);
    return this.todoRepository.save(todo);
  }

  async remove(id: string): Promise<Todo> { //DELETE by id
    const todo = await this.findOne(id);
    return await this.todoRepository.softRemove(todo);
  }
}

