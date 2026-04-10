import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  snapshotDir: './e2e/snapshots',
  // Update snapshots with: npx playwright test --update-snapshots
  expect: {
    toHaveScreenshot: { threshold: 0.02, maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 800 },
    // Disable animations so screenshots are deterministic
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
