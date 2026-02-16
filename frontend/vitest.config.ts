import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: [
                'src/app/(auth)/**',
                'src/app/(dashboard)/chat/**',
                'src/services/auth.ts',
                'src/services/chat.ts',
                'src/services/omniRag.ts',
                'src/services/image.ts',
                'src/stores/authStore.ts',
            ],
        },
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
});
