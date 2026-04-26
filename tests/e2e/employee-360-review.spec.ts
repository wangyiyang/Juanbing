import { expect, test } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("用户名").fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel("密码").fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/surveys$/);
}

test("admin can run full 360 evaluation workflow", async ({ browser, page }) => {
  // 1. Login
  await loginAsAdmin(page);

  // 2. Create employees via API
  const subjectEmployee = await page.evaluate(async () => {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "张三", email: `zhangsan-${Date.now()}@example.com`, department: "研发部", title: "工程师" }),
    });
    return res.json();
  });
  const subjectEmployeeId = subjectEmployee.data.id;

  const peerEmployee = await page.evaluate(async () => {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "李四", email: `lisi-${Date.now()}@example.com`, department: "研发部", title: "工程师" }),
    });
    return res.json();
  });
  const peerEmployeeId = peerEmployee.data.id;

  // 3. Create rating survey via API
  const survey = await page.evaluate(async () => {
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "360 评分表",
        questions: [
          { type: "rating", title: "沟通协作", required: true, orderIndex: 0, config: { maxRating: 5 }, options: [] },
        ],
      }),
    });
    return res.json();
  });
  const surveyId = survey.data.id;

  // 4. Create 360 evaluation cycle
  const cycle = await page.evaluate(async (surveyId) => {
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "2026 Q2 360", surveyId, anonymityThreshold: 3 }),
    });
    return res.json();
  }, surveyId);
  const cycleId = cycle.data.id;

  // 5. Add subject
  const subject = await page.evaluate(async ({ cycleId, employeeId }) => {
    const res = await fetch(`/api/evaluations/${cycleId}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  }, { cycleId, employeeId: subjectEmployeeId });
  const subjectId = subject.data.id;

  // 6. Add peer assignment
  const assignment = await page.evaluate(async ({ cycleId, subjectId, raterId }) => {
    const res = await fetch(`/api/evaluations/${cycleId}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, raterEmployeeId: raterId, relationship: "peer" }),
    });
    return res.json();
  }, { cycleId, subjectId, raterId: peerEmployeeId });
  const token = assignment.data.token;

  // 7. Publish cycle
  await page.evaluate(async (cycleId) => {
    await fetch(`/api/evaluations/${cycleId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
  }, cycleId);

  // 8. Open token link in new browser context
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`/evaluations/fill/${token}`);

  // 9. Submit rating answer
  await expect(publicPage.getByText(/你正在评价：张三/)).toBeVisible();
  await publicPage.locator("input[type=\"radio\"]").first().check();
  await publicPage.getByRole("button", { name: "提交问卷" }).click();
  await expect(publicPage.getByText("提交成功")).toBeVisible();

  await publicContext.close();

  // 10. Return to admin and assert completed count
  await page.goto(`/evaluations/${cycleId}`);
  await expect(page.getByText(/完成 1\/1/)).toBeVisible();

  // 11. Open report and assert peer result is hidden
  await page.getByRole("link", { name: "报告" }).click();
  await expect(page).toHaveURL(/\/evaluations\/\d+\/subjects\/\d+\/report$/);
  await expect(page.getByText("沟通协作")).toBeVisible();
  await expect(page.getByText("已隐藏")).toBeVisible();
});
