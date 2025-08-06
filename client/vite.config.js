import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    plugins: [react()],

    // Development server configuration
    server: {
        port: 5173,
        host: true,
        open: true,
        cors: true,
    },

    // Production build optimization
    build: {
        outDir: 'dist',
        sourcemap: process.env.NODE_ENV !== 'production',
        minify: 'esbuild',
        cssMinify: true,

        // Performance optimizations
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunk for better caching
                    vendor: ['react', 'react-dom'],
                    mui: ['@mui/material', '@mui/icons-material'],
                    socketio: ['socket.io-client'],
                    utils: ['date-fns', 'react-hot-toast'],
                },
            },
        },

        // Asset optimization
        assetsInlineLimit: 4096,
        cssCodeSplit: true,

        // Target modern browsers for smaller bundles
        target: 'esnext',
    },

    // Path resolution
    resolve: {
        alias: {
            '@': '/src'
        }
    },

    // Environment variables
    define: {
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
        __VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    // Preview server for production builds
    preview: {
        port: 4173,
        host: true,
    },
})