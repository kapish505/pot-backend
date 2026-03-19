import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getMessages(groupId: string, limit = 50, skip = 0) {
        const messages = await this.prisma.message.findMany({
            where: { groupId },
            take: limit,
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true, photoUrl: true } },
            },
        });
        return messages.reverse(); // chronological order
    }

    async createMessage(groupId: string, senderId: string, content: string, type = 'text') {
        return this.prisma.message.create({
            data: { groupId, senderId, content, type },
            include: {
                sender: { select: { id: true, name: true, photoUrl: true } },
            },
        });
    }

    async createSystemMessage(groupId: string, content: string) {
        // Use a system sender or first admin — for simplicity use the creator id
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) return;
        return this.createMessage(groupId, group.creatorId, content, 'system');
    }
}
