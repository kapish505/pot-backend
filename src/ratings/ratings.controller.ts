import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/rating.dto';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('ratings')
export class RatingsController {
    constructor(private ratingsService: RatingsService) { }

    @Post()
    create(@GetUser('id') raterId: string, @Body() dto: CreateRatingDto) {
        return this.ratingsService.createRating(raterId, dto);
    }

    @Get('group/:groupId')
    getGroupRatings(@Param('groupId') groupId: string) {
        return this.ratingsService.getGroupRatings(groupId);
    }
}
