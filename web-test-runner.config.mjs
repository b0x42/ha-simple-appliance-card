import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  files: ['tests/**/*.test.ts'],
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, target: 'es2021' })],
  browsers: [playwrightLauncher({ product: 'chromium' })],
  coverage: true,
  coverageConfig: {
    include: ['src/state.ts', 'src/presets.ts', 'src/config.ts'],
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  testFramework: {
    config: {
      timeout: 5000,
    },
  },
};
