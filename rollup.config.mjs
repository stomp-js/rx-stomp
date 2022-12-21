import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const umdConf = {
  file: 'bundles/rx-stomp.umd.js',
  format: 'umd',
  name: 'RxStomp',
  sourcemap: true,
  globals: {
    '@stomp/stompjs': 'StompJs',
    rxjs: 'rxjs',
    uuid: 'uuid',
  },
};

const umdMinConf = {
  ...umdConf,
  file: 'bundles/rx-stomp.umd.min.js',
  sourcemap: false,
  plugins: [terser()],
};

export default [
  {
    input: 'src/index.ts',
    external: Object.keys(umdConf.globals),
    plugins: [typescript()],
    output: [umdConf, umdMinConf],
  },
];
