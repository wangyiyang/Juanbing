# Employee 360 Review MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 Juanbing 问卷系统上交付员工 360 环评 MVP，支持员工档案、评价项目、评价任务、token 填写、进度看板和匿名报告。

**Architecture:** 复用现有 `surveys` 模块作为题目和答案引擎，新增 `employees` 与 `evaluations` 两组领域模块承载 360 业务规则。评价任务通过 `evaluation_assignments.response_id` 关联现有 `survey_responses`，避免污染通用问卷回答表。前端沿用 App Router、server page 获取数据、client component 处理表单交互的现有模式。

**Tech Stack:** Next.js 15 App Router、React 19、TypeScript、SQLite、Drizzle ORM、Zod、Tailwind CSS、shadcn/ui、Vitest、Playwright

---

## Scope

本计划只实现 360 环评 MVP：

- 员工 CRUD 和停用。
- 评价项目 CRUD、发布、关闭。
- 被评人和评价任务配置。
- token 填写链路。
- 项目进度看板。
- 被评人匿名报告。
- CSV 导出。

本计划不实现多租户、SSO、自动邮件提醒、PDF 报告、HRIS 同步、AI 总结。

## File Structure

### Data and Domain

- Modify: `lib/db/schema.ts`，新增员工、评价项目、被评人、评价任务表。
- Create: `drizzle/0001_employee_360_review.sql`，新增迁移。
- Create: `lib/employees/types.ts`，员工领域类型。
- Create: `lib/employees/validators.ts`，员工输入校验。
- Create: `lib/employees/repository.ts`，员工数据库访问。
- Create: `lib/employees/service.ts`，员工业务服务。
- Create: `lib/evaluations/types.ts`，评价项目、被评人、评价任务、报告类型。
- Create: `lib/evaluations/validators.ts`，评价输入校验。
- Create: `lib/evaluations/repository.ts`，评价数据库访问。
- Create: `lib/evaluations/service.ts`，评价项目和任务业务服务。
- Create: `lib/evaluations/report-policy.ts`，匿名阈值策略。
- Create: `lib/evaluations/report-service.ts`，报告聚合。
- Create: `lib/evaluations/token.ts`，token 生成。
- Modify: `lib/analytics/service.ts`，复用 CSV 行格式化或导出辅助。

### API Routes

- Create: `app/api/employees/route.ts`，员工列表和创建。
- Create: `app/api/employees/[id]/route.ts`，员工更新和停用。
- Create: `app/api/evaluations/route.ts`，评价项目列表和创建。
- Create: `app/api/evaluations/[id]/route.ts`，评价项目详情和更新。
- Create: `app/api/evaluations/[id]/publish/route.ts`，发布和关闭项目。
- Create: `app/api/evaluations/[id]/subjects/route.ts`，被评人配置。
- Create: `app/api/evaluations/[id]/assignments/route.ts`，评价任务配置。
- Create: `app/api/evaluations/[id]/export/route.ts`，项目 CSV 导出。
- Create: `app/api/evaluations/assignments/[token]/route.ts`，token 详情。
- Create: `app/api/evaluations/assignments/[token]/responses/route.ts`，token 提交。
- Create: `app/api/evaluations/subjects/[subjectId]/report/route.ts`，被评人报告数据。

### Pages and Components

- Modify: `components/layout/admin-shell.tsx`，增加“员工”和“360 环评”导航入口。
- Create: `app/employees/page.tsx`，员工列表页。
- Create: `components/employees/employee-list.tsx`，员工列表和操作。
- Create: `components/employees/employee-form-dialog.tsx`，员工新建和编辑表单。
- Create: `app/evaluations/page.tsx`，评价项目列表页。
- Create: `app/evaluations/new/page.tsx`，创建评价项目页。
- Create: `app/evaluations/[id]/page.tsx`，评价项目详情页。
- Create: `components/evaluations/evaluation-list.tsx`，项目列表。
- Create: `components/evaluations/evaluation-form.tsx`，项目表单。
- Create: `components/evaluations/subject-assignment-table.tsx`，被评人与任务分配表。
- Create: `components/evaluations/progress-overview.tsx`，进度概览。
- Create: `app/evaluations/[id]/subjects/[subjectId]/report/page.tsx`，被评人报告页。
- Create: `components/evaluations/subject-report.tsx`，报告展示。
- Create: `app/evaluations/fill/[token]/page.tsx`，token 填写页。
- Create: `app/evaluations/fill/[token]/thank-you/page.tsx`，token 提交完成页。
- Create: `components/evaluations/evaluation-fill-page-client.tsx`，token 填写客户端逻辑。

### Tests

- Create: `tests/lib/employees/service.test.ts`
- Create: `tests/lib/evaluations/service.test.ts`
- Create: `tests/lib/evaluations/report-policy.test.ts`
- Create: `tests/lib/evaluations/report-service.test.ts`
- Create: `tests/components/evaluation-fill-form.test.tsx`
- Create: `tests/e2e/employee-360-review.spec.ts`

---

## Task 1: Data Model and Migration

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0001_employee_360_review.sql`
- Modify: `drizzle/meta/_journal.json`
- Modify: `drizzle/meta/0001_snapshot.json`

- [ ] **Step 1: Extend Drizzle schema**

Add imports:

```ts
import { index, uniqueIndex } from "drizzle-orm/sqlite-core";
```

Add tables to `lib/db/schema.ts` after `surveyResponses`:

```ts
export const employees = sqliteTable(
  "employees",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeNo: text("employee_no"),
    name: text("name").notNull(),
    email: text("email"),
    department: text("department"),
    title: text("title"),
    managerId: integer("manager_id").references((): AnySQLiteColumn => employees.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("employees_employee_no_unique").on(table.employeeNo),
    uniqueIndex("employees_email_unique").on(table.email),
    index("employees_name_idx").on(table.name),
  ],
);

export const evaluationCycles = sqliteTable("evaluation_cycles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "active", "closed"] })
    .notNull()
    .default("draft"),
  surveyId: integer("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "restrict" }),
  startsAt: integer("starts_at"),
  endsAt: integer("ends_at"),
  anonymityThreshold: integer("anonymity_threshold").notNull().default(3),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const evaluationSubjects = sqliteTable(
  "evaluation_subjects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cycleId: integer("cycle_id")
      .notNull()
      .references(() => evaluationCycles.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["active", "removed"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("evaluation_subjects_cycle_employee_unique").on(
      table.cycleId,
      table.employeeId,
    ),
  ],
);

export const evaluationAssignments = sqliteTable(
  "evaluation_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cycleId: integer("cycle_id")
      .notNull()
      .references(() => evaluationCycles.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => evaluationSubjects.id, { onDelete: "cascade" }),
    raterEmployeeId: integer("rater_employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    relationship: text("relationship", {
      enum: ["self", "manager", "peer", "direct_report", "other"],
    }).notNull(),
    token: text("token").notNull().unique(),
    status: text("status", { enum: ["pending", "submitted", "expired"] })
      .notNull()
      .default("pending"),
    responseId: integer("response_id").references(() => surveyResponses.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    submittedAt: integer("submitted_at"),
  },
  (table) => [
    index("evaluation_assignments_token_idx").on(table.token),
    index("evaluation_assignments_subject_idx").on(table.subjectId),
  ],
);
```

If TypeScript requires `AnySQLiteColumn`, import it:

```ts
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
```

- [ ] **Step 2: Generate migration**

Run:

```bash
pnpm db:generate -- --name=employee_360_review
```

Expected:

- A new migration file appears under `drizzle/`.
- `drizzle/meta/_journal.json` includes the new migration entry.
- `drizzle/meta/0001_snapshot.json` includes `employees`, `evaluation_cycles`, `evaluation_subjects`, `evaluation_assignments`.

- [ ] **Step 3: Run type and unit verification**

Run:

```bash
pnpm lint
pnpm test tests/lib/surveys/service.test.ts
```

Expected:

- Lint passes.
- Existing survey service tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle
git commit -m "feat: add employee 360 review data model"
```

## Task 2: Employee Domain

**Files:**
- Create: `lib/employees/types.ts`
- Create: `lib/employees/validators.ts`
- Create: `lib/employees/repository.ts`
- Create: `lib/employees/service.ts`
- Create: `tests/lib/employees/service.test.ts`

- [ ] **Step 1: Write employee service tests**

Create `tests/lib/employees/service.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";

import { createEmployee, deactivateEmployee, listEmployees, updateEmployee } from "@/lib/employees/service";
import { resetDb } from "@/tests/helpers/reset-db";

describe("employee service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("creates and lists active employees", async () => {
    await createEmployee({
      employeeNo: "E001",
      name: "张三",
      email: "zhangsan@example.com",
      department: "研发部",
      title: "工程师",
      managerId: null,
    });

    const employees = await listEmployees();

    expect(employees).toHaveLength(1);
    expect(employees[0]).toMatchObject({
      employeeNo: "E001",
      name: "张三",
      status: "active",
    });
  });

  it("updates employee profile fields", async () => {
    const employee = await createEmployee({
      employeeNo: "E002",
      name: "李四",
      email: "lisi@example.com",
      department: "销售部",
      title: "销售",
      managerId: null,
    });

    const updated = await updateEmployee(employee.id, {
      employeeNo: "E002",
      name: "李四",
      email: "lisi@example.com",
      department: "华东销售部",
      title: "销售经理",
      managerId: null,
    });

    expect(updated.department).toBe("华东销售部");
    expect(updated.title).toBe("销售经理");
  });

  it("deactivates an employee instead of deleting it", async () => {
    const employee = await createEmployee({
      employeeNo: "E003",
      name: "王五",
      email: "wangwu@example.com",
      department: "人力资源部",
      title: "HRBP",
      managerId: null,
    });

    await deactivateEmployee(employee.id);
    const employees = await listEmployees("", "inactive");

    expect(employees[0]?.status).toBe("inactive");
  });
});
```

- [ ] **Step 2: Run the tests to verify missing module failure**

Run:

```bash
pnpm test tests/lib/employees/service.test.ts
```

Expected:

- FAIL because `@/lib/employees/service` does not exist.

- [ ] **Step 3: Add employee types and validators**

Create `lib/employees/types.ts`:

```ts
export type EmployeeStatus = "active" | "inactive";

export type EmployeeInput = {
  employeeNo?: string | null;
  name: string;
  email?: string | null;
  department?: string | null;
  title?: string | null;
  managerId?: number | null;
};

export type EmployeeDetail = EmployeeInput & {
  id: number;
  status: EmployeeStatus;
  createdAt: number;
  updatedAt: number;
};
```

Create `lib/employees/validators.ts`:

```ts
import { z } from "zod";

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().optional().nullable(),
);

export const employeeInputSchema = z.object({
  employeeNo: optionalTrimmedString,
  name: z.string().trim().min(1, "员工姓名不能为空"),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().email("邮箱格式错误").optional().nullable(),
  ),
  department: optionalTrimmedString,
  title: optionalTrimmedString,
  managerId: z.number().int().positive().optional().nullable(),
});
```

- [ ] **Step 4: Add repository and service**

Create repository functions:

```ts
export async function insertEmployee(input: EmployeeInput): Promise<number>;
export async function updateEmployeeById(id: number, input: EmployeeInput): Promise<void>;
export async function setEmployeeStatus(id: number, status: EmployeeStatus): Promise<void>;
export async function findEmployeeById(id: number): Promise<EmployeeDetail | null>;
export async function searchEmployees(query?: string, status?: string): Promise<EmployeeDetail[]>;
```

Create service functions:

```ts
export async function createEmployee(input: EmployeeInput) {
  const parsed = employeeInputSchema.parse(input);
  const id = await insertEmployee(parsed);
  return (await findEmployeeById(id))!;
}

export async function updateEmployee(id: number, input: EmployeeInput) {
  const existing = await findEmployeeById(id);
  if (!existing) {
    throw new ApiError(404, "员工不存在");
  }
  const parsed = employeeInputSchema.parse(input);
  await updateEmployeeById(id, parsed);
  return (await findEmployeeById(id))!;
}

export async function deactivateEmployee(id: number) {
  const existing = await findEmployeeById(id);
  if (!existing) {
    throw new ApiError(404, "员工不存在");
  }
  await setEmployeeStatus(id, "inactive");
}

export async function listEmployees(query?: string, status?: string) {
  return searchEmployees(query, status);
}
```

- [ ] **Step 5: Run employee tests**

Run:

```bash
pnpm test tests/lib/employees/service.test.ts
```

Expected:

- PASS, employee service tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/employees tests/lib/employees/service.test.ts
git commit -m "feat: add employee domain services"
```

## Task 3: Evaluation Domain and Token Workflow

**Files:**
- Create: `lib/evaluations/types.ts`
- Create: `lib/evaluations/validators.ts`
- Create: `lib/evaluations/token.ts`
- Create: `lib/evaluations/repository.ts`
- Create: `lib/evaluations/service.ts`
- Create: `tests/lib/evaluations/service.test.ts`

- [ ] **Step 1: Write evaluation service tests**

Create `tests/lib/evaluations/service.test.ts` with these cases:

```ts
it("creates a draft evaluation cycle bound to a survey", async () => {
  const survey = await createSurvey({
    title: "360 评价表",
    questions: [
      {
        type: "rating",
        title: "沟通协作",
        required: true,
        orderIndex: 0,
        config: { maxRating: 5 },
        options: [],
      },
    ],
  });

  const cycle = await createEvaluationCycle({
    title: "2026 Q2 360",
    description: "管理干部环评",
    surveyId: survey.id,
    startsAt: null,
    endsAt: null,
    anonymityThreshold: 3,
  });

  expect(cycle.status).toBe("draft");
  expect(cycle.surveyId).toBe(survey.id);
});

it("assigns a rater to a subject with a unique token", async () => {
  const context = await createCycleWithEmployees();
  const subject = await addEvaluationSubject(context.cycle.id, context.subjectEmployee.id);

  const assignment = await addEvaluationAssignment(context.cycle.id, {
    subjectId: subject.id,
    raterEmployeeId: context.peerEmployee.id,
    relationship: "peer",
  });

  expect(assignment.token).toHaveLength(32);
  expect(assignment.status).toBe("pending");
});

it("publishes and closes an evaluation cycle", async () => {
  const context = await createCycleWithEmployees();

  await publishEvaluationCycle(context.cycle.id);
  expect((await getEvaluationCycleById(context.cycle.id))?.status).toBe("active");

  await closeEvaluationCycle(context.cycle.id);
  expect((await getEvaluationCycleById(context.cycle.id))?.status).toBe("closed");
});
```

The helper `createCycleWithEmployees` should create one survey, one cycle, one subject employee, and one peer employee using existing services.

- [ ] **Step 2: Run the tests to verify missing module failure**

Run:

```bash
pnpm test tests/lib/evaluations/service.test.ts
```

Expected:

- FAIL because `@/lib/evaluations/service` does not exist.

- [ ] **Step 3: Add types, validators and token generator**

Create `lib/evaluations/types.ts`:

```ts
export type EvaluationCycleStatus = "draft" | "active" | "closed";
export type EvaluationSubjectStatus = "active" | "removed";
export type EvaluationRelationship = "self" | "manager" | "peer" | "direct_report" | "other";
export type EvaluationAssignmentStatus = "pending" | "submitted" | "expired";

export type EvaluationCycleInput = {
  title: string;
  description?: string | null;
  surveyId: number;
  startsAt?: number | null;
  endsAt?: number | null;
  anonymityThreshold?: number;
};

export type EvaluationAssignmentInput = {
  subjectId: number;
  raterEmployeeId: number | null;
  relationship: EvaluationRelationship;
};
```

Create `lib/evaluations/token.ts`:

```ts
import crypto from "node:crypto";

export function generateEvaluationToken() {
  return crypto.randomBytes(24).toString("base64url").slice(0, 32);
}
```

Create Zod validators for cycle and assignment input. Require `anonymityThreshold` between 2 and 10.

- [ ] **Step 4: Add repository and service**

Implement repository functions:

```ts
insertEvaluationCycle(input)
updateEvaluationCycleById(id, input)
findEvaluationCycleById(id)
listEvaluationCycles()
setEvaluationCycleStatus(id, status)
insertEvaluationSubject(cycleId, employeeId)
listEvaluationSubjects(cycleId)
insertEvaluationAssignment(cycleId, input, token)
listEvaluationAssignments(cycleId)
findAssignmentByToken(token)
markAssignmentSubmitted(assignmentId, responseId)
```

Implement service functions:

```ts
createEvaluationCycle
updateEvaluationCycle
getEvaluationCycleById
listEvaluationCycles
publishEvaluationCycle
closeEvaluationCycle
addEvaluationSubject
addEvaluationAssignment
getAssignmentByToken
submitEvaluationAssignmentResponse
```

Rules:

- A cycle can only be published from `draft`.
- A closed cycle cannot be updated.
- A subject employee must be active.
- A rater employee must be active when `raterEmployeeId` is not null.
- A token submission is rejected unless cycle status is `active` and assignment status is `pending`.

- [ ] **Step 5: Run evaluation tests**

Run:

```bash
pnpm test tests/lib/evaluations/service.test.ts
```

Expected:

- PASS, evaluation service tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/evaluations tests/lib/evaluations/service.test.ts
git commit -m "feat: add evaluation cycle and assignment services"
```

## Task 4: Report Policy and Aggregation

**Files:**
- Create: `lib/evaluations/report-policy.ts`
- Create: `lib/evaluations/report-service.ts`
- Create: `tests/lib/evaluations/report-policy.test.ts`
- Create: `tests/lib/evaluations/report-service.test.ts`

- [ ] **Step 1: Write anonymous policy tests**

Create `tests/lib/evaluations/report-policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { canShowRelationshipGroup } from "@/lib/evaluations/report-policy";

describe("report policy", () => {
  it("always shows self and manager groups", () => {
    expect(canShowRelationshipGroup("self", 1, 3)).toBe(true);
    expect(canShowRelationshipGroup("manager", 1, 3)).toBe(true);
  });

  it("hides peer, direct report and other groups below threshold", () => {
    expect(canShowRelationshipGroup("peer", 2, 3)).toBe(false);
    expect(canShowRelationshipGroup("direct_report", 2, 3)).toBe(false);
    expect(canShowRelationshipGroup("other", 2, 3)).toBe(false);
  });

  it("shows non-identifying groups at or above threshold", () => {
    expect(canShowRelationshipGroup("peer", 3, 3)).toBe(true);
    expect(canShowRelationshipGroup("direct_report", 4, 3)).toBe(true);
  });
});
```

- [ ] **Step 2: Implement policy**

Create `lib/evaluations/report-policy.ts`:

```ts
import type { EvaluationRelationship } from "@/lib/evaluations/types";

export function canShowRelationshipGroup(
  relationship: EvaluationRelationship,
  count: number,
  threshold: number,
) {
  if (relationship === "self" || relationship === "manager") {
    return count > 0;
  }
  return count >= threshold;
}
```

- [ ] **Step 3: Write report aggregation tests**

Create tests that build one subject with rating answers from self, manager and peers. Assert:

- rating question average is calculated per relationship;
- peer group below threshold is hidden;
- text answers are returned only for visible groups;
- no rater employee name appears in report output.

- [ ] **Step 4: Implement report service**

Create `buildSubjectReport(subjectId)` that returns:

```ts
export type SubjectReport = {
  subject: {
    id: number;
    employeeName: string;
    department: string | null;
    title: string | null;
  };
  cycle: {
    id: number;
    title: string;
    anonymityThreshold: number;
  };
  completion: {
    submittedAssignments: number;
    totalAssignments: number;
  };
  ratingQuestions: Array<{
    questionId: number;
    title: string;
    groups: Array<{
      relationship: EvaluationRelationship;
      average: number;
      count: number;
      hidden: boolean;
    }>;
  }>;
  textQuestions: Array<{
    questionId: number;
    title: string;
    groups: Array<{
      relationship: EvaluationRelationship;
      answers: string[];
      hidden: boolean;
    }>;
  }>;
};
```

Use existing `answers["question_<id>"]` convention from survey responses.

- [ ] **Step 5: Run report tests**

Run:

```bash
pnpm test tests/lib/evaluations/report-policy.test.ts tests/lib/evaluations/report-service.test.ts
```

Expected:

- PASS, policy and report aggregation tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/evaluations/report-policy.ts lib/evaluations/report-service.ts tests/lib/evaluations
git commit -m "feat: add anonymous 360 report aggregation"
```

## Task 5: Admin APIs

**Files:**
- Create: `app/api/employees/route.ts`
- Create: `app/api/employees/[id]/route.ts`
- Create: `app/api/evaluations/route.ts`
- Create: `app/api/evaluations/[id]/route.ts`
- Create: `app/api/evaluations/[id]/publish/route.ts`
- Create: `app/api/evaluations/[id]/subjects/route.ts`
- Create: `app/api/evaluations/[id]/assignments/route.ts`
- Create: `app/api/evaluations/[id]/export/route.ts`
- Create: `app/api/evaluations/subjects/[subjectId]/report/route.ts`

- [ ] **Step 1: Add protected employee APIs**

Implement:

- `GET /api/employees?query=&status=`
- `POST /api/employees`
- `PUT /api/employees/[id]`
- `DELETE /api/employees/[id]` as deactivate, not hard delete

All routes call `requireAdminSession()` and use `ok()` / `fromError()`.

- [ ] **Step 2: Add protected evaluation APIs**

Implement:

- `GET /api/evaluations`
- `POST /api/evaluations`
- `GET /api/evaluations/[id]`
- `PUT /api/evaluations/[id]`
- `POST /api/evaluations/[id]/publish` with body `{ "status": "active" | "closed" }`
- `POST /api/evaluations/[id]/subjects`
- `POST /api/evaluations/[id]/assignments`
- `GET /api/evaluations/subjects/[subjectId]/report`

- [ ] **Step 3: Add CSV export**

Implement `GET /api/evaluations/[id]/export?type=assignments`:

Columns:

- `cycle_id`
- `cycle_title`
- `subject_name`
- `rater_name`
- `relationship`
- `status`
- `submitted_at`
- `fill_url`

Use existing `buildCsv`.

- [ ] **Step 4: Run route-level smoke tests through lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected:

- Lint passes.
- Build passes with all new route handlers compiled.

- [ ] **Step 5: Commit**

```bash
git add app/api
git commit -m "feat: add employee 360 admin APIs"
```

## Task 6: Employee Admin UI

**Files:**
- Modify: `components/layout/admin-shell.tsx`
- Create: `app/employees/page.tsx`
- Create: `components/employees/employee-list.tsx`
- Create: `components/employees/employee-form-dialog.tsx`

- [ ] **Step 1: Add navigation entries**

Add links in `AdminShell`:

- `/surveys` with label `问卷`
- `/employees` with label `员工`
- `/evaluations` with label `360 环评`

Keep the existing title and actions slots unchanged.

- [ ] **Step 2: Build employee page**

Create `app/employees/page.tsx`:

- Require admin session.
- Read `query` and `status` search params.
- Call `listEmployees(query, status)`.
- Render `AdminShell` with title `员工档案`.
- Render `EmployeeList`.

- [ ] **Step 3: Build employee list and form dialog**

`EmployeeList` responsibilities:

- Search by name, email, employeeNo, department.
- Filter active/inactive.
- Show employeeNo, name, email, department, title, status.
- Provide edit and deactivate actions.

`EmployeeFormDialog` fields:

- employeeNo
- name
- email
- department
- title
- managerId as a select list of active employees

- [ ] **Step 4: Run component and app verification**

Run:

```bash
pnpm lint
pnpm build
```

Expected:

- Lint passes.
- Build passes.

- [ ] **Step 5: Commit**

```bash
git add components/layout/admin-shell.tsx app/employees components/employees
git commit -m "feat: add employee admin interface"
```

## Task 7: Evaluation Admin UI

**Files:**
- Create: `app/evaluations/page.tsx`
- Create: `app/evaluations/new/page.tsx`
- Create: `app/evaluations/[id]/page.tsx`
- Create: `components/evaluations/evaluation-list.tsx`
- Create: `components/evaluations/evaluation-form.tsx`
- Create: `components/evaluations/progress-overview.tsx`
- Create: `components/evaluations/subject-assignment-table.tsx`

- [ ] **Step 1: Build evaluation list page**

The page renders:

- project title;
- status badge;
- bound survey title;
- start and end date;
- completion summary;
- actions: edit, open detail, export.

- [ ] **Step 2: Build evaluation creation form**

Fields:

- title;
- description;
- surveyId select from existing surveys;
- startsAt date;
- endsAt date;
- anonymityThreshold number input, default 3.

Submit to `POST /api/evaluations`.

- [ ] **Step 3: Build project detail page**

The page renders:

- `ProgressOverview`;
- subject list;
- assignment table grouped by subject;
- publish or close button depending on status.

- [ ] **Step 4: Build assignment table**

The table supports:

- adding subject by employee select;
- adding assignment by subject, rater and relationship;
- showing token fill URL after publish;
- opening subject report when submitted count is greater than 0.

- [ ] **Step 5: Run UI verification**

Run:

```bash
pnpm lint
pnpm build
```

Expected:

- Lint passes.
- Build passes.

- [ ] **Step 6: Commit**

```bash
git add app/evaluations components/evaluations
git commit -m "feat: add 360 evaluation admin interface"
```

## Task 8: Token Fill Flow

**Files:**
- Create: `app/api/evaluations/assignments/[token]/route.ts`
- Create: `app/api/evaluations/assignments/[token]/responses/route.ts`
- Create: `app/evaluations/fill/[token]/page.tsx`
- Create: `app/evaluations/fill/[token]/thank-you/page.tsx`
- Create: `components/evaluations/evaluation-fill-page-client.tsx`
- Create: `tests/components/evaluation-fill-form.test.tsx`

- [ ] **Step 1: Write component test**

Create a test that renders the token fill client with:

- cycle title `2026 Q2 360`;
- subject name `张三`;
- relationship `peer`;
- one rating question.

Assert the page shows `你正在评价：张三` and posts a payload without exposing rater identity in the UI.

- [ ] **Step 2: Add token detail API**

`GET /api/evaluations/assignments/[token]` returns:

- cycle title;
- subject display fields;
- relationship label;
- survey detail;
- assignment status.

It does not return rater employee fields.

- [ ] **Step 3: Add token response API**

`POST /api/evaluations/assignments/[token]/responses`:

1. Load assignment by token.
2. Reject missing token with 404.
3. Reject non-active cycle with 403.
4. Reject submitted assignment with 409.
5. Validate answers against bound survey.
6. Insert `survey_responses` with `respondentId` equal to `evaluation-assignment:<assignmentId>`.
7. Mark assignment submitted with `responseId` and `submittedAt`.

- [ ] **Step 4: Add token fill page**

Server page:

- loads token assignment;
- handles 404, closed, submitted states with friendly copy;
- renders `SurveyFillForm` through `EvaluationFillPageClient`.

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm test tests/components/evaluation-fill-form.test.tsx tests/lib/evaluations/service.test.ts
pnpm build
```

Expected:

- Component test passes.
- Evaluation service tests pass.
- Build passes.

- [ ] **Step 6: Commit**

```bash
git add app/api/evaluations/assignments app/evaluations/fill components/evaluations/evaluation-fill-page-client.tsx tests/components/evaluation-fill-form.test.tsx
git commit -m "feat: add 360 evaluation token fill flow"
```

## Task 9: Subject Report UI

**Files:**
- Create: `app/evaluations/[id]/subjects/[subjectId]/report/page.tsx`
- Create: `components/evaluations/subject-report.tsx`

- [ ] **Step 1: Build report page**

Server page:

- require admin session;
- call `buildSubjectReport(Number(subjectId))`;
- render `SubjectReport`.

- [ ] **Step 2: Build report component**

Show:

- subject header;
- completion count;
- rating question table with relationship, average, count;
- hidden group notice when `hidden` is true;
- text question snippets for visible groups.

Do not render rater name, email or employee number.

- [ ] **Step 3: Run report verification**

Run:

```bash
pnpm test tests/lib/evaluations/report-service.test.ts
pnpm build
```

Expected:

- Report service tests pass.
- Build passes.

- [ ] **Step 4: Commit**

```bash
git add app/evaluations/[id]/subjects components/evaluations/subject-report.tsx
git commit -m "feat: add 360 subject report page"
```

## Task 10: E2E Coverage and Final Verification

**Files:**
- Create: `tests/e2e/employee-360-review.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Add E2E scenario**

Create `tests/e2e/employee-360-review.spec.ts`:

Scenario:

1. Login as admin.
2. Create subject employee `张三`.
3. Create rater employee `李四`.
4. Create a rating survey.
5. Create a 360 evaluation cycle.
6. Add `张三` as subject.
7. Add `李四` as peer assignment.
8. Publish cycle.
9. Open token link in a new browser context.
10. Submit rating answer.
11. Return to admin project detail.
12. Assert completed count is updated.
13. Open report and assert peer result is hidden when threshold is 3.

- [ ] **Step 2: Update README**

Add a short section:

```md
## 360 环评

Juanbing 支持在通用问卷之上创建员工 360 环评项目。管理员可以维护员工档案，配置被评人和评价任务，通过专属 token 链接收集评价，并查看遵守匿名阈值的被评人报告。
```

- [ ] **Step 3: Run full verification**

Run:

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e tests/e2e/employee-360-review.spec.ts
```

Expected:

- Lint passes.
- Unit and component tests pass.
- Production build passes.
- New E2E scenario passes.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/employee-360-review.spec.ts README.md
git commit -m "test: cover employee 360 review workflow"
```

## Self-Review

- Spec coverage: Tasks 1-4 cover data model, service rules, token workflow and reporting policy. Tasks 5-9 cover APIs and UI. Task 10 covers end-to-end workflow and README.
- 未决项扫描：本计划包含具体文件路径、命令、数据结构和预期结果，未保留未决标记。
- Type consistency: The plan consistently uses `Employee`, `EvaluationCycle`, `EvaluationSubject`, `EvaluationAssignment`, `relationship`, `token`, `responseId`, and `anonymityThreshold`.
- Scope check: The plan is focused on one MVP slice. Multi-tenant, SSO, automatic reminders and PDF export are intentionally excluded from this implementation plan.
