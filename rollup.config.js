import json from '@rollup/plugin-json';

export default [
    {
        input: 'src/catalyst/index.js',
        output: {
            file: 'dist/index.js',
        },
        plugins: [json()],
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
