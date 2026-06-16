import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) { }

  async create(title: string, completed?: boolean): Promise<Todo> { //CREATE
    const todo = this.todoRepository.create({ title, completed });
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

  async remove(id: string): Promise<void> { //DELETE by id
    const todo = await this.findOne(id);
    await this.todoRepository.remove(todo);
  }
}

