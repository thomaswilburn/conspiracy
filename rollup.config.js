var { terser } = require("rollup-plugin-terser");

module.exports = [{
  input: "src/index.js",
  output: {
    file: "dist/conspiracy.js",
    format: "umd",
    name: "Conspiracy",
    exports: "named",
    sourcemap: true
  }
}, {
  input: "src/index.js",
  output: {
    file: "dist/conspiracy.min.js",
    format: "umd",
    name: "Conspiracy",
    exports: "named",
    sourcemap: true,
    plugins: [ terser() ]
  }
}, {
  input: "src/index.js",
  output: {
    file: "dist/conspiracy.module.js",
    format: "es",
    exports: "named",
    sourcemap: true,
    plugins: [ terser() ]
  }
}];