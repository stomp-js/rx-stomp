import terser from '@rollup/plugin-terser';

const umdConf = {
  file: 'bundles/rx-stomp.umd.js',
  format: 'umd',
  name: 'RxStomp',
  sourcemap: false,
  globals: {
    '@stomp/stompjs': 'StompJs',
    rxjs: 'rxjs',
    uuid: 'uuid',
  },
};

const umdMinConf = {
  ...umdConf,
  file: 'bundles/rx-stomp.umd.min.js',
  plugins: [terser()],
};

export default [
  {
    input: 'esm6/index.js',
    external: Object.keys(umdConf.globals),
    output: [umdConf, umdMinConf],
  },
];
