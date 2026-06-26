import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5173,  // Frontend port
      host: '0.0.0.0',
      watch: {
        ignored: [
          '**/db_debug.log',
          '**/bhxh_debug_dump.json',
          '**/all_patients.json',
          '**/backend/src/tts_cache/**',
          '**/*.log',
          '**/*.mp3',
          '**/node_modules/**'
        ]
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',  // Backend port
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
