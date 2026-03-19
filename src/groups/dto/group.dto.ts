import {
    IsString,
    IsNumber,
    IsOptional,
    MinLength,
    MaxLength,
    Min,
    Max,
    IsDateString,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGroupDto {
    @IsString()
    @MinLength(3)
    @MaxLength(80)
    title: string;

    @IsString()
    @MinLength(10)
    @MaxLength(500)
    description: string;

    @IsString()
    category: string;

    @IsString()
    location: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    longitude?: number;

    @IsNumber()
    @Min(2)
    @Max(50)
    @Type(() => Number)
    maxMembers: number;

    @IsOptional()
    @IsDateString()
    eventDate?: string;
}

export class FinalizePlanDto {
    @IsDateString()
    eventDate: string;

    @IsString()
    location: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    longitude?: number;
}

export class UpdateStatusDto {
    @IsEnum(['OPEN', 'DISCUSSION', 'FINALIZATION', 'CONFIRMED', 'COMPLETED'])
    status: string;
}

export class GetGroupsDto {
    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    skip?: number = 0;
}
