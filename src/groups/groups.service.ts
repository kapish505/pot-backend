import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, FinalizePlanDto, UpdateStatusDto, GetGroupsDto } from './dto/group.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class GroupsService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService,
    ) { }

    async findAll(dto: GetGroupsDto, userId: string) {
        const where: any = {
            status: { in: ['OPEN', 'DISCUSSION'] },
            maxMembers: { gt: 0 },
            // Exclude groups user is already in
            members: { none: { userId } },
        };

        if (dto.category) where.category = dto.category;

        return this.prisma.group.findMany({
            where,
            take: dto.limit || 20,
            skip: dto.skip || 0,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: { select: { id: true, name: true, photoUrl: true } },
                _count: { select: { members: true } },
            },
        });
    }

    async findMine(userId: string) {
        return this.prisma.group.findMany({
            where: { members: { some: { userId } } },
            orderBy: { updatedAt: 'desc' },
            include: {
                creator: { select: { id: true, name: true, photoUrl: true } },
                members: {
                    include: { user: { select: { id: true, name: true, photoUrl: true } } },
                },
                _count: { select: { members: true, messages: true } },
            },
        });
    }

    async findOne(id: string) {
        const group = await this.prisma.group.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, name: true, photoUrl: true, reputationScore: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, photoUrl: true, reputationScore: true } },
                    },
                },
                _count: { select: { members: true } },
            },
        });
        if (!group) throw new NotFoundException('Group not found');
        return group;
    }

    async create(userId: string, dto: CreateGroupDto) {
        const group = await this.prisma.group.create({
            data: {
                ...dto,
                creatorId: userId,
                members: {
                    create: { userId, status: 'CONFIRMED' },
                },
            },
            include: {
                creator: { select: { id: true, name: true, photoUrl: true } },
                _count: { select: { members: true } },
            },
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: { groupsJoined: { increment: 1 } },
        });

        return group;
    }

    async join(groupId: string, userId: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { _count: { select: { members: true } } },
        });

        if (!group) throw new NotFoundException('Group not found');
        if (group.status === 'CONFIRMED' || group.status === 'COMPLETED') {
            throw new BadRequestException('Group is no longer accepting members');
        }
        if (group._count.members >= group.maxMembers) {
            throw new BadRequestException('Group is full');
        }

        const existing = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (existing) throw new ConflictException('Already a member');

        const [member] = await this.prisma.$transaction([
            this.prisma.groupMember.create({
                data: { groupId, userId },
                include: { user: { select: { id: true, name: true, photoUrl: true } } },
            }),
            this.prisma.user.update({
                where: { id: userId },
                data: { groupsJoined: { increment: 1 } },
            }),
        ]);

        return member;
    }

    async confirmParticipation(groupId: string, userId: string) {
        const membership = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!membership) throw new NotFoundException('Not a member of this group');

        return this.prisma.groupMember.update({
            where: { groupId_userId: { groupId, userId } },
            data: { status: 'CONFIRMED' },
        });
    }

    async finalizePlan(groupId: string, userId: string, dto: FinalizePlanDto) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');
        if (group.creatorId !== userId) throw new ForbiddenException('Only the creator can finalize');

        return this.prisma.group.update({
            where: { id: groupId },
            data: {
                ...dto,
                status: 'FINALIZATION',
            },
        });
    }

    async updateStatus(groupId: string, userId: string, dto: UpdateStatusDto) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');
        if (group.creatorId !== userId) throw new ForbiddenException('Only the creator can update status');

        // If completing, update completion stats
        if (dto.status === 'COMPLETED') {
            const members = await this.prisma.groupMember.findMany({
                where: { groupId, status: 'CONFIRMED' },
            });
            await this.prisma.$transaction(
                members.map((m) =>
                    this.prisma.user.update({
                        where: { id: m.userId },
                        data: {
                            groupsCompleted: { increment: 1 },
                            completionRate: { set: undefined }, // recalculated elsewhere
                        },
                    }),
                ),
            );
        }

        return this.prisma.group.update({
            where: { id: groupId },
            data: { status: dto.status as any },
        });
    }
}
