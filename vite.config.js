import path from 'path';
import { defineConfig, splitVendorChunkPlugin } from 'vite';

import vituum from 'vituum';
import twig from '@vituum/vite-plugin-twig';
import postcss from '@vituum/vite-plugin-postcss';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import inject from '@rollup/plugin-inject';

export default defineConfig(({ mode }) => ({
    plugins: [
        inject({
            $: 'jquery/dist/jquery.slim',
        }),
        vituum(),
        postcss(),
        twig({
            root: './src',
            filters: {
                site_url: function (str, domain) {
                    domain = domain === 'cdn' ? 'cdn.f3cms.com' : domain;
                    return `${domain}${str}`;
                },
                editor2Html: function (json) {
                    return json;
                },
                repx: function (v) {
                    return JSON.stringify(v);
                },
                themeUrl: function (str) {
                    return `/${str}`;
                },
            },
            namespaces: { layouts: './src/layouts' },
        }),

        copy({
            // copyOnce: true,
            flatten: false,
            hook: 'closeBundle',
            force: true,
            targets: [
                {
                    src: 'public/assets/**/*.*',
                    dest: 'dist/',
                },
                {
                    src: 'src/**/*.twig',
                    dest: 'dist/',
                    force: true,
                    transform: (html, filename) =>
                        html
                            .toString()
                            .replace(/\/src(\/styles[^\s"]+)/, '{{"/assets$1"|themeUrl}}')
                            .replace(/\/src(\/scripts[^\s"]+)/, '{{"/assets$1"|themeUrl}}')
                            // .replace('/src/scripts', '{{domain.cdn}}/assets/scripts')
                            .replace(/\|repx\(\"(.+)\"\)/, '|$1')
                            // .replace('/assets/images', '{{domain.cdn}}/assets/images')
                            .replace('scss', 'css'),
                },
            ],
        }),

        del({ hook: 'closeBundle', targets: 'dist/*.html', force: true }),
    ],

    build: {
        target: 'esnext',
        sourcemap: false,
        minify: 'terser',

        copyPublicDir: false,
        emptyOutDir: false,

        rollupOptions: {
            output: {
                manualChunks: false,

                entryFileNames: `assets/scripts/[name].js`,
                chunkFileNames: `assets/scripts/[name].chunk.js`,

                assetFileNames: ({ name }) => {
                    if (/remixicon/.test(name ?? '')) {
                        return 'assets/fonts/[name].[ext]';
                    }

                    if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
                        return 'assets/images/[name].[ext]';
                    }

                    if (/\.css$/.test(name ?? '')) {
                        return 'assets/styles/[name].[ext]';
                    }

                    if (/\.js$/.test(name ?? '')) {
                        return 'assets/scripts/[name].[ext]';
                    }

                    return 'assets/[name].[ext]';
                },
            },
        },
    },
    esbuild: {
        pure: mode === 'production' ? ['console.log'] : [],
    },
    server: {
        host: 'loc.f3cms.com',
        https: {
            cert: path.join(__dirname, 'cert/cert.crt'),
            key: path.join(__dirname, 'cert/cert.key'),
        },
    },
}));
