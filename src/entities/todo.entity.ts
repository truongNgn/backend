import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entitiy';
@Entity()
export class Todo extends BaseEntity {

  @Column()
  title: string;

  @Column({ default: false })
  completed: boolean;

}