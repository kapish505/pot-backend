import { IsString, IsOptional, MinLength, MaxLength, IsInt, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    bio?: string;

    @IsOptional()
    @IsInt()
    @Min(18)
    @Max(99)
    @Type(() => Number)
    age?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    interests?: string[];

    @IsOptional()
    @IsString()
    fcmToken?: string;
}
