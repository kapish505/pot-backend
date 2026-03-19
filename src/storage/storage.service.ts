import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private bucket: admin.storage.Bucket | null = null;

    constructor() {
        if (process.env.FIREBASE_STORAGE_BUCKET) {
            this.bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
        }
    }

    /**
     * Generate a signed upload URL so the client uploads directly to Firebase Storage
     * (backend never touches the file bytes).
     */
    async getUploadUrl(folder: 'avatars' | 'groups', contentType: string): Promise<{ uploadUrl: string; filePath: string }> {
        if (!this.bucket) throw new Error('Firebase Storage not configured');

        const ext = contentType.split('/')[1] || 'jpg';
        const filePath = `${folder}/${uuid()}.${ext}`;
        const file = this.bucket.file(filePath);

        const [uploadUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 10 * 60 * 1000, // 10 minutes
            contentType,
        });

        return { uploadUrl, filePath };
    }

    /**
     * Get a public read URL for a file already uploaded to Firebase Storage.
     */
    getPublicUrl(filePath: string): string {
        const bucket = process.env.FIREBASE_STORAGE_BUCKET || '';
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
    }

    /**
     * Delete a file by its path.
     */
    async deleteFile(filePath: string): Promise<void> {
        if (!this.bucket) return;
        try {
            await this.bucket.file(filePath).delete();
        } catch (err) {
            this.logger.warn(`Failed to delete file ${filePath}: ${err.message}`);
        }
    }
}
