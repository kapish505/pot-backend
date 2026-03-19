import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/rating.dto';

@Injectable()
export class RatingsService {
    constructor(private prisma: PrismaService) { }

    async createRating(raterId: string, dto: CreateRatingDto) {
        // Verify group is completed
        const group = await this.prisma.group.findUnique({ where: { id: dto.groupId } });
        if (!group) throw new NotFoundException('Group not found');
        if (group.status !== 'COMPLETED') throw new ForbiddenException('Group must be completed to rate');

        // Verify rater was a member
        const raterMembership = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId: dto.groupId, userId: raterId } },
        });
        if (!raterMembership) throw new ForbiddenException('You were not a member of this group');

        // Verify ratee was a member
        const rateeMembership = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId: dto.groupId, userId: dto.rateeId } },
        });
        if (!rateeMembership) throw new NotFoundException('User was not a member of this group');

        // Prevent self-rating
        if (raterId === dto.rateeId) throw new ForbiddenException('Cannot rate yourself');

        const rating = await this.prisma.rating.create({
            data: {
                groupId: dto.groupId,
                raterId,
                rateeId: dto.rateeId,
                attendance: dto.attendance,
                behavior: dto.behavior,
            },
        });

        // Update ratee reputation
        await this.recalculateReputation(dto.rateeId);

        return rating;
    }

    private async recalculateReputation(userId: string) {
        const ratings = await this.prisma.rating.findMany({
            where: { rateeId: userId },
        });

        if (!ratings.length) return;

        const avg =
            ratings.reduce((sum, r) => sum + (r.attendance + r.behavior) / 2, 0) / ratings.length;

        const roundedScore = Math.round(avg * 10) / 10;

        await this.prisma.user.update({
            where: { id: userId },
            data: { reputationScore: roundedScore },
        });
    }

    async getGroupRatings(groupId: string) {
        return this.prisma.rating.findMany({
            where: { groupId },
            include: {
                rater: { select: { id: true, name: true, photoUrl: true } },
                ratee: { select: { id: true, name: true, photoUrl: true } },
            },
        });
    }
}
