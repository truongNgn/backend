import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Todo } from './entities/todo.entity';
import { User } from './entities/user.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Todo, User],
  migrations: ['src/migrations/*.ts'],
  synchronize: true,
});
