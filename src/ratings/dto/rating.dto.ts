import { IsString, IsInt, Min, Max } from 'class-validator';

export class CreateRatingDto {
    @IsString()
    groupId: string;

    @IsString()
    rateeId: string;

    @IsInt()
    @Min(1)
    @Max(5)
    attendance: number;

    @IsInt()
    @Min(1)
    @Max(5)
    behavior: number;
}
