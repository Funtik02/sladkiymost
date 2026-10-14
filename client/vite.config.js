import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        // Явно IPv4: на Windows Node иначе слушает только ::1, и часть браузеров не подключается
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
        proxy: {
            '/api': 'http://localhost:3001',
            // фото товаров отдаёт тот же сервер
            '/images': 'http://localhost:3001',
        },
    },
})
