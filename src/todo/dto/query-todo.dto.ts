import { IsInt , Min, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type} from 'class-transformer'

export class QueryTodoDto{
    @ApiPropertyOptional({ example: 1 })
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page: number=1;

    @ApiPropertyOptional({example:10})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit: number=10;


}