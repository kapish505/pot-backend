import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true,
    },
    namespace: 'chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private chatService: ChatService) { }

    afterInit() {
        console.log('💬 Chat WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        const token = client.handshake.auth?.token;
        if (!token) {
            client.disconnect();
            return;
        }
        // Token verification done in ChatService
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-group')
    async handleJoinGroup(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupId: string; userId: string },
    ) {
        client.join(`group:${data.groupId}`);
        client.data.userId = data.userId;
        client.data.groupId = data.groupId;
    }

    @SubscribeMessage('leave-group')
    async handleLeaveGroup(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupId: string },
    ) {
        client.leave(`group:${data.groupId}`);
    }

    @SubscribeMessage('send-message')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupId: string; content: string; userId: string },
    ) {
        const message = await this.chatService.createMessage(
            data.groupId,
            data.userId,
            data.content,
        );

        // Broadcast to all group members
        this.server.to(`group:${data.groupId}`).emit('new-message', { message });
        return message;
    }

    @SubscribeMessage('typing-start')
    handleTypingStart(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupId: string; userId: string; name: string },
    ) {
        client.to(`group:${data.groupId}`).emit('user-typing', {
            userId: data.userId,
            name: data.name,
            isTyping: true,
        });
    }

    @SubscribeMessage('typing-stop')
    handleTypingStop(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupId: string; userId: string },
    ) {
        client.to(`group:${data.groupId}`).emit('user-typing', {
            userId: data.userId,
            isTyping: false,
        });
    }

    // Called from GroupsService when member confirms
    emitMemberConfirmed(groupId: string, userId: string, name: string) {
        this.server.to(`group:${groupId}`).emit('member-confirmed', { userId, name });
    }

    // Called when group status changes
    emitStatusChange(groupId: string, status: string) {
        this.server.to(`group:${groupId}`).emit('group-status-changed', { status });
    }
}
