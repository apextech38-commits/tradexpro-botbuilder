import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function rawXmlPlugin() {
    return {
        name: 'raw-xml-plugin',
        enforce: 'pre' as const,
        transform(code: string, id: string) {
            if (id.endsWith('.xml')) {
                return {
                    code: `export default ${JSON.stringify(code)};`,
                    map: null,
                };
            }
        },
    };
}

export default defineConfig({
    plugins: [react(), rawXmlPlugin()],
    resolve: {
        alias: {
            'Types': path.resolve(__dirname, './src/types'),
            '@/external': path.resolve(__dirname, './src/external'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/constants': path.resolve(__dirname, './src/constants'),
            '@/stores': path.resolve(__dirname, './src/stores'),
            '@/types': path.resolve(__dirname, './src/types'),
            '@/pages': path.resolve(__dirname, './src/pages'),
            '@/adapters': path.resolve(__dirname, './src/adapters'),
            '@': path.resolve(__dirname, './src'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                loadPaths: [path.resolve(__dirname, './src')],
            },
        },
    },
    build: {
        outDir: 'dist',
    },
    server: {
        port: 5173,
    },
});
