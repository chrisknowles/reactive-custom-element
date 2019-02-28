import butternut from 'rollup-plugin-butternut';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/reactive-custom-element.min.js',
      name: 'store',
      format: 'umd',
      sourcemap: true
    }
  ],
  plugins: [
    butternut()
  ]
};
