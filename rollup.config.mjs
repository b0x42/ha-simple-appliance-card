import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

// `lit` and `custom-card-helpers` are bundled in (not external) — see
// specs/001-configurable-appliance-cards/research.md §1: Home Assistant gives
// third-party custom cards no shared module scope to resolve a bare `lit`
// import against, so a single self-contained bundle is the only correct
// option (constitution: "no unresolved runtime imports").
export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/ha-simple-appliance-card.js',
    format: 'iife',
    name: 'HaSimpleApplianceCard',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json', noEmitOnError: true, declaration: false }),
    terser(),
  ],
};
