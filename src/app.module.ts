import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { ChatModule } from './chat/chat.module';
import { RatingsModule } from './ratings/ratings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 60000,
                limit: 30,
            },
            {
                name: 'long',
                ttl: 900000,
                limit: 200,
            },
        ]),
        PrismaModule,
        AuthModule,
        UsersModule,
        GroupsModule,
        ChatModule,
        RatingsModule,
        NotificationsModule,
    ],
})
export class AppModule { }
