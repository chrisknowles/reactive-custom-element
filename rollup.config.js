export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs'
    },
    {
      file: 'dist/reactive-custom-element.js',
      name: 'ReactiveCustomElement',
      format: 'umd'
    }
  ]
};
