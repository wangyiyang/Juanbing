import { expect, test } from "@playwright/test";

async function createPublishedSurvey(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("用户名").fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel("密码").fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();

  await page.getByRole("link", { name: "新建问卷" }).click();
  await page.locator("input").first().fill("公开问卷");
  await page.getByRole("button", { name: "填空题" }).click();
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page).toHaveURL(/\/surveys\/\d+$/);

  const surveyId = page.url().match(/\/surveys\/(\d+)$/)?.[1];
  expect(surveyId).toBeTruthy();

  await page.evaluate(async (id) => {
    await fetch(`/api/surveys/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
  }, surveyId!);

  return surveyId!;
}

test("public user can submit only once", async ({ browser, page }) => {
  const surveyId = await createPublishedSurvey(page);
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  await publicPage.goto(`/surveys/${surveyId}/fill`);
  await publicPage.getByRole("textbox").fill("Alice");
  await publicPage.getByRole("button", { name: "提交问卷" }).click();
  await expect(publicPage.getByText("感谢你的填写")).toBeVisible();

  await publicPage.goto(`/surveys/${surveyId}/fill`);
  await publicPage.getByRole("textbox").fill("Bob");
  await publicPage.getByRole("button", { name: "提交问卷" }).click();
  await expect(publicPage.getByText("请勿重复提交问卷")).toBeVisible();

  await publicContext.close();
});
