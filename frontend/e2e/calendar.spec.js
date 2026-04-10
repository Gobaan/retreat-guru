import { test, expect } from '@playwright/test'

// The dev server proxies /api → Django. These tests require both servers running.
// Django must have registrations seeded (from the Retreat Guru proxy).

test.describe('Calendar visual snapshots', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API so tests are deterministic regardless of Django being up
    await page.route('**/api/retreat-guru/registrations/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FIXTURE_REGISTRATIONS),
      })
    )
    await page.route('**/api/registrations/**', route =>
      route.fulfill({ status: 404, contentType: 'application/json', body: '{"detail":"Not found."}' })
    )
  })

  test('calendar august 2025 layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.cal-grid')
    await expect(page).toHaveScreenshot('calendar-august-2025.png')
  })

  test('calendar with pending-only filter', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.cal-grid')
    await page.click('.toggle')
    await expect(page).toHaveScreenshot('calendar-pending-only.png')
  })

  test('registration panel modal', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.cal-reg-chip:not(.cal-reg-chip--empty)')
    await page.click('.cal-reg-chip:not(.cal-reg-chip--empty)')
    await page.waitForSelector('.modal-open')
    await expect(page.locator('.modal-box')).toHaveScreenshot('registration-panel-empty.png')
  })
})

test.describe('Load time', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/retreat-guru/registrations/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FIXTURE_REGISTRATIONS),
      })
    )
  })

  test('calendar is interactive within 2000ms', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')
    await page.waitForSelector('.cal-grid')
    expect(Date.now() - start).toBeLessThan(2000)
  })

  test('core web vitals: FCP under 1500ms', async ({ page }) => {
    await page.goto('/')
    const fcp = await page.evaluate(() =>
      new Promise(resolve => {
        new PerformanceObserver(list => {
          const entry = list.getEntriesByName('first-contentful-paint')[0]
          if (entry) resolve(entry.startTime)
        }).observe({ type: 'paint', buffered: true })
        // Fallback if already fired
        setTimeout(() => {
          const entry = performance.getEntriesByName('first-contentful-paint')[0]
          resolve(entry ? entry.startTime : 9999)
        }, 3000)
      })
    )
    expect(fcp).toBeLessThan(1500)
  })

  test('navigation timing: TTFB under 200ms', async ({ page }) => {
    await page.goto('/')
    const ttfb = await page.evaluate(() => {
      const [nav] = performance.getEntriesByType('navigation')
      return nav.responseStart - nav.requestStart
    })
    expect(ttfb).toBeLessThan(200)
  })
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const FIXTURE_REGISTRATIONS = [
  {
    id: 1, program: 'Morning Yoga',
    start_date: '2025-08-05', end_date: '2025-08-05',
    status: 'reserved', full_name: 'Alice Smith',
    email: 'alice@example.com', lodging: 'Cabin A', nights: 1,
  },
  {
    id: 2, program: 'Juice Detox',
    start_date: '2025-08-10', end_date: '2025-08-14',
    status: 'pending', full_name: 'Bob Jones',
    email: 'bob@example.com', lodging: 'Cabin B', nights: 4,
  },
  {
    id: 3, program: 'Breath Work',
    start_date: '2025-08-12', end_date: '2025-08-16',
    status: 'reserved', full_name: 'Carol Lee',
    email: 'carol@example.com', lodging: 'Cabin C', nights: 4,
  },
]
