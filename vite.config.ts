import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const wikiProxy = (target: string) => ({
  target,
  changeOrigin: true,
  secure: true,
  headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
  rewrite: (path: string) => path.replace(/^\/wiki\/(cn|en)/, ''),
});

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'SCP Archive · 基金会档案',
        short_name: 'SCP Archive',
        description:
          '一个离线优先的 SCP 基金会文档阅读器：全量目录、收藏、进度与正文缓存。',
        lang: 'zh-CN',
        theme_color: '#efe9dd',
        background_color: '#141110',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'seed/catalog.json'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^/]*\.wdfiles\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wiki-images',
              expiration: { maxEntries: 260, maxAgeSeconds: 60 * 60 * 24 * 45 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/scp-wiki(-cn)?\.wikidot\.com\/local--files\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wiki-local-files',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 45 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/.*.tmpdir/**', '**/.shots/**'],
    },
    proxy: {
      '/wiki/cn': wikiProxy('https://scp-wiki-cn.wikidot.com'),
      '/wiki/en': wikiProxy('https://scp-wiki.wikidot.com'),
    },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: {
      '/wiki/cn': wikiProxy('https://scp-wiki-cn.wikidot.com'),
      '/wiki/en': wikiProxy('https://scp-wiki.wikidot.com'),
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
});
