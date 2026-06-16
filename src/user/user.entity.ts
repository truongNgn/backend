import { Entity, Column, OneToMany } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { BaseEntity } from '../entities/base.entitiy';

@Entity()
export class User extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];
}
