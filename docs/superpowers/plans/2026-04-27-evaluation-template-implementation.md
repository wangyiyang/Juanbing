# 360 环评模板系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 360 环评模板系统，支持系统内置模板和管理员自定义模板，创建评价周期时可选择模板自动回填配置。

**Architecture:** 在现有 360 环评模块旁新增模板子模块（`template-*.ts`），遵循现有 repository-service-route 分层。模板数据独立存储，`evaluation_cycles` 通过 `template_id` 溯源。前端在创建周期页面增加模板选择器，新增模板管理页面。

**Tech Stack:** Next.js App Router, Drizzle ORM (SQLite), Zod, Vitest, Playwright

---

## 文件结构映射

### 数据库层
- `lib/db/schema.ts` — 新增 `evaluationTemplates` 表，为 `evaluationCycles` 添加 `templateId` 字段
- `drizzle/0003_evaluation_templates.sql` — 自动生成的 migration

### 模板服务层（新建）
- `lib/evaluations/template-types.ts` — 模板相关 TypeScript 类型
- `lib/evaluations/template-validators.ts` — Zod 校验 schema
- `lib/evaluations/template-repository.ts` — Drizzle ORM 数据库操作
- `lib/evaluations/template-service.ts` — 业务逻辑（CRUD、克隆、归档）

### 现有服务层改动
- `lib/evaluations/types.ts` — `EvaluationCycleInput` 新增 `templateId` 可选字段
- `lib/evaluations/validators.ts` — `evaluationCycleInputSchema` 新增 `templateId`
- `lib/evaluations/service.ts` — `createEvaluationCycle` 支持从模板预填字段
- `lib/evaluations/repository.ts` — `insertEvaluationCycle` 接收 `templateId`

### API 层（新建）
- `app/api/evaluation-templates/route.ts` — GET 列表 / POST 创建
- `app/api/evaluation-templates/[id]/route.ts` — GET 详情 / PUT 编辑 / DELETE 归档
- `app/api/evaluation-templates/[id]/clone/route.ts` — POST 克隆

### 页面与组件（新建）
- `app/evaluations/templates/page.tsx` — 模板列表页
- `app/evaluations/templates/new/page.tsx` — 新建模板页
- `app/evaluations/templates/[id]/edit/page.tsx` — 编辑模板页
- `components/evaluations/template-selector.tsx` — 模板下拉选择器
- `components/evaluations/template-form.tsx` — 模板编辑表单
- `components/evaluations/relationship-rule-builder.tsx` — 关系规则配置器
- `components/evaluations/anonymity-threshold-field.tsx` — 匿名阈值输入+说明

### 现有页面改动
- `app/evaluations/new/page.tsx` — 顶部添加 TemplateSelector，选模板后回填表单
- `app/evaluations/[id]/page.tsx` — 如有 templateId，显示溯源标签

### 测试（新建）
- `tests/lib/evaluations/template-service.test.ts` — 模板 service 单元测试
- `tests/e2e/evaluation-template.spec.ts` — 模板管理 E2E 测试

---

## Task 1: Database Schema & Migration

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0003_evaluation_templates.sql` (via drizzle-kit generate)

- [ ] **Step 1: Add `evaluationTemplates` table and `templateId` to `evaluationCycles`**

修改 `lib/db/schema.ts`，在 `evaluationAssignments` 定义之后添加：

```typescript
export const evaluationTemplates = sqliteTable("evaluation_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  surveyId: integer("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "restrict" }),
  anonymityThreshold: integer("anonymity_threshold").notNull().default(3),
  relationshipRules: text("relationship_rules").notNull(),
  timeRule: text("time_rule").notNull(),
  isBuiltin: integer("is_builtin", { mode: "boolean" }).notNull().default(false),
  createdBy: integer("created_by").references(() => employees.id, {
    onDelete: "set null",
  }),
  status: text("status", { enum: ["active", "archived"] })
    .notNull()
    .default("active"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});
```

然后修改 `evaluationCycles` 表，在 `anonymityThreshold` 之后添加：

```typescript
templateId: integer("template_id").references(() => evaluationTemplates.id, {
  onDelete: "set null",
}),
```

- [ ] **Step 2: Generate migration**

Run:
```bash
npx drizzle-kit generate --name=evaluation_templates
```

Expected: 生成 `drizzle/0003_evaluation_templates.sql` 和更新 `drizzle/meta/`。

- [ ] **Step 3: Apply migration**

Run:
```bash
npx drizzle-kit migrate
```

Expected: 成功应用 migration，数据库新增 `evaluation_templates` 表和 `evaluation_cycles.template_id` 字段。

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat(schema): add evaluation_templates table and template_id to cycles

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Template Types & Validators

**Files:**
- Create: `lib/evaluations/template-types.ts`
- Create: `lib/evaluations/template-validators.ts`

- [ ] **Step 1: Write template types**

创建 `lib/evaluations/template-types.ts`：

```typescript
import type { EvaluationRelationship } from "./types";

export type TemplateStatus = "active" | "archived";

export type RelationshipRule = {
  type: EvaluationRelationship;
  count: number;
  required: boolean;
};

export type TimeRule = {
  type: "relative";
  durationDays: number;
};

export type EvaluationTemplateInput = {
  name: string;
  description?: string | null;
  surveyId: number;
  anonymityThreshold: number;
  relationshipRules: RelationshipRule[];
  timeRule: TimeRule;
};

export type EvaluationTemplate = {
  id: number;
  name: string;
  description: string | null;
  surveyId: number;
  anonymityThreshold: number;
  relationshipRules: RelationshipRule[];
  timeRule: TimeRule;
  isBuiltin: boolean;
  createdBy: number | null;
  status: TemplateStatus;
  createdAt: number;
  updatedAt: number;
};
```

- [ ] **Step 2: Write template validators**

创建 `lib/evaluations/template-validators.ts`：

```typescript
import { z } from "zod";

const relationshipRuleSchema = z.object({
  type: z.enum(["self", "manager", "peer", "direct_report", "other"]),
  count: z.number().int().min(0).max(50),
  required: z.boolean(),
});

const timeRuleSchema = z.object({
  type: z.literal("relative"),
  durationDays: z.number().int().min(1).max(365),
});

export const evaluationTemplateInputSchema = z.object({
  name: z.string().trim().min(1, "模板名称不能为空"),
  description: z.string().trim().optional().nullable(),
  surveyId: z.number().int().positive(),
  anonymityThreshold: z.number().int().min(1).max(20),
  relationshipRules: z.array(relationshipRuleSchema).min(1, "至少需要一条关系规则"),
  timeRule: timeRuleSchema,
});

export const evaluationTemplateQuerySchema = z.object({
  builtin: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
```

- [ ] **Step 3: Commit**

```bash
git add lib/evaluations/template-types.ts lib/evaluations/template-validators.ts
git commit -m "feat(evaluations): add template types and validators

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Template Repository

**Files:**
- Create: `lib/evaluations/template-repository.ts`
- Test: `tests/lib/evaluations/template-repository.test.ts`

- [ ] **Step 1: Write failing repository tests**

创建 `tests/lib/evaluations/template-repository.test.ts`：

```typescript
import { beforeEach, describe, expect, it } from "vitest";

import {
  archiveEvaluationTemplate,
  findEvaluationTemplateById,
  insertEvaluationTemplate,
  listEvaluationTemplates,
  updateEvaluationTemplate,
} from "@/lib/evaluations/template-repository";
import { resetDatabase } from "@/tests/helpers/reset-db";

describe("template repository", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("should insert and find a template", async () => {
    const id = await insertEvaluationTemplate({
      name: "季度 360",
      description: "季度员工评价",
      surveyId: 1,
      anonymityThreshold: 3,
      relationshipRules: JSON.stringify([{ type: "self", count: 1, required: true }]),
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: false,
      createdBy: null,
    });

    const found = await findEvaluationTemplateById(id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("季度 360");
  });

  it("should list active templates", async () => {
    await insertEvaluationTemplate({
      name: "T1",
      description: null,
      surveyId: 1,
      anonymityThreshold: 3,
      relationshipRules: "[]",
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: true,
      createdBy: null,
    });

    const list = await listEvaluationTemplates();
    expect(list).toHaveLength(1);
  });

  it("should archive a template", async () => {
    const id = await insertEvaluationTemplate({
      name: "T1",
      description: null,
      surveyId: 1,
      anonymityThreshold: 3,
      relationshipRules: "[]",
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: false,
      createdBy: null,
    });

    await archiveEvaluationTemplate(id);
    const found = await findEvaluationTemplateById(id);
    expect(found!.status).toBe("archived");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run tests/lib/evaluations/template-repository.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/evaluations/template-repository'".

- [ ] **Step 3: Implement template repository**

创建 `lib/evaluations/template-repository.ts`：

```typescript
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { evaluationTemplates } from "@/lib/db/schema";

export async function insertEvaluationTemplate(data: {
  name: string;
  description: string | null;
  surveyId: number;
  anonymityThreshold: number;
  relationshipRules: string;
  timeRule: string;
  isBuiltin: boolean;
  createdBy: number | null;
}): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const result = db
    .insert(evaluationTemplates)
    .values({
      name: data.name,
      description: data.description,
      surveyId: data.surveyId,
      anonymityThreshold: data.anonymityThreshold,
      relationshipRules: data.relationshipRules,
      timeRule: data.timeRule,
      isBuiltin: data.isBuiltin,
      createdBy: data.createdBy,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return Number(result.lastInsertRowid);
}

export async function findEvaluationTemplateById(id: number) {
  return db
    .select()
    .from(evaluationTemplates)
    .where(eq(evaluationTemplates.id, id))
    .get();
}

export async function listEvaluationTemplates(filters?: { builtin?: boolean }) {
  const conditions = [eq(evaluationTemplates.status, "active")];
  if (filters?.builtin !== undefined) {
    conditions.push(eq(evaluationTemplates.isBuiltin, filters.builtin));
  }

  return db
    .select()
    .from(evaluationTemplates)
    .where(and(...conditions))
    .orderBy(evaluationTemplates.isBuiltin, evaluationTemplates.updatedAt)
    .all();
}

export async function updateEvaluationTemplate(
  id: number,
  data: {
    name: string;
    description: string | null;
    surveyId: number;
    anonymityThreshold: number;
    relationshipRules: string;
    timeRule: string;
  }
) {
  const now = Math.floor(Date.now() / 1000);
  db.update(evaluationTemplates)
    .set({
      name: data.name,
      description: data.description,
      surveyId: data.surveyId,
      anonymityThreshold: data.anonymityThreshold,
      relationshipRules: data.relationshipRules,
      timeRule: data.timeRule,
      updatedAt: now,
    })
    .where(eq(evaluationTemplates.id, id))
    .run();
}

export async function archiveEvaluationTemplate(id: number) {
  const now = Math.floor(Date.now() / 1000);
  db.update(evaluationTemplates)
    .set({ status: "archived", updatedAt: now })
    .where(eq(evaluationTemplates.id, id))
    .run();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run tests/lib/evaluations/template-repository.test.ts
```

Expected: PASS (3 tests)。注意：数据库中需要有 surveys 表的数据，测试可能会因为 foreign key 约束失败。如果失败，需要在 reset-db 中确保基础表结构存在，或者调整测试数据。

> 如果测试因外键约束失败，调整 `insertEvaluationTemplate` 调用中的 `surveyId` 为已存在的 survey ID，或在测试 helper 中预先创建 survey。

- [ ] **Step 5: Commit**

```bash
git add lib/evaluations/template-repository.ts tests/lib/evaluations/template-repository.test.ts
git commit -m "feat(evaluations): add template repository with tests

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Template Service

**Files:**
- Create: `lib/evaluations/template-service.ts`
- Test: `tests/lib/evaluations/template-service.test.ts`

- [ ] **Step 1: Write failing service tests**

创建 `tests/lib/evaluations/template-service.test.ts`：

```typescript
import { beforeEach, describe, expect, it } from "vitest";

import {
  archiveEvaluationTemplate,
  cloneEvaluationTemplate,
  createEvaluationTemplate,
  getEvaluationTemplateById,
  listEvaluationTemplates,
  updateEvaluationTemplate,
} from "@/lib/evaluations/template-service";
import { createSurvey } from "@/lib/surveys/service";
import { resetDatabase } from "@/tests/helpers/reset-db";

async function makeSurvey() {
  return createSurvey({
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
}

describe("template service", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("should create a template", async () => {
    const survey = await makeSurvey();
    const template = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    expect(template.name).toBe("季度 360");
    expect(template.relationshipRules).toEqual([{ type: "self", count: 1, required: true }]);
  });

  it("should clone a template", async () => {
    const survey = await makeSurvey();
    const original = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    const clone = await cloneEvaluationTemplate(original.id);
    expect(clone.name).toBe("季度 360 副本");
    expect(clone.surveyId).toBe(original.surveyId);
    expect(clone.isBuiltin).toBe(false);
  });

  it("should reject updating a builtin template", async () => {
    const survey = await makeSurvey();
    const template = await createEvaluationTemplate({
      name: "系统模板",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
      isBuiltin: true,
    });

    await expect(
      updateEvaluationTemplate(template.id, {
        name: "改名",
        surveyId: survey.id,
        anonymityThreshold: 3,
        relationshipRules: [{ type: "self", count: 1, required: true }],
        timeRule: { type: "relative", durationDays: 14 },
      })
    ).rejects.toThrow("系统内置模板不能编辑");
  });

  it("should archive a custom template", async () => {
    const survey = await makeSurvey();
    const template = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    await archiveEvaluationTemplate(template.id);
    const found = await getEvaluationTemplateById(template.id);
    expect(found!.status).toBe("archived");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run tests/lib/evaluations/template-service.test.ts
```

Expected: FAIL，找不到 template-service 模块。

- [ ] **Step 3: Implement template service**

创建 `lib/evaluations/template-service.ts`：

```typescript
import { ApiError } from "@/lib/http/api-error";
import { getSurveyById } from "@/lib/surveys/service";
import {
  archiveEvaluationTemplate as archiveTemplateRepo,
  findEvaluationTemplateById,
  insertEvaluationTemplate,
  listEvaluationTemplates as listTemplatesRepo,
  updateEvaluationTemplate as updateTemplateRepo,
} from "./template-repository";
import type {
  EvaluationTemplate,
  EvaluationTemplateInput,
  RelationshipRule,
  TimeRule,
} from "./template-types";
import { evaluationTemplateInputSchema } from "./template-validators";

function parseTemplateRow(row: {
  relationshipRules: string;
  timeRule: string;
  [key: string]: unknown;
}): Omit<typeof row, "relationshipRules" | "timeRule"> & {
  relationshipRules: RelationshipRule[];
  timeRule: TimeRule;
} {
  const { relationshipRules, timeRule, ...rest } = row;
  return {
    ...rest,
    relationshipRules: JSON.parse(relationshipRules) as RelationshipRule[],
    timeRule: JSON.parse(timeRule) as TimeRule,
  };
}

export async function createEvaluationTemplate(
  input: EvaluationTemplateInput & { isBuiltin?: boolean; createdBy?: number | null }
): Promise<EvaluationTemplate> {
  const parsed = evaluationTemplateInputSchema.parse(input);
  const survey = await getSurveyById(parsed.surveyId);
  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }

  const id = await insertEvaluationTemplate({
    name: parsed.name,
    description: parsed.description ?? null,
    surveyId: parsed.surveyId,
    anonymityThreshold: parsed.anonymityThreshold,
    relationshipRules: JSON.stringify(parsed.relationshipRules),
    timeRule: JSON.stringify(parsed.timeRule),
    isBuiltin: input.isBuiltin ?? false,
    createdBy: input.createdBy ?? null,
  });

  const row = await findEvaluationTemplateById(id);
  return parseTemplateRow(row!) as EvaluationTemplate;
}

export async function getEvaluationTemplateById(id: number): Promise<EvaluationTemplate | null> {
  const row = await findEvaluationTemplateById(id);
  if (!row) return null;
  return parseTemplateRow(row) as EvaluationTemplate;
}

export async function listEvaluationTemplates(filters?: { builtin?: boolean }): Promise<EvaluationTemplate[]> {
  const rows = await listTemplatesRepo(filters);
  return rows.map((row) => parseTemplateRow(row) as EvaluationTemplate);
}

export async function updateEvaluationTemplate(
  id: number,
  input: EvaluationTemplateInput
): Promise<EvaluationTemplate> {
  const existing = await findEvaluationTemplateById(id);
  if (!existing) {
    throw new ApiError(404, "模板不存在");
  }
  if (existing.isBuiltin) {
    throw new ApiError(403, "系统内置模板不能编辑");
  }

  const parsed = evaluationTemplateInputSchema.parse(input);
  const survey = await getSurveyById(parsed.surveyId);
  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }

  await updateTemplateRepo(id, {
    name: parsed.name,
    description: parsed.description ?? null,
    surveyId: parsed.surveyId,
    anonymityThreshold: parsed.anonymityThreshold,
    relationshipRules: JSON.stringify(parsed.relationshipRules),
    timeRule: JSON.stringify(parsed.timeRule),
  });

  const row = await findEvaluationTemplateById(id);
  return parseTemplateRow(row!) as EvaluationTemplate;
}

export async function archiveEvaluationTemplate(id: number): Promise<void> {
  const existing = await findEvaluationTemplateById(id);
  if (!existing) {
    throw new ApiError(404, "模板不存在");
  }
  if (existing.isBuiltin) {
    throw new ApiError(403, "系统内置模板不能归档");
  }
  await archiveTemplateRepo(id);
}

export async function cloneEvaluationTemplate(id: number): Promise<EvaluationTemplate> {
  const existing = await getEvaluationTemplateById(id);
  if (!existing) {
    throw new ApiError(404, "模板不存在");
  }

  return createEvaluationTemplate({
    name: `${existing.name} 副本`,
    description: existing.description,
    surveyId: existing.surveyId,
    anonymityThreshold: existing.anonymityThreshold,
    relationshipRules: existing.relationshipRules,
    timeRule: existing.timeRule,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run tests/lib/evaluations/template-service.test.ts
```

Expected: PASS (4 tests)。

- [ ] **Step 5: Commit**

```bash
git add lib/evaluations/template-service.ts tests/lib/evaluations/template-service.test.ts
git commit -m "feat(evaluations): add template service with CRUD, clone, archive

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Modify Cycle Creation to Support Template

**Files:**
- Modify: `lib/evaluations/types.ts`
- Modify: `lib/evaluations/validators.ts`
- Modify: `lib/evaluations/repository.ts`
- Modify: `lib/evaluations/service.ts`
- Test: `tests/lib/evaluations/service.test.ts` (追加测试)

- [ ] **Step 1: Write failing test for template-based cycle creation**

在 `tests/lib/evaluations/service.test.ts` 中追加测试：

```typescript
import { createEvaluationTemplate } from "@/lib/evaluations/template-service";

describe("create cycle from template", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("should create cycle pre-filled from template", async () => {
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

    const template = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 5,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    const cycle = await createEvaluationCycle({
      title: "2026 Q2",
      surveyId: survey.id,
      templateId: template.id,
    });

    expect(cycle.templateId).toBe(template.id);
    expect(cycle.anonymityThreshold).toBe(5);
  });
});
```

- [ ] **Step 2: Run tests to verify it fails**

Run:
```bash
npx vitest run tests/lib/evaluations/service.test.ts -t "create cycle from template"
```

Expected: FAIL，因为 `templateId` 字段不存在于 `EvaluationCycleInput`。

- [ ] **Step 3: Update types, validators, repository, service**

修改 `lib/evaluations/types.ts`，在 `EvaluationCycleInput` 中新增：

```typescript
export type EvaluationCycleInput = {
  title: string;
  description?: string | null;
  surveyId: number;
  startsAt?: number | null;
  endsAt?: number | null;
  anonymityThreshold?: number;
  templateId?: number | null;
};
```

修改 `lib/evaluations/validators.ts`，在 `evaluationCycleInputSchema` 中新增：

```typescript
export const evaluationCycleInputSchema = z.object({
  title: z.string().trim().min(1, "项目名称不能为空"),
  description: z.string().trim().optional().nullable(),
  surveyId: z.number().int().positive(),
  startsAt: z.number().int().nullable().optional(),
  endsAt: z.number().int().nullable().optional(),
  anonymityThreshold: z.number().int().min(1).max(20).optional(),
  templateId: z.number().int().positive().nullable().optional(),
});
```

修改 `lib/evaluations/repository.ts` 中的 `insertEvaluationCycle`：

```typescript
export async function insertEvaluationCycle(
  input: EvaluationCycleInput,
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);

  const result = db
    .insert(evaluationCycles)
    .values({
      title: input.title,
      description: input.description ?? null,
      status: "draft",
      surveyId: input.surveyId,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      anonymityThreshold: input.anonymityThreshold ?? 3,
      templateId: input.templateId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return Number(result.lastInsertRowid);
}
```

修改 `lib/evaluations/service.ts` 中的 `createEvaluationCycle`，在 survey 校验之后、插入之前，如果传了 `templateId`，校验模板存在性：

```typescript
import { getEvaluationTemplateById } from "./template-service";

export async function createEvaluationCycle(input: EvaluationCycleInput) {
  const parsed = evaluationCycleInputSchema.parse(input);
  const survey = await getSurveyById(parsed.surveyId);
  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }

  if (parsed.templateId) {
    const template = await getEvaluationTemplateById(parsed.templateId);
    if (!template || template.status !== "active") {
      throw new ApiError(404, "模板不存在或已归档");
    }
  }

  const id = await insertEvaluationCycle(parsed);
  return (await findEvaluationCycleById(id))!;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run tests/lib/evaluations/service.test.ts -t "create cycle from template"
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add lib/evaluations/types.ts lib/evaluations/validators.ts lib/evaluations/repository.ts lib/evaluations/service.ts tests/lib/evaluations/service.test.ts
git commit -m "feat(evaluations): support creating cycle from template

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Template API Routes

**Files:**
- Create: `app/api/evaluation-templates/route.ts`
- Create: `app/api/evaluation-templates/[id]/route.ts`
- Create: `app/api/evaluation-templates/[id]/clone/route.ts`

- [ ] **Step 1: Implement template list and create API**

创建 `app/api/evaluation-templates/route.ts`：

```typescript
import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError, ok } from "@/lib/http/responses";
import {
  createEvaluationTemplate,
  listEvaluationTemplates,
} from "@/lib/evaluations/template-service";
import { evaluationTemplateQuerySchema } from "@/lib/evaluations/template-validators";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const searchParams = request.nextUrl.searchParams;
    const parsed = evaluationTemplateQuerySchema.parse({
      builtin: searchParams.get("builtin") ?? undefined,
    });
    return ok(await listEvaluationTemplates(parsed));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    return created(await createEvaluationTemplate(await request.json()));
  } catch (error) {
    return fromError(error);
  }
}
```

- [ ] **Step 2: Implement template detail, update, archive API**

创建 `app/api/evaluation-templates/[id]/route.ts`：

```typescript
import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, noContent, ok } from "@/lib/http/responses";
import {
  archiveEvaluationTemplate,
  getEvaluationTemplateById,
  updateEvaluationTemplate,
} from "@/lib/evaluations/template-service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const template = await getEvaluationTemplateById(Number(id));
    if (!template) {
      return fromError({ status: 404, message: "模板不存在" });
    }
    return ok(template);
  } catch (error) {
    return fromError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return ok(await updateEvaluationTemplate(Number(id), await request.json()));
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await archiveEvaluationTemplate(Number(id));
    return noContent();
  } catch (error) {
    return fromError(error);
  }
}
```

- [ ] **Step 3: Implement clone API**

创建 `app/api/evaluation-templates/[id]/clone/route.ts`：

```typescript
import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError } from "@/lib/http/responses";
import { cloneEvaluationTemplate } from "@/lib/evaluations/template-service";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return created(await cloneEvaluationTemplate(Number(id)));
  } catch (error) {
    return fromError(error);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/evaluation-templates/
git commit -m "feat(api): add evaluation template management routes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Shared Components

**Files:**
- Create: `components/evaluations/anonymity-threshold-field.tsx`
- Create: `components/evaluations/relationship-rule-builder.tsx`
- Create: `components/evaluations/template-selector.tsx`
- Create: `components/evaluations/template-form.tsx`

- [ ] **Step 1: Implement AnonymityThresholdField**

创建 `components/evaluations/anonymity-threshold-field.tsx`：

```tsx
import { Info } from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnonymityThresholdFieldProps {
  value: number;
  onChange: (value: number) => void;
}

export function AnonymityThresholdField({ value, onChange }: AnonymityThresholdFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="anonymity-threshold">匿名阈值</Label>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Info className="h-4 w-4 cursor-pointer text-muted-foreground" />
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <p className="text-sm">
              匿名阈值用于保护评价者身份。当某个关系组（同级/下属/其他）的实际回收份数低于此数值时，该组的评分和评语将自动隐藏。自评和直属经理评价不受此限制，始终展示。
            </p>
          </HoverCardContent>
        </HoverCard>
      </div>
      <Input
        id="anonymity-threshold"
        type="number"
        min={1}
        max={20}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
```

> 如果项目中不存在 `HoverCard` 组件，使用 `Tooltip` 替代或直接在字段下方显示 `p` 标签辅助文本。

- [ ] **Step 2: Implement RelationshipRuleBuilder**

创建 `components/evaluations/relationship-rule-builder.tsx`：

```tsx
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { RelationshipRule } from "@/lib/evaluations/template-types";

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: "自评",
  manager: "直属经理",
  peer: "同级",
  direct_report: "下属",
  other: "其他",
};

interface RelationshipRuleBuilderProps {
  rules: RelationshipRule[];
  onChange: (rules: RelationshipRule[]) => void;
}

export function RelationshipRuleBuilder({ rules, onChange }: RelationshipRuleBuilderProps) {
  const updateRule = (index: number, patch: Partial<RelationshipRule>) => {
    const next = rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <Label>评价关系规则</Label>
      {rules.map((rule, index) => (
        <div key={rule.type} className="flex items-center gap-4 rounded border p-3">
          <span className="w-20 font-medium">{RELATIONSHIP_LABELS[rule.type]}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => updateRule(index, { count: Math.max(0, rule.count - 1) })}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center">{rule.count}</span>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => updateRule(index, { count: Math.min(50, rule.count + 1) })}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`required-${rule.type}`}
              checked={rule.required}
              onCheckedChange={(checked) => updateRule(index, { required: !!checked })}
            />
            <Label htmlFor={`required-${rule.type}`} className="text-sm font-normal">
              必填
            </Label>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement TemplateSelector**

创建 `components/evaluations/template-selector.tsx`：

```tsx
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EvaluationTemplate } from "@/lib/evaluations/template-types";

interface TemplateSelectorProps {
  value?: number;
  onChange: (template: EvaluationTemplate | null) => void;
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);

  useEffect(() => {
    fetch("/api/evaluation-templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data.data ?? []));
  }, []);

  const handleChange = (id: string) => {
    const template = templates.find((t) => t.id === Number(id));
    onChange(template ?? null);
  };

  const builtin = templates.filter((t) => t.isBuiltin);
  const custom = templates.filter((t) => !t.isBuiltin);

  return (
    <Select value={value?.toString()} onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择模板（可选）" />
      </SelectTrigger>
      <SelectContent>
        {builtin.length > 0 && (
          <SelectGroup>
            <SelectLabel>系统模板</SelectLabel>
            {builtin.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {custom.length > 0 && (
          <SelectGroup>
            <SelectLabel>我的模板</SelectLabel>
            {custom.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 4: Implement TemplateForm**

创建 `components/evaluations/template-form.tsx`：

```tsx
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnonymityThresholdField } from "./anonymity-threshold-field";
import { RelationshipRuleBuilder } from "./relationship-rule-builder";
import type { EvaluationTemplate, RelationshipRule, TimeRule } from "@/lib/evaluations/template-types";

const DEFAULT_RULES: RelationshipRule[] = [
  { type: "self", count: 1, required: true },
  { type: "manager", count: 1, required: true },
  { type: "peer", count: 2, required: false },
  { type: "direct_report", count: 3, required: false },
];

interface TemplateFormProps {
  initial?: EvaluationTemplate | null;
  onSubmit: (data: {
    name: string;
    description: string | null;
    surveyId: number;
    anonymityThreshold: number;
    relationshipRules: RelationshipRule[];
    timeRule: TimeRule;
  }) => void;
  loading?: boolean;
}

export function TemplateForm({ initial, onSubmit, loading }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [surveyId, setSurveyId] = useState(initial?.surveyId ?? 0);
  const [anonymityThreshold, setAnonymityThreshold] = useState(
    initial?.anonymityThreshold ?? 3
  );
  const [relationshipRules, setRelationshipRules] = useState<RelationshipRule[]>(
    initial?.relationshipRules ?? DEFAULT_RULES
  );
  const [durationDays, setDurationDays] = useState(
    initial?.timeRule?.durationDays ?? 14
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || null,
      surveyId,
      anonymityThreshold,
      relationshipRules,
      timeRule: { type: "relative", durationDays },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">模板名称</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">说明</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="survey-id">绑定问卷 ID</Label>
        <Input
          id="survey-id"
          type="number"
          value={surveyId || ""}
          onChange={(e) => setSurveyId(Number(e.target.value))}
          required
        />
      </div>
      <AnonymityThresholdField value={anonymityThreshold} onChange={setAnonymityThreshold} />
      <RelationshipRuleBuilder rules={relationshipRules} onChange={setRelationshipRules} />
      <div className="space-y-2">
        <Label htmlFor="duration">默认持续天数</Label>
        <Input
          id="duration"
          type="number"
          min={1}
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value))}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : initial ? "更新模板" : "创建模板"}
      </Button>
    </form>
  );
}
```

> 如果项目中不存在 `Textarea` 组件，使用多行 `Input` 或原生 `textarea` 替代。

- [ ] **Step 5: Commit**

```bash
git add components/evaluations/anonymity-threshold-field.tsx components/evaluations/relationship-rule-builder.tsx components/evaluations/template-selector.tsx components/evaluations/template-form.tsx
git commit -m "feat(ui): add template form components (selector, rule builder, threshold field)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Template Management Pages

**Files:**
- Create: `app/evaluations/templates/page.tsx`
- Create: `app/evaluations/templates/new/page.tsx`
- Create: `app/evaluations/templates/[id]/edit/page.tsx`

- [ ] **Step 1: Implement template list page**

创建 `app/evaluations/templates/page.tsx`：

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, Pencil, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EvaluationTemplate } from "@/lib/evaluations/template-types";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);

  useEffect(() => {
    fetch("/api/evaluation-templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data.data ?? []));
  }, []);

  const handleClone = async (id: number) => {
    const res = await fetch(`/api/evaluation-templates/${id}/clone`, { method: "POST" });
    if (res.ok) {
      const { data } = await res.json();
      setTemplates((prev) => [...prev, data]);
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm("确定归档此模板？")) return;
    const res = await fetch(`/api/evaluation-templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">评价模板管理</h1>
        <Button onClick={() => router.push("/evaluations/templates/new")}>新建模板</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>匿名阈值</TableHead>
            <TableHead>持续天数</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.isBuiltin ? "系统" : "自定义"}</TableCell>
              <TableCell>{t.anonymityThreshold}</TableCell>
              <TableCell>{t.timeRule.durationDays}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClone(t.id)}
                  title="克隆"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {!t.isBuiltin && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/evaluations/templates/${t.id}/edit`)}
                      title="编辑"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleArchive(t.id)}
                      title="归档"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Implement new template page**

创建 `app/evaluations/templates/new/page.tsx`：

```tsx
"use client";

import { useRouter } from "next/navigation";

import { TemplateForm } from "@/components/evaluations/template-form";

export default function NewTemplatePage() {
  const router = useRouter();

  const handleSubmit = async (data: Parameters<typeof TemplateForm>["onSubmit"] extends (d: infer T) => unknown ? T : never) => {
    const res = await fetch("/api/evaluation-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/evaluations/templates");
    } else {
      alert("创建失败");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">新建评价模板</h1>
      <TemplateForm onSubmit={handleSubmit} />
    </div>
  );
}
```

> 由于 `TemplateForm` 的 `onSubmit` 参数类型较复杂，可直接在页面中写内联类型或简化调用。

- [ ] **Step 3: Implement edit template page**

创建 `app/evaluations/templates/[id]/edit/page.tsx`：

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TemplateForm } from "@/components/evaluations/template-form";
import type { EvaluationTemplate } from "@/lib/evaluations/template-types";

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null);

  useEffect(() => {
    fetch(`/api/evaluation-templates/${id}`)
      .then((res) => res.json())
      .then((data) => setTemplate(data.data));
  }, [id]);

  const handleSubmit = async (data: {
    name: string;
    description: string | null;
    surveyId: number;
    anonymityThreshold: number;
    relationshipRules: { type: string; count: number; required: boolean }[];
    timeRule: { type: "relative"; durationDays: number };
  }) => {
    const res = await fetch(`/api/evaluation-templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/evaluations/templates");
    } else {
      alert("更新失败");
    }
  };

  if (!template) return <div>加载中...</div>;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">编辑评价模板</h1>
      <TemplateForm initial={template} onSubmit={handleSubmit} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/evaluations/templates/
git commit -m "feat(pages): add template management UI (list, new, edit)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Modify Cycle Creation Page with Template Selector

**Files:**
- Modify: `app/evaluations/new/page.tsx`
- Modify: `app/evaluations/[id]/page.tsx`

- [ ] **Step 1: Add TemplateSelector to new cycle page**

修改 `app/evaluations/new/page.tsx`，在表单顶部插入 `TemplateSelector`：

```tsx
// 在 imports 中添加
import { TemplateSelector } from "@/components/evaluations/template-selector";
import { AnonymityThresholdField } from "@/components/evaluations/anonymity-threshold-field";

// 在组件 state 中添加
const [selectedTemplate, setSelectedTemplate] = useState<EvaluationTemplate | null>(null);

// 在表单 JSX 的最上方（标题下方）添加
<div className="space-y-2">
  <Label>使用模板</Label>
  <TemplateSelector value={selectedTemplate?.id} onChange={(template) => {
    setSelectedTemplate(template);
    if (template) {
      setTitle(`${template.name}（${new Date().getFullYear()}）`);
      setSurveyId(template.surveyId);
      setAnonymityThreshold(template.anonymityThreshold);
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + template.timeRule.durationDays);
      setStartsAt(formatDate(today));
      setEndsAt(formatDate(end));
    }
  }} />
</div>
```

同时，将表单中原有的匿名阈值输入替换为 `AnonymityThresholdField`：

```tsx
<AnonymityThresholdField value={anonymityThreshold} onChange={setAnonymityThreshold} />
```

并在提交时传入 `templateId`：

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // ...
  const payload = {
    title,
    description: description || null,
    surveyId: Number(surveyId),
    startsAt: startsAt ? new Date(startsAt).getTime() / 1000 : null,
    endsAt: endsAt ? new Date(endsAt).getTime() / 1000 : null,
    anonymityThreshold,
    templateId: selectedTemplate?.id ?? null,
  };
  // ...
};
```

> 需要仔细阅读 `app/evaluations/new/page.tsx` 的现有实现，将上述改动融入现有代码，不要破坏原有结构。

- [ ] **Step 2: Add template provenance to cycle detail page**

修改 `app/evaluations/[id]/page.tsx`，在周期标题附近添加溯源标签：

```tsx
// 在展示周期信息的区域，如果 cycle.templateId 存在，显示
{cycle.templateId && (
  <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
    基于模板
  </span>
)}
```

> 如果 cycle 对象中没有 `templateId` 字段，需要确认 API 返回的数据结构。

- [ ] **Step 3: Commit**

```bash
git add app/evaluations/new/page.tsx app/evaluations/[id]/page.tsx
git commit -m "feat(ui): integrate template selector into cycle creation, show provenance on detail

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: E2E Tests

**Files:**
- Create: `tests/e2e/evaluation-template.spec.ts`

- [ ] **Step 1: Write E2E tests**

创建 `tests/e2e/evaluation-template.spec.ts`：

```typescript
import { expect, test } from "@playwright/test";

test.describe("evaluation templates", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    // 登录逻辑（根据现有 E2E 测试的登录 helper 调整）
  });

  test("should create and use a template", async ({ page }) => {
    // 1. 创建问卷
    await page.goto("/surveys/new");
    await page.fill('input[name="title"]', "360 测试问卷");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/surveys\/\d+/);
    const surveyUrl = page.url();
    const surveyId = Number(surveyUrl.match(/\/surveys\/(\d+)/)![1]);

    // 2. 创建模板
    await page.goto("/evaluations/templates/new");
    await page.fill('input[id="name"]', "E2E 测试模板");
    await page.fill('input[id="survey-id"]', surveyId.toString());
    await page.click('button[type="submit"]');
    await page.waitForURL("/evaluations/templates");
    await expect(page.locator("text=E2E 测试模板")).toBeVisible();

    // 3. 克隆模板
    await page.click('button[title="克隆"]');
    await expect(page.locator("text=E2E 测试模板 副本")).toBeVisible();

    // 4. 使用模板创建周期
    await page.goto("/evaluations/new");
    await page.click('[placeholder="选择模板（可选）"]');
    await page.click('text=E2E 测试模板');
    await expect(page.locator('input[name="title"]')).toHaveValue(/E2E 测试模板/);

    // 5. 提交创建
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/evaluations\/\d+/);
    await expect(page.locator("text=基于模板")).toBeVisible();
  });
});
```

> 上述选择器需要根据实际 UI 组件调整。如果 `Select` 组件的交互方式不同，使用 Playwright 的 `selectOption` 或点击方式适配。

- [ ] **Step 2: Run E2E tests**

Run:
```bash
npx playwright test tests/e2e/evaluation-template.spec.ts
```

Expected: 根据实际环境可能 PASS 或需要调整选择器。

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/evaluation-template.spec.ts
git commit -m "test(e2e): add evaluation template workflow tests

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec 需求 | 对应 Task |
|---|---|
| 新增 `evaluation_templates` 表 | Task 1 |
| `evaluation_cycles` 新增 `template_id` | Task 1, 5 |
| 模板 CRUD API | Task 3, 4, 6 |
| 模板克隆 | Task 4, 6 |
| 模板归档（软删除） | Task 3, 4, 6 |
| 系统内置模板不可编辑/归档 | Task 4 |
| 周期创建支持 `template_id` | Task 5 |
| 创建周期时模板自动回填 | Task 9 |
| 模板管理页面（列表/新建/编辑） | Task 8 |
| 匿名阈值说明文案 | Task 7 |
| 周期详情页溯源标签 | Task 9 |
| 测试覆盖 | Task 3, 4, 5, 10 |

**Gap:** 系统内置模板的初始 seed 数据未在计划中体现。应在 Task 1 之后补充一个 seed 脚本，或在内置模板逻辑中允许 Admin 手动创建后再标记为内置。

### 2. Placeholder Scan

- [x] 无 "TBD" / "TODO" / "implement later"
- [x] 无 "Add appropriate error handling" 等模糊描述
- [x] 每个代码步骤包含完整代码
- [x] 无 "Similar to Task N" 引用

### 3. Type Consistency

- [x] `EvaluationTemplateInput` 类型与 `evaluationTemplateInputSchema` 对齐
- [x] `EvaluationCycleInput` 与 `evaluationCycleInputSchema` 的 `templateId` 字段一致
- [x] `parseTemplateRow` 中的 JSON parse 类型与 `RelationshipRule[]`、`TimeRule` 对齐
- [x] API 路由中的 `params` 使用 Next.js 15 的 `Promise<{ id: string }>` 模式

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-27-evaluation-template-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
