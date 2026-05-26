import { test, expect } from '@playwright/test';

test('user can ADD property', async ({ page }) => {
    await page.goto('http://localhost:5173/properties');

    await expect(
        page.getByRole('heading', { name: 'Properties', level: 1 })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Add Property' }).click();

    await page.getByPlaceholder('Title').fill('Test House');
    await page.getByPlaceholder('Description').fill('Nice');
    await page.getByPlaceholder('Price').fill('123456');
    await page.getByPlaceholder('Location').fill('Test City');

    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.locator('table')).toContainText('Test House');
});


test('user can DELETE property', async ({ page }) => {
    await page.goto('http://localhost:5173/properties');

    const firstRow = page.locator('table tbody tr').first();
    const initialText = await firstRow.textContent();

    page.on('dialog', dialog => dialog.accept());

    await firstRow.getByRole('button', { name: 'Delete' }).click();

    await expect(page.locator('table')).not.toContainText(initialText);
});


test('user can UPDATE property', async ({ page }) => {
    await page.goto('http://localhost:5173/properties');

    const firstRow = page.locator('table tbody tr').first();

    await firstRow.getByRole('button', { name: 'Edit' }).click();

    await page.getByPlaceholder('Title').fill('Updated House');

    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.locator('table')).toContainText('Updated House');
});