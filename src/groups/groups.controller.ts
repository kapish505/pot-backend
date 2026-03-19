import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import { CreateGroupDto, FinalizePlanDto, UpdateStatusDto, GetGroupsDto } from './dto/group.dto';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('groups')
export class GroupsController {
    constructor(private groupsService: GroupsService) { }

    @Get()
    findAll(@Query() query: GetGroupsDto, @GetUser('id') userId: string) {
        return this.groupsService.findAll(query, userId);
    }

    @Get('mine')
    findMine(@GetUser('id') userId: string) {
        return this.groupsService.findMine(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.groupsService.findOne(id);
    }

    @Post()
    create(@GetUser('id') userId: string, @Body() dto: CreateGroupDto) {
        return this.groupsService.create(userId, dto);
    }

    @Post(':id/join')
    join(@Param('id') groupId: string, @GetUser('id') userId: string) {
        return this.groupsService.join(groupId, userId);
    }

    @Post(':id/confirm')
    confirm(@Param('id') groupId: string, @GetUser('id') userId: string) {
        return this.groupsService.confirmParticipation(groupId, userId);
    }

    @Patch(':id/finalize')
    finalize(
        @Param('id') groupId: string,
        @GetUser('id') userId: string,
        @Body() dto: FinalizePlanDto,
    ) {
        return this.groupsService.finalizePlan(groupId, userId, dto);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') groupId: string,
        @GetUser('id') userId: string,
        @Body() dto: UpdateStatusDto,
    ) {
        return this.groupsService.updateStatus(groupId, userId, dto);
    }
}
