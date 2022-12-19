import typescript from '@rollup/plugin-typescript';

export const umdConf = {
  file: 'bundles/rxstomp.umd.js',
  format: 'umd',
  name: 'RxStomp',
  sourcemap: true,
  // globals: d3Modules,
  // paths: d3Modules,
};

export default [
  {
    input: 'src/index.ts',
    external: [],
    plugins: [typescript()],
    output: [umdConf],
  },
];
