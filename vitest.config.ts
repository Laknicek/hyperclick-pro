import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'electron/engine/humanizer.ts',
        'src/utils/math.ts',
        'src/services/updaterService.ts',
        'src/services/storageService.ts',
        'src/services/macroEngine.ts',
        'src/services/soundEngine.ts',
        'src/utils/audio.ts',
      ],
    },
  },
});
