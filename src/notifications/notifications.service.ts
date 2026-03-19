import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private initialized = false;

    constructor() {
        if (
            process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_PRIVATE_KEY &&
            process.env.FIREBASE_CLIENT_EMAIL
        ) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                }),
            });
            this.initialized = true;
        }
    }

    async sendToUser(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
        if (!this.initialized || !fcmToken) return;

        try {
            await admin.messaging().send({
                token: fcmToken,
                notification: { title, body },
                data,
                apns: {
                    payload: { aps: { badge: 1, sound: 'default' } },
                },
                android: {
                    notification: { sound: 'default' },
                    priority: 'high',
                },
            });
        } catch (err) {
            this.logger.warn(`FCM send failed for token ${fcmToken}: ${err.message}`);
        }
    }

    async sendGroupNotification(
        tokens: string[],
        title: string,
        body: string,
        data?: Record<string, string>,
    ) {
        const validTokens = tokens.filter(Boolean);
        if (!this.initialized || !validTokens.length) return;

        const chunks = this.chunkArray(validTokens, 500); // FCM batch limit
        for (const chunk of chunks) {
            await admin.messaging().sendEachForMulticast({
                tokens: chunk,
                notification: { title, body },
                data,
            });
        }
    }

    private chunkArray<T>(arr: T[], size: number): T[][] {
        return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size),
        );
    }
}
