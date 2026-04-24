import { expect, test } from "@playwright/test";

test("admin can login and create a survey", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("用户名").fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel("密码").fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/surveys$/);
  await page.getByRole("link", { name: "新建问卷" }).click();
  await page.locator("input").first().fill("E2E 问卷");
  await page.getByRole("button", { name: "填空题" }).click();
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page.getByText("问卷已保存")).toBeVisible();
  await expect(page).toHaveURL(/\/surveys\/\d+$/);
});
