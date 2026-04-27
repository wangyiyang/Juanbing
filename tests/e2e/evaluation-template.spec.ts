import { expect, test } from "@playwright/test";

test.describe("evaluation templates", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("should create and use a template", async ({ page }) => {
    // 1. Create a survey
    await page.goto("/surveys/new");
    await page.fill('input[name="title"]', "360 E2E Test Survey");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/surveys\/\d+/);
    const surveyUrl = page.url();
    const surveyId = Number(surveyUrl.match(/\/surveys\/(\d+)/)![1]);

    // 2. Create a template
    await page.goto("/evaluations/templates/new");
    await page.fill('input[id="name"]', "E2E Test Template");
    await page.fill('input[id="survey-id"]', surveyId.toString());
    await page.click('button[type="submit"]');
    await page.waitForURL("/evaluations/templates");
    await expect(page.locator("text=E2E Test Template")).toBeVisible();

    // 3. Clone the template
    await page.click('button[title="克隆"]');
    await expect(page.locator("text=E2E Test Template 副本")).toBeVisible();

    // 4. Use template to create a cycle
    await page.goto("/evaluations/new");
    await page.click('[placeholder="选择模板（可选）"]');
    await page.click('text=E2E Test Template');
    await expect(page.locator('input[id="title"]')).toHaveValue(/E2E Test Template/);

    // 5. Submit and verify
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/evaluations\/\d+/);
    await expect(page.locator("text=基于模板创建")).toBeVisible();
  });
});
