import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock authStore
vi.mock('@/stores/authStore', () => ({
    useAuthStore: {
        getState: () => ({ token: 'test-token-123', user: { email: 'test@test.com' } }),
    },
}));

import { imageService } from '@/services/image';

const API_URL = 'http://localhost:8000/api/v1';

const mockImageRaw = {
    id: 'img-1',
    filename: 'test.jpg',
    mime_type: 'image/jpeg',
    width: 800,
    height: 600,
    file_size: 50000,
    public_url: 'https://storage.example.com/img-1.jpg',
    variants: [
        { variant_type: 'thumbnail_small', public_url: 'https://storage.example.com/img-1-small.jpg', width: 100, height: 75, file_size: 5000, format: 'jpeg' },
        { variant_type: 'thumbnail_medium', public_url: 'https://storage.example.com/img-1-medium.jpg', width: 300, height: 225, file_size: 15000, format: 'jpeg' },
    ],
    tags: ['nature', 'landscape'],
    processing_status: 'completed',
    created_at: '2026-01-01T00:00:00Z',
};

describe('imageService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // -------------------------------------------------------
    // uploadImage
    // -------------------------------------------------------
    describe('uploadImage', () => {
        it('should upload file and return transformed image with thumbnails', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImageRaw),
            });

            const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
            const result = await imageService.uploadImage(file);

            // Verify fetch was called with FormData
            expect(global.fetch).toHaveBeenCalledWith(
                `${API_URL}/images/upload`,
                expect.objectContaining({
                    method: 'POST',
                    body: expect.any(FormData),
                })
            );

            // Verify thumbnails are transformed from variants
            expect(result.thumbnails?.small).toBe('https://storage.example.com/img-1-small.jpg');
            expect(result.thumbnails?.medium).toBe('https://storage.example.com/img-1-medium.jpg');
            expect(result.id).toBe('img-1');
            expect(result.tags).toEqual(['nature', 'landscape']);
        });

        it('should throw with error detail on failure', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ detail: 'File too large' }),
            });

            const file = new File(['content'], 'big.jpg', { type: 'image/jpeg' });
            await expect(imageService.uploadImage(file)).rejects.toThrow('File too large');
        });

        it('should throw generic message when no error detail', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({}),
            });

            const file = new File(['content'], 'bad.jpg', { type: 'image/jpeg' });
            await expect(imageService.uploadImage(file)).rejects.toThrow('Failed to upload image');
        });
    });

    // -------------------------------------------------------
    // listImages
    // -------------------------------------------------------
    describe('listImages', () => {
        it('should fetch images with pagination params', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([mockImageRaw]),
            });

            const result = await imageService.listImages(0, 50);

            expect(global.fetch).toHaveBeenCalledWith(
                `${API_URL}/images/?skip=0&limit=50`,
                expect.objectContaining({ method: 'GET' })
            );
            expect(result).toHaveLength(1);
            expect(result[0].thumbnails?.small).toBeDefined();
        });

        it('should use default values for skip and limit', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await imageService.listImages();

            expect(global.fetch).toHaveBeenCalledWith(
                `${API_URL}/images/?skip=0&limit=100`,
                expect.anything()
            );
        });

        it('should throw on non-ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false });

            await expect(imageService.listImages()).rejects.toThrow('Failed to fetch images');
        });
    });

    // -------------------------------------------------------
    // getImage
    // -------------------------------------------------------
    describe('getImage', () => {
        it('should fetch single image by ID', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImageRaw),
            });

            const result = await imageService.getImage('img-1');

            expect(global.fetch).toHaveBeenCalledWith(
                `${API_URL}/images/img-1`,
                expect.objectContaining({ method: 'GET' })
            );
            expect(result.filename).toBe('test.jpg');
        });

        it('should throw on non-ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false });

            await expect(imageService.getImage('invalid')).rejects.toThrow('Failed to fetch image');
        });
    });

    // -------------------------------------------------------
    // deleteImage
    // -------------------------------------------------------
    describe('deleteImage', () => {
        it('should send DELETE request with auth header', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            await imageService.deleteImage('img-1');

            expect(global.fetch).toHaveBeenCalledWith(
                `${API_URL}/images/img-1`,
                expect.objectContaining({
                    method: 'DELETE',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token-123',
                    }),
                })
            );
        });

        it('should throw on non-ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false });

            await expect(imageService.deleteImage('img-1')).rejects.toThrow('Failed to delete image');
        });
    });

    // -------------------------------------------------------
    // searchImages
    // -------------------------------------------------------
    describe('searchImages', () => {
        it('should encode query parameter correctly', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([mockImageRaw]),
            });

            const result = await imageService.searchImages('nature landscape', 5);

            expect(global.fetch).toHaveBeenCalledWith(
                `${API_URL}/images/search?query=nature%20landscape&limit=5`,
                expect.objectContaining({ method: 'GET' })
            );
            expect(result).toHaveLength(1);
        });

        it('should throw on non-ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false });

            await expect(imageService.searchImages('test')).rejects.toThrow('Failed to search images');
        });
    });

    // -------------------------------------------------------
    // batchAction
    // -------------------------------------------------------
    describe('batchAction', () => {
        it('should send batch delete request', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ affected: 2 }),
            });

            const result = await imageService.batchAction('delete', ['img-1', 'img-2']);

            expect(global.fetch).toHaveBeenCalledWith(
                `${API_URL}/images/batch`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ action: 'delete', image_ids: ['img-1', 'img-2'], tags: undefined }),
                })
            );
            expect(result.affected).toBe(2);
        });

        it('should send batch tag request with tags', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ affected: 1 }),
            });

            await imageService.batchAction('tag', ['img-1'], ['nature', 'new-tag']);

            const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            expect(body.action).toBe('tag');
            expect(body.tags).toEqual(['nature', 'new-tag']);
        });

        it('should throw with detail on failure', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ detail: 'Batch failed' }),
            });

            await expect(imageService.batchAction('delete', ['img-1'])).rejects.toThrow('Batch failed');
        });
    });
});
