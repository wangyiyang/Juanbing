import { expect, test } from "@playwright/test";

async function getAdminCookie(
  page: import("@playwright/test").Page,
): Promise<string> {
  await page.goto("/login");
  await page
    .getByLabel("用户名")
    .fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page
    .getByLabel("密码")
    .fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/surveys$/);

  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(
    (c) => c.name === "juanbing_admin_session",
  );
  expect(sessionCookie).toBeTruthy();
  return `juanbing_admin_session=${sessionCookie!.value}`;
}

async function createSurvey(
  page: import("@playwright/test").Page,
  cookie: string,
): Promise<number> {
  const response = await page.request.post("/api/surveys", {
    headers: { Cookie: cookie },
    data: {
      title: "草稿问卷",
      questions: [
        {
          type: "text",
          title: "姓名",
          required: false,
          orderIndex: 0,
          config: null,
          options: [],
        },
      ],
    },
  });
  expect(response.ok()).toBeTruthy();
  const { data } = await response.json();
  return data.id as number;
}

test("draft survey fill page shows unpublished notice instead of 404", async ({
  browser,
  page,
}) => {
  const cookie = await getAdminCookie(page);
  const surveyId = await createSurvey(page, cookie);

  // Public visitor (no admin cookie) accesses share link of a draft survey.
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  const response = await publicPage.goto(`/surveys/${surveyId}/fill`);
  expect(response?.status()).toBe(200);
  await expect(publicPage.getByText("问卷暂未发布")).toBeVisible();
  await expect(
    publicPage.getByRole("button", { name: "提交问卷" }),
  ).toHaveCount(0);

  await publicContext.close();
});

test("closed survey fill page shows closed notice instead of 404", async ({
  browser,
  page,
}) => {
  const cookie = await getAdminCookie(page);
  const surveyId = await createSurvey(page, cookie);

  // Publish then close the survey.
  await page.request.post(`/api/surveys/${surveyId}/publish`, {
    headers: { Cookie: cookie },
    data: { status: "published" },
  });
  await page.request.post(`/api/surveys/${surveyId}/publish`, {
    headers: { Cookie: cookie },
    data: { status: "closed" },
  });

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  const response = await publicPage.goto(`/surveys/${surveyId}/fill`);
  expect(response?.status()).toBe(200);
  await expect(
    publicPage.getByRole("heading", { name: "问卷已关闭" }),
  ).toBeVisible();

  await publicContext.close();
});

test("editor share button refuses to share an unpublished survey", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByLabel("用户名")
    .fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page
    .getByLabel("密码")
    .fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/surveys$/);

  await page.getByRole("link", { name: "新建问卷" }).click();
  await page.locator("input").first().fill("草稿不可分享");
  await page.getByRole("button", { name: "填空题" }).click();
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("问卷已保存")).toBeVisible();
  await expect(page).toHaveURL(/\/surveys\/\d+$/);

  // Survey is in draft status by default.
  await page.getByRole("button", { name: "分享" }).click();

  await expect(page.getByText("问卷未发布，请先发布后再分享")).toBeVisible();
  // Dialog must not open – there should be no "复制链接" button visible.
  await expect(page.getByRole("button", { name: "复制链接" })).toHaveCount(0);
});
