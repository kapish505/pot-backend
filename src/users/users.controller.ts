import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('me')
    getMe(@GetUser('id') userId: string) {
        return this.usersService.findMe(userId);
    }

    @Patch('me')
    updateMe(@GetUser('id') userId: string, @Body() dto: UpdateUserDto) {
        return this.usersService.updateMe(userId, dto);
    }

    @Get(':id')
    getUser(@Param('id') id: string) {
        return this.usersService.findById(id);
    }
}
