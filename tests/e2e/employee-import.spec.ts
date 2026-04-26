import { expect, test } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("用户名").fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel("密码").fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/surveys$/);
}

test("admin can import employees via CSV", async ({ page }) => {
  await loginAsAdmin(page);

  // Navigate to employees page
  await page.goto("/employees");

  // Open import dialog
  await page.getByRole("button", { name: "批量导入" }).click();
  await expect(page.getByRole("heading", { name: "批量导入员工" })).toBeVisible();

  // Fill CSV content
  const csvContent = `name,email,department,title,manager_email,employee_no
张三,zhangsan@example.com,研发部,工程师,,E001
李四,lisi@example.com,研发部,技术主管,zhangsan@example.com,E002`;

  await page.locator("textarea").fill(csvContent);
  await page.getByRole("button", { name: "开始导入" }).click();

  // Wait for import to complete and close dialog
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "关闭" }).click();

  // Verify list shows imported employees
  await expect(page.getByRole("cell", { name: "张三" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "李四" }).first()).toBeVisible();
});

test("admin can batch generate assignments for 360 evaluation", async ({ page }) => {
  await loginAsAdmin(page);

  // Create employees
  const employees = [
    { name: "王五", email: "wangwu@example.com", department: "产品部", title: "产品经理" },
    { name: "赵六", email: "zhaoliu@example.com", department: "产品部", title: "产品专员" },
  ];

  for (const emp of employees) {
    await page.evaluate(async (employee) => {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
    }, emp);
  }

  // Create survey
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

  // Create evaluation cycle
  const cycle = await page.evaluate(async (id) => {
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "2026 Q2 360", surveyId: id, anonymityThreshold: 3 }),
    });
    return res.json();
  }, surveyId);
  const cycleId = cycle.data.id;

  // Add subject
  const subject = await page.evaluate(async ({ cycleId }) => {
    const allEmployees = await fetch("/api/employees").then((r) => r.json());
    const emp = allEmployees.data.find((e: { name: string }) => e.name === "王五");
    const res = await fetch(`/api/evaluations/${cycleId}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: emp.id }),
    });
    return res.json();
  }, { cycleId });

  // Navigate to evaluation detail
  await page.goto(`/evaluations/${cycleId}`);

  // Open batch assignment dialog
  await page.getByRole("button", { name: "批量生成任务" }).click();
  await expect(page.getByText("批量生成评价任务")).toBeVisible();

  // Configure and submit
  await page.getByLabel("同事评价人数").fill("1");
  await page.getByRole("button", { name: "开始生成" }).click();

  // Verify success
  await expect(page.getByText(/成功 \d+/)).toBeVisible();
});
