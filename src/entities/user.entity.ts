import { Entity, Column, OneToMany } from 'typeorm';
import { Todo } from './todo.entity';
import { BaseEntity } from './base.entitiy';

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];
}
