import { expect, test } from "@playwright/test";

async function getAdminCookie(page: import("@playwright/test").Page): Promise<string> {
  await page.goto("/login");
  await page.getByLabel("用户名").fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel("密码").fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/surveys$/);

  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c) => c.name === "juanbing_admin_session");
  expect(sessionCookie).toBeTruthy();
  return `juanbing_admin_session=${sessionCookie!.value}`;
}

test("expired survey cannot be accessed publicly", async ({ page }) => {
  const cookie = await getAdminCookie(page);

  // Create and publish a survey with past expiration date via API
  const response = await page.request.post("/api/surveys", {
    headers: { "Cookie": cookie },
    data: {
      title: "过期问卷",
      expiresAt: Math.floor(Date.now() / 1000) - 86400, // yesterday
      questions: [
        {
          type: "text",
          title: "姓名",
          required: true,
          orderIndex: 0,
          config: null,
          options: [],
        },
      ],
    },
  });

  expect(response.ok()).toBeTruthy();
  const { data } = await response.json();
  const surveyId = data.id;

  // Publish it
  await page.request.post(`/api/surveys/${surveyId}/publish`, {
    headers: { "Cookie": cookie },
    data: { status: "published" },
  });

  // Try to access fill page
  await page.goto(`/surveys/${surveyId}/fill`);
  await expect(page.getByText("问卷已过期")).toBeVisible();
});

test("expired survey cannot be submitted", async ({ page }) => {
  const cookie = await getAdminCookie(page);

  // Create survey with past expiration
  const response = await page.request.post("/api/surveys", {
    headers: { "Cookie": cookie },
    data: {
      title: "过期问卷",
      expiresAt: Math.floor(Date.now() / 1000) - 86400,
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

  const { data } = await response.json();
  const surveyId = data.id;

  await page.request.post(`/api/surveys/${surveyId}/publish`, {
    headers: { "Cookie": cookie },
    data: { status: "published" },
  });

  // Try to submit directly via API
  const submitResponse = await page.request.post(`/api/surveys/${surveyId}/responses`, {
    data: {
      answers: { question_1: "test" },
      respondent_id: "test-respondent",
      duration_seconds: 10,
    },
  });

  expect(submitResponse.status()).toBe(403);
  const body = await submitResponse.json();
  expect(body.error).toBe("问卷已过期");
});
