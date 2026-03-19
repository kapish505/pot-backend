import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                bio: true,
                photoUrl: true,
                age: true,
                interests: true,
                reputationScore: true,
                completionRate: true,
                groupsJoined: true,
                groupsCompleted: true,
                createdAt: true,
            },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                bio: true,
                photoUrl: true,
                interests: true,
                reputationScore: true,
                completionRate: true,
                groupsJoined: true,
                groupsCompleted: true,
            },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateMe(userId: string, dto: UpdateUserDto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: dto,
            select: {
                id: true,
                name: true,
                bio: true,
                photoUrl: true,
                age: true,
                interests: true,
                reputationScore: true,
            },
        });
    }
}
