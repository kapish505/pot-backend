import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@UseGuards(AuthGuard('jwt'))
@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Get(':groupId/messages')
    getMessages(
        @Param('groupId') groupId: string,
        @Query('limit') limit = '50',
        @Query('skip') skip = '0',
    ) {
        return this.chatService.getMessages(groupId, +limit, +skip);
    }
}
