import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('root redirects to a locale and renders the home page', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page).toHaveURL(/\/(si|ta|en)$/)
    await expect(page).toHaveTitle(/Elephant Archive Sri Lanka/)
    await expect(page.locator('html')).toHaveAttribute('lang', /^(si|ta|en)$/)
  })

  test('each locale renders with its lang attribute', async ({ page }) => {
    for (const locale of ['si', 'ta', 'en']) {
      await page.goto(`http://localhost:3000/${locale}`)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
    }
  })
})
