import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
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
          '**/release/**',
          '**/dist/**',
          '**/*.log',
          '**/*.mp3',
          '**/node_modules/**'
        ]
      },
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3002',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts';
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdfjs-dist')) return 'pdf';
            if (id.includes('node_modules/xlsx')) return 'xlsx';
            if (id.includes('node_modules/html2canvas')) return 'canvas';
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
