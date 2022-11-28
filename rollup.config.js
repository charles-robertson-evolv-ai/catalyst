import json from '@rollup/plugin-json';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';

export default [
    {
        input: 'src/catalyst/index.js',
        output: {
            dir: 'dist',
            format: 'es',
        },
        plugins: [
            getBabelOutputPlugin({ presets: ['@babel/preset-env'] }),
            json(),
        ],
    },
    {
        input: 'src/local/evolv-local.js',
        output: {
            file: 'serve/evolv-local.js',
            format: 'iife',
        },
        plugins: [json()],
    },
    {
        input: 'src/local/catalyst-local.js',
        output: {
            file: 'serve/catalyst-local.js',
            format: 'iife',
        },
        plugins: [json()],
    },
];
