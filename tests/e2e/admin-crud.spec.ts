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

test("admin can set expiration time when creating survey", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("用户名").fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel("密码").fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();

  await page.getByRole("link", { name: "新建问卷" }).click();
  await page.locator("input").first().fill("带过期时间的问卷");

  // Add a question first (required before saving)
  await page.getByRole("button", { name: "填空题" }).click();

  // Set expiration date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split("T")[0];
  await page.getByLabel("过期时间（可选）").fill(dateString);

  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("问卷已保存")).toBeVisible();

  // Verify expiration is shown in list
  await page.goto("/surveys");
  await expect(page.getByText(`到期：${tomorrow.toLocaleDateString("zh-CN")}`).first()).toBeVisible();
});
