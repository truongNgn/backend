import { DataSource } from 'typeorm';
import { Todo } from './todo/todo.entity';

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '953751',
  database: 'todo_db',
  entities: [Todo],
  migrations: ['src/migrations/*.ts'],
  synchronize: true,
});
