import json from '@rollup/plugin-json';

export default [
    {
        input: 'src/catalyst/index.js',
        output: {
            file: 'dist/catalyst.js',
        },
        plugins: [json()],
    },
    {
        input: 'src/local/index-local.js',
        output: {
            file: 'serve/catalyst-local.js',
            format: 'iife',
        },
        plugins: [json()],
    },
];
