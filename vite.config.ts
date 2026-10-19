import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GSAP is imported only by the homepage motion hook, so Rollup keeps it in the
// lazily loaded homepage chunk; form and directory routes never download it.
export default defineConfig({
  plugins: [react()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
