import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

// 基础配置
const baseConfig = (uglify = true) => {
  const config = {
    input: 'src/index.js',
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'runtime' }),
      // terser(),
    ]
  };
  if (uglify) {
    config.plugins.push(terser());
  }
  return config;
}
// 针对不同格式的具体配置
const umdConfig = {
  ...baseConfig(),
  output: {
    file: 'build/postmessage-promise.umd.js', // 输出文件
    format: 'umd', // 构建为UMD格式
    name: 'postMessagePromise', // 全局变量名
  },
};

const esConfig = {
  ...baseConfig(false),
  output: {
    file: 'build/postmessage-promise.esm.js', // 输出文件
    format: 'es', // 构建为esm格式
  },
};

const cjsConfig = {
  ...baseConfig(false),
  output: {
    file: 'build/postmessage-promise.cjs.js', // 输出文件
    format: 'cjs', // 构建为cjs格式
  },
};

// 导出配置数组
export default [umdConfig, esConfig, cjsConfig];
