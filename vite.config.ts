import { URL, fileURLToPath } from 'node:url'

import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    // base lấy từ lệnh build, hoặc mặc định là root
    base: process.env.VITE_BASE_URL || '/',
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: tag => tag === 'emoji-picker',
          },
        },
      }),
      basicSsl(),
    ],
    define: {
      npm_package_version: JSON.stringify(process.env.npm_package_version),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
      },
    },
    server: {
      host: '0.0.0.0',
      port: 8000,
      https: true,

      proxy: {
        '/backup': {
          target: 'https://chatbox-backup.botbanhang.vn',
          changeOrigin: true, // quan trọng để server thấy host gốc khác
          secure: false, // nếu server HTTPS tự ký
        },
      },
    },
  }
})
