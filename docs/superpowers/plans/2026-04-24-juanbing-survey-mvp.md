# Juanbing Survey MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个可上线的 Juanbing 问卷调查 MVP，支持单管理员登录、问卷 CRUD、发布/下线、公开填写、防重复提交、基础结果看板与 CSV 导出。

**Architecture:** 采用 Next.js 15 App Router 做全栈单体应用，页面与 Route Handlers 复用同一组 service/repository 逻辑，避免管理端页面和 API 出现双份业务规则。数据层使用 SQLite + Drizzle ORM 做规范化建模，答案以 JSON 落库，但题目/选项保持结构化表，既满足 MVP 查询效率，也为第二阶段题型扩展保留接口。

**Tech Stack:** Next.js 15、TypeScript、Tailwind CSS、shadcn/ui、SQLite、better-sqlite3、Drizzle ORM、Zod、iron-session、bcryptjs、Recharts、Vitest、Playwright

---

## 范围裁剪

- 本计划只覆盖设计文档中的**第一阶段 MVP**，并为第二阶段预留类型扩展点。
- 第二阶段/后续迭代能力（下拉/日期/矩阵题、逻辑跳转、Excel 导出、复杂单题图表、模板、词云、分页、实时大屏）应拆成后续独立计划，不在当前文档内一次性落地。
- 设计文档里存在一个数据口径缺口：若要展示“平均填写时长”，`survey_responses` 需要新增 `duration_seconds` 字段，前端提交时同步上传本次填写耗时；否则无法可靠计算该指标。
- 问卷编辑器按风险控制采用 **点击添加 + 内联编辑 + 上下移动按钮** 交付 MVP，不在第一版引入拖拽排序库；这与原设计文档第 8 节风险缓解保持一致。

## 文件分工总览

### 根目录与工程配置

- `package.json`：统一依赖、脚本与开发命令入口。
- `next.config.ts`：Next.js 基础配置。
- `tsconfig.json`：TypeScript 与 `@/*` 别名配置。
- `eslint.config.mjs`：代码静态检查。
- `postcss.config.mjs`：Tailwind/PostCSS 配置。
- `vitest.config.ts`、`vitest.setup.ts`：单元测试/组件测试配置。
- `playwright.config.ts`：端到端测试配置。
- `.env.example`：环境变量模板。
- `drizzle.config.ts`：Drizzle Kit schema/migration 配置。

### 页面与路由

- `app/layout.tsx`：根布局与全局 provider。
- `app/page.tsx`：落地页，提供管理台入口。
- `app/login/page.tsx`：管理员登录页。
- `app/surveys/page.tsx`：问卷列表页。
- `app/surveys/new/page.tsx`：新建问卷页。
- `app/surveys/[id]/page.tsx`：编辑问卷页。
- `app/surveys/[id]/fill/page.tsx`：公开填写页/预览页。
- `app/surveys/[id]/fill/thank-you/page.tsx`：提交成功页。
- `app/surveys/[id]/results/page.tsx`：结果看板页。
- `app/api/auth/login/route.ts`、`app/api/auth/logout/route.ts`：登录/登出。
- `app/api/surveys/route.ts`、`app/api/surveys/[id]/route.ts`：问卷 CRUD。
- `app/api/surveys/[id]/public/route.ts`：公开读取已发布问卷。
- `app/api/surveys/[id]/publish/route.ts`：发布/下线。
- `app/api/surveys/[id]/responses/route.ts`：回答列表与提交回答（正式/预览）。
- `app/api/surveys/[id]/export/route.ts`：CSV 导出。

### 领域与基础设施

- `lib/config/env.ts`：环境变量读取与校验。
- `lib/db/client.ts`：SQLite 连接单例。
- `lib/db/schema.ts`：Drizzle schema。
- `lib/auth/session.ts`：iron-session 配置与管理员鉴权。
- `lib/http/api-error.ts`、`lib/http/responses.ts`：统一错误与响应。
- `lib/security/rate-limit.ts`：公开提交速率限制。
- `lib/security/sanitize.ts`：标题、描述、文本答案净化。
- `lib/surveys/types.ts`：问卷、题目、回答领域类型。
- `lib/surveys/question-defaults.ts`：MVP 题型默认草稿。
- `lib/surveys/editor-state.ts`：编辑器 reducer。
- `lib/surveys/validators.ts`：问卷/回答输入校验与必填校验。
- `lib/surveys/repository.ts`：数据库访问。
- `lib/surveys/service.ts`：问卷 CRUD、发布、公开读取。
- `lib/surveys/response-service.ts`：回答提交流程。
- `lib/analytics/service.ts`：概览统计与趋势聚合。
- `lib/export/csv.ts`：结果导出。
- `lib/respondent/respondent-id.ts`：浏览器端 respondent_id 管理。

### 组件

- `components/layout/admin-shell.tsx`：管理端通用壳层。
- `components/providers/toaster-provider.tsx`：全局消息提示。
- `components/surveys/survey-list.tsx`：问卷列表表格。
- `components/survey-editor/editor-shell.tsx`：编辑器总控。
- `components/survey-editor/component-palette.tsx`：题型侧栏。
- `components/survey-editor/question-list.tsx`：题目列表。
- `components/survey-editor/question-card.tsx`：单题卡片。
- `components/survey-editor/property-panel.tsx`：属性面板。
- `components/survey-fill/survey-fill-form.tsx`：填写表单。
- `components/survey-fill/question-field.tsx`：题型渲染器。
- `components/survey-results/results-overview.tsx`：统计概览。
- `components/survey-results/trend-chart.tsx`：回收趋势折线图。
- `components/survey-results/raw-data-table.tsx`：原始数据表。
- `components/ui/*`：由 shadcn/ui CLI 生成的基础组件。

### 测试

- `tests/app/home-page.test.tsx`
- `tests/lib/surveys/validators.test.ts`
- `tests/lib/auth/session.test.ts`
- `tests/lib/surveys/service.test.ts`
- `tests/lib/surveys/editor-state.test.ts`
- `tests/lib/surveys/response-service.test.ts`
- `tests/components/survey-fill-form.test.tsx`
- `tests/lib/analytics/service.test.ts`
- `tests/lib/security/rate-limit.test.ts`
- `tests/e2e/admin-crud.spec.ts`
- `tests/e2e/fill-survey.spec.ts`

## 实施任务

### Task 1: 初始化工程骨架与质量门禁

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `.env.example`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Test: `tests/app/home-page.test.tsx`
- Modify: `README.md`

- [ ] **Step 1: 用官方脚手架生成基础工程，并安装后续会用到的核心依赖**

Run:
```bash
pnpm create next-app@latest .bootstrap --yes
rsync -a .bootstrap/ ./ --exclude .git --exclude README.md
rm -rf .bootstrap
pnpm add drizzle-orm better-sqlite3 zod iron-session bcryptjs recharts sanitize-html csv-stringify
pnpm add -D drizzle-kit vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test @types/better-sqlite3
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button card input textarea label switch select table badge dialog alert-dialog dropdown-menu separator sonner
```

Expected:
- 生成 `app/`、`public/`、`package.json`、`next.config.ts` 等基础文件。
- 安装完成后 `pnpm-lock.yaml` 出现，`components/ui/` 下生成基础 UI 组件。

- [ ] **Step 2: 写首页冒烟测试，先让它失败**

```tsx
// tests/app/home-page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the admin entry for Juanbing", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Juanbing 问卷平台" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "进入管理台" })).toHaveAttribute(
      "href",
      "/surveys",
    );
  });
});
```

- [ ] **Step 3: 运行测试，确认首页尚未满足预期**

Run:
```bash
pnpm vitest run tests/app/home-page.test.tsx
```

Expected: FAIL，提示找不到目标标题或链接文本。

- [ ] **Step 4: 实现项目壳层、脚本与首页**

```json
// package.json（仅展示关键 scripts，依赖由 Step 1 安装命令补齐）
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate --name=init",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

```tsx
// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

import { ToasterProvider } from "@/components/providers/toaster-provider";

export const metadata: Metadata = {
  title: "Juanbing 问卷平台",
  description: "自用的中文问卷调查与数据收集平台",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Juanbing 问卷平台</h1>
        <p className="text-base text-slate-600">
          单管理员维护、自助发布链接、轻量收集数据的中文问卷系统。
        </p>
      </div>
      <Button asChild>
        <Link href="/surveys">进入管理台</Link>
      </Button>
    </main>
  );
}
```

```ts
// vitest.config.ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
```

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

```tsx
// components/providers/toaster-provider.tsx
"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return <Toaster position="top-right" richColors />;
}
```

- [ ] **Step 5: 重新运行首页测试与 lint，确认基础壳层可用**

Run:
```bash
pnpm vitest run tests/app/home-page.test.tsx
pnpm lint
```

Expected:
- `tests/app/home-page.test.tsx` PASS
- ESLint 通过，无未使用变量和导入错误

- [ ] **Step 6: 提交基础骨架**

```bash
git add .
git commit -m "chore: scaffold juanbing app shell"
```

### Task 2: 建立环境变量、数据库模型与输入校验基础

**Files:**
- Create: `drizzle.config.ts`
- Create: `lib/config/env.ts`
- Create: `lib/db/client.ts`
- Create: `lib/db/schema.ts`
- Create: `lib/surveys/types.ts`
- Create: `lib/surveys/question-defaults.ts`
- Create: `lib/surveys/validators.ts`
- Test: `tests/lib/surveys/validators.test.ts`

- [ ] **Step 1: 为问卷输入和回答输入写失败测试**

```ts
// tests/lib/surveys/validators.test.ts
import { describe, expect, it } from "vitest";

import {
  submitResponsePayloadSchema,
  surveyInputSchema,
  validateAnswersAgainstSurvey,
} from "@/lib/surveys/validators";
import type { SurveyDetail } from "@/lib/surveys/types";

describe("survey validators", () => {
  it("accepts a valid survey draft", () => {
    const result = surveyInputSchema.safeParse({
      title: "活动报名",
      description: "周末活动",
      questions: [
        {
          type: "single_choice",
          title: "是否参加",
          required: true,
          orderIndex: 0,
          options: [
            { label: "参加", value: "yes", orderIndex: 0 },
            { label: "不参加", value: "no", orderIndex: 1 },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects rating question without maxRating", () => {
    const result = surveyInputSchema.safeParse({
      title: "NPS",
      questions: [
        {
          type: "rating",
          title: "请打分",
          required: true,
          orderIndex: 0,
          config: {},
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects response payload without respondent_id", () => {
    const result = submitResponsePayloadSchema.safeParse({
      answers: { question_1: "yes" },
    });

    expect(result.success).toBe(false);
  });

  it("flags required answers that are missing", () => {
    const survey = {
      id: 1,
      title: "活动报名",
      description: null,
      status: "published",
      expiresAt: null,
      createdAt: 0,
      updatedAt: 0,
      questions: [
        {
          id: 11,
          type: "text",
          title: "你的姓名",
          required: true,
          orderIndex: 0,
          config: null,
          options: [],
        },
      ],
    } satisfies SurveyDetail;

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_11: "" }),
    ).toThrow(/你的姓名/);
  });
});
```

- [ ] **Step 2: 运行校验测试，确认当前实现不存在**

Run:
```bash
pnpm vitest run tests/lib/surveys/validators.test.ts
```

Expected: FAIL，提示 `@/lib/surveys/validators` 或对应导出不存在。

- [ ] **Step 3: 实现环境变量、Drizzle schema 与输入校验**

```ts
// lib/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default("data/juanbing.sqlite"),
  SESSION_SECRET: z.string().min(32),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD_HASH: z.string().min(20),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ?? "data/juanbing.sqlite",
  SESSION_SECRET: process.env.SESSION_SECRET,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
});
```

```ts
// lib/db/schema.ts
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const surveys = sqliteTable("surveys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "published", "closed"] })
    .notNull()
    .default("draft"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  expiresAt: integer("expires_at"),
});

export const surveyQuestions = sqliteTable("survey_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  surveyId: integer("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["single_choice", "multiple_choice", "text", "rating", "dropdown", "date", "matrix"],
  }).notNull(),
  title: text("title").notNull(),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  orderIndex: integer("order_index").notNull(),
  config: text("config"),
});

export const surveyOptions = sqliteTable("survey_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id").notNull().references(() => surveyQuestions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  value: text("value").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const surveyResponses = sqliteTable("survey_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  surveyId: integer("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  answers: text("answers").notNull(),
  respondentId: text("respondent_id").notNull(),
  durationSeconds: integer("duration_seconds"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});
```

```ts
// lib/surveys/types.ts
export type SurveyStatus = "draft" | "published" | "closed";
export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "text"
  | "rating"
  | "dropdown"
  | "date"
  | "matrix";

export type SurveyOptionInput = {
  label: string;
  value: string;
  orderIndex: number;
};

export type SurveyQuestionInput = {
  id?: number;
  type: QuestionType;
  title: string;
  required: boolean;
  orderIndex: number;
  config?: Record<string, unknown> | null;
  options?: SurveyOptionInput[];
};

export type SurveyInput = {
  title: string;
  description?: string | null;
  expiresAt?: number | null;
  questions: SurveyQuestionInput[];
};

export type SurveyQuestionDetail = SurveyQuestionInput & {
  id: number;
  options: SurveyOptionInput[];
};

export type SurveyDetail = {
  id: number;
  title: string;
  description: string | null;
  status: SurveyStatus;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
  questions: SurveyQuestionDetail[];
};
```

```ts
// lib/surveys/question-defaults.ts
import type { QuestionType, SurveyQuestionInput } from "@/lib/surveys/types";

export function createDefaultQuestion(type: QuestionType, orderIndex: number): SurveyQuestionInput {
  if (type === "single_choice" || type === "multiple_choice") {
    return {
      type,
      title: "请输入题目",
      required: false,
      orderIndex,
      config: null,
      options: [
        { label: "选项 1", value: "option_1", orderIndex: 0 },
        { label: "选项 2", value: "option_2", orderIndex: 1 },
      ],
    };
  }

  if (type === "rating") {
    return {
      type,
      title: "请为以下内容打分",
      required: false,
      orderIndex,
      config: { maxRating: 5 },
      options: [],
    };
  }

  return {
    type,
    title: "请输入题目",
    required: false,
    orderIndex,
    config: null,
    options: [],
  };
}
```

```ts
// lib/surveys/validators.ts
import { z } from "zod";

import type { SurveyDetail } from "@/lib/surveys/types";

const optionSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  orderIndex: z.number().int().min(0),
});

const baseQuestionSchema = z.object({
  title: z.string().trim().min(1),
  required: z.boolean(),
  orderIndex: z.number().int().min(0),
});

const singleChoiceSchema = baseQuestionSchema.extend({
  type: z.enum(["single_choice", "multiple_choice"]),
  options: z.array(optionSchema).min(2),
  config: z.null().optional(),
});

const textSchema = baseQuestionSchema.extend({
  type: z.enum(["text"]),
  config: z.null().optional(),
  options: z.array(optionSchema).optional().default([]),
});

const ratingSchema = baseQuestionSchema.extend({
  type: z.enum(["rating"]),
  options: z.array(optionSchema).optional().default([]),
  config: z.object({
    maxRating: z.number().int().min(3).max(10),
  }),
});

export const surveyInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  expiresAt: z.number().int().nullable().optional(),
  questions: z.array(z.union([singleChoiceSchema, textSchema, ratingSchema])).min(1),
});

export const submitResponsePayloadSchema = z.object({
  answers: z.record(z.union([z.string(), z.array(z.string()), z.number(), z.null()])),
  respondent_id: z.string().trim().min(1),
  duration_seconds: z.number().int().min(0).optional(),
});

export function validateAnswersAgainstSurvey(
  survey: SurveyDetail,
  answers: Record<string, string | string[] | number | null>,
) {
  for (const question of survey.questions) {
    const key = `question_${question.id}`;
    const value = answers[key];

    if (question.required) {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        throw new Error(`必填题未作答：${question.title}`);
      }
    }

    if (question.type === "rating" && typeof value === "number") {
      const maxRating = Number((question.config as { maxRating?: number } | null)?.maxRating ?? 5);
      if (value < 1 || value > maxRating) {
        throw new Error(`评分题超出范围：${question.title}`);
      }
    }
  }
}
```

```ts
// lib/db/client.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { env } from "@/lib/config/env";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

const sqlite = globalForDb.sqlite ?? new Database(env.DATABASE_URL);
export const db = globalForDb.db ?? drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
  globalForDb.db = db;
}
```

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "data/juanbing.sqlite",
  },
});
```

```env
# .env.example
DATABASE_URL=data/juanbing.sqlite
SESSION_SECRET=replace-with-at-least-32-characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=replace-with-bcrypt-hash
```

- [ ] **Step 4: 运行校验测试，并生成初始 migration**

Run:
```bash
pnpm vitest run tests/lib/surveys/validators.test.ts
pnpm db:generate
pnpm db:migrate
```

Expected:
- `tests/lib/surveys/validators.test.ts` PASS
- `drizzle/<timestamp>_init/migration.sql` 与 `snapshot.json` 生成
- 本地 SQLite 文件 `data/juanbing.sqlite` 可被创建

- [ ] **Step 5: 提交数据建模与校验基础**

```bash
git add .
git commit -m "feat: add survey schema and validators"
```

### Task 3: 建立单管理员会话认证

**Files:**
- Create: `lib/auth/session.ts`
- Create: `lib/http/api-error.ts`
- Create: `lib/http/responses.ts`
- Create: `app/login/page.tsx`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Test: `tests/lib/auth/session.test.ts`

- [ ] **Step 1: 先写认证流程失败测试**

```ts
// tests/lib/auth/session.test.ts
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: ":memory:",
    SESSION_SECRET: "12345678901234567890123456789012",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD_HASH: bcrypt.hashSync("secret123", 10),
  },
}));

describe("admin auth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accepts valid credentials", async () => {
    const { verifyAdminCredentials } = await import("@/lib/auth/session");
    await expect(verifyAdminCredentials("admin", "secret123")).resolves.toBe(true);
  });

  it("rejects invalid credentials", async () => {
    const { verifyAdminCredentials } = await import("@/lib/auth/session");
    await expect(verifyAdminCredentials("admin", "wrong-pass")).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: 运行认证测试，确认 helper 尚未实现**

Run:
```bash
pnpm vitest run tests/lib/auth/session.test.ts
```

Expected: FAIL，提示 `verifyAdminCredentials` 不存在。

- [ ] **Step 3: 实现会话 helper、统一 API 错误与登录接口**

```ts
// lib/http/api-error.ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

```ts
// lib/http/responses.ts
import { NextResponse } from "next/server";

import { ApiError } from "@/lib/http/api-error";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fromError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
}
```

```ts
// lib/auth/session.ts
import bcrypt from "bcryptjs";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import { env } from "@/lib/config/env";
import { ApiError } from "@/lib/http/api-error";

export type AdminSession = {
  isAuthenticated?: boolean;
  username?: string;
};

const sessionOptions: SessionOptions = {
  cookieName: "juanbing_admin_session",
  password: env.SESSION_SECRET,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), sessionOptions);
}

export async function verifyAdminCredentials(username: string, password: string) {
  if (username !== env.ADMIN_USERNAME) {
    return false;
  }

  return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    throw new ApiError(401, "请先登录管理端");
  }
  return session;
}
```

```ts
// app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";

import { getAdminSession, verifyAdminCredentials } from "@/lib/auth/session";
import { ApiError } from "@/lib/http/api-error";
import { fromError, ok } from "@/lib/http/responses";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = loginSchema.parse(await request.json());
    const valid = await verifyAdminCredentials(payload.username, payload.password);

    if (!valid) {
      throw new ApiError(401, "用户名或密码错误");
    }

    const session = await getAdminSession();
    session.isAuthenticated = true;
    session.username = payload.username;
    await session.save();

    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
```

```ts
// app/api/auth/logout/route.ts
import { fromError, ok } from "@/lib/http/responses";
import { getAdminSession } from "@/lib/auth/session";

export async function POST() {
  try {
    const session = await getAdminSession();
    session.destroy();
    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
```

```tsx
// app/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setPending(false);

    if (!response.ok) {
      toast.error("登录失败，请检查账号密码");
      return;
    }

    toast.success("登录成功");
    router.replace("/surveys");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <Button className="w-full" disabled={pending} type="submit">
              {pending ? "登录中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 4: 运行认证测试，验证合法/非法分支**

Run:
```bash
pnpm vitest run tests/lib/auth/session.test.ts
```

Expected: PASS，两个测试均通过。

- [ ] **Step 5: 提交会话认证能力**

```bash
git add .
git commit -m "feat: add admin session auth"
```

### Task 4: 交付问卷列表页与 CRUD 服务

**Files:**
- Create: `lib/surveys/repository.ts`
- Create: `lib/surveys/service.ts`
- Create: `components/layout/admin-shell.tsx`
- Create: `components/surveys/survey-list.tsx`
- Create: `app/surveys/page.tsx`
- Create: `app/api/surveys/route.ts`
- Create: `app/api/surveys/[id]/route.ts`
- Test: `tests/lib/surveys/service.test.ts`

- [ ] **Step 1: 用 service 级失败测试定义 CRUD 行为**

```ts
// tests/lib/surveys/service.test.ts
import { beforeEach, describe, expect, it } from "vitest";

import {
  createSurvey,
  deleteSurvey,
  getSurveyById,
  listSurveys,
  updateSurvey,
} from "@/lib/surveys/service";

beforeEach(() => {
  // 测试环境下应在 setup 中清空 sqlite 文件或使用临时数据库
});

describe("survey service", () => {
  it("creates and lists surveys", async () => {
    const created = await createSurvey({
      title: "员工满意度",
      description: "季度回访",
      questions: [
        {
          type: "text",
          title: "你的建议",
          required: true,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });

    const list = await listSurveys();

    expect(created.id).toBeGreaterThan(0);
    expect(list[0]?.title).toBe("员工满意度");
  });

  it("updates a survey and keeps question order", async () => {
    const created = await createSurvey({
      title: "原始标题",
      questions: [
        {
          type: "text",
          title: "Q1",
          required: true,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });

    await updateSurvey(created.id, {
      title: "更新后标题",
      questions: [
        {
          type: "rating",
          title: "打分",
          required: true,
          orderIndex: 0,
          options: [],
          config: { maxRating: 5 },
        },
      ],
    });

    const detail = await getSurveyById(created.id);
    expect(detail?.title).toBe("更新后标题");
    expect(detail?.questions[0]?.type).toBe("rating");
  });

  it("deletes a survey cascade", async () => {
    const created = await createSurvey({
      title: "待删除",
      questions: [
        {
          type: "text",
          title: "Q1",
          required: false,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });

    await deleteSurvey(created.id);

    await expect(getSurveyById(created.id)).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: 运行 service 测试，确认 CRUD 逻辑尚未存在**

Run:
```bash
pnpm vitest run tests/lib/surveys/service.test.ts
```

Expected: FAIL，提示 service 导出不存在。

- [ ] **Step 3: 实现 repository/service、列表页和 CRUD 路由**

```ts
// lib/surveys/repository.ts
import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { surveyOptions, surveyQuestions, surveyResponses, surveys } from "@/lib/db/schema";
import type { SurveyDetail, SurveyInput } from "@/lib/surveys/types";

function parseConfig(raw: string | null) {
  return raw ? JSON.parse(raw) : null;
}

export async function insertSurvey(input: SurveyInput) {
  const now = Math.floor(Date.now() / 1000);
  const [survey] = db
    .insert(surveys)
    .values({
      title: input.title,
      description: input.description ?? null,
      status: "draft",
      expiresAt: input.expiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  for (const question of input.questions) {
    const [questionRow] = db
      .insert(surveyQuestions)
      .values({
        surveyId: survey.id,
        type: question.type,
        title: question.title,
        required: question.required,
        orderIndex: question.orderIndex,
        config: question.config ? JSON.stringify(question.config) : null,
      })
      .returning();

    for (const option of question.options ?? []) {
      db.insert(surveyOptions).values({
        questionId: questionRow.id,
        label: option.label,
        value: option.value,
        orderIndex: option.orderIndex,
      }).run();
    }
  }

  return survey.id;
}

export async function replaceSurvey(id: number, input: SurveyInput) {
  const now = Math.floor(Date.now() / 1000);
  db.update(surveys)
    .set({
      title: input.title,
      description: input.description ?? null,
      expiresAt: input.expiresAt ?? null,
      updatedAt: now,
    })
    .where(eq(surveys.id, id))
    .run();

  db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, id)).run();

  for (const question of input.questions) {
    const [questionRow] = db.insert(surveyQuestions).values({
      surveyId: id,
      type: question.type,
      title: question.title,
      required: question.required,
      orderIndex: question.orderIndex,
      config: question.config ? JSON.stringify(question.config) : null,
    }).returning();

    for (const option of question.options ?? []) {
      db.insert(surveyOptions).values({
        questionId: questionRow.id,
        label: option.label,
        value: option.value,
        orderIndex: option.orderIndex,
      }).run();
    }
  }
}

export async function findSurveyById(id: number): Promise<SurveyDetail | null> {
  const survey = db.query.surveys.findFirst({ where: eq(surveys.id, id) });
  if (!survey) return null;

  const questions = db
    .select()
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, id))
    .orderBy(asc(surveyQuestions.orderIndex))
    .all();

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    status: survey.status,
    expiresAt: survey.expiresAt,
    createdAt: survey.createdAt,
    updatedAt: survey.updatedAt,
    questions: questions.map((question) => ({
      id: question.id,
      type: question.type,
      title: question.title,
      required: question.required,
      orderIndex: question.orderIndex,
      config: parseConfig(question.config),
      options: db
        .select()
        .from(surveyOptions)
        .where(eq(surveyOptions.questionId, question.id))
        .orderBy(asc(surveyOptions.orderIndex))
        .all(),
    })),
  };
}

export async function listSurveySummaries() {
  return db.select().from(surveys).orderBy(asc(surveys.createdAt)).all();
}

export async function removeSurvey(id: number) {
  db.delete(surveyResponses).where(eq(surveyResponses.surveyId, id)).run();
  db.delete(surveys).where(eq(surveys.id, id)).run();
}
```

```ts
// lib/surveys/service.ts
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { surveys } from "@/lib/db/schema";
import { ApiError } from "@/lib/http/api-error";
import {
  findSurveyById,
  insertSurvey,
  listSurveySummaries,
  removeSurvey,
  replaceSurvey,
} from "@/lib/surveys/repository";
import type { SurveyInput } from "@/lib/surveys/types";
import { surveyInputSchema } from "@/lib/surveys/validators";

export async function createSurvey(input: SurveyInput) {
  const parsed = surveyInputSchema.parse(input);
  const id = await insertSurvey(parsed);
  return (await findSurveyById(id))!;
}

export async function updateSurvey(id: number, input: SurveyInput) {
  const parsed = surveyInputSchema.parse(input);
  const existing = await findSurveyById(id);
  if (!existing) {
    throw new ApiError(404, "问卷不存在");
  }

  await replaceSurvey(id, parsed);
  return (await findSurveyById(id))!;
}

export async function getSurveyById(id: number) {
  return findSurveyById(id);
}

export async function listSurveys() {
  return listSurveySummaries();
}

export async function deleteSurvey(id: number) {
  const existing = await findSurveyById(id);
  if (!existing) {
    throw new ApiError(404, "问卷不存在");
  }
  await removeSurvey(id);
}

export async function setSurveyStatus(id: number, status: "draft" | "published" | "closed") {
  db.update(surveys).set({ status, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(surveys.id, id)).run();
  return (await findSurveyById(id))!;
}
```

```tsx
// components/layout/admin-shell.tsx
import Link from "next/link";

export function AdminShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <Link className="text-sm text-slate-500" href="/">
            Juanbing
          </Link>
          <h1 className="text-3xl font-semibold">{title}</h1>
        </div>
        {actions}
      </header>
      {children}
    </main>
  );
}
```

```tsx
// components/surveys/survey-list.tsx
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SurveyList({
  surveys,
}: {
  surveys: Array<{ id: number; title: string; status: string; createdAt: number }>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>标题</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {surveys.map((survey) => (
          <TableRow key={survey.id}>
            <TableCell>{survey.title}</TableCell>
            <TableCell><Badge variant="secondary">{survey.status}</Badge></TableCell>
            <TableCell>{new Date(survey.createdAt * 1000).toLocaleString("zh-CN")}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/surveys/${survey.id}`}>编辑</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/surveys/${survey.id}/results`}>结果</Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

```tsx
// app/surveys/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth/session";
import { listSurveys } from "@/lib/surveys/service";
import { AdminShell } from "@/components/layout/admin-shell";
import { SurveyList } from "@/components/surveys/survey-list";
import { Button } from "@/components/ui/button";

export default async function SurveysPage() {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const surveys = await listSurveys();

  return (
    <AdminShell
      title="问卷列表"
      actions={
        <Button asChild>
          <Link href="/surveys/new">新建问卷</Link>
        </Button>
      }
    >
      <SurveyList surveys={surveys} />
    </AdminShell>
  );
}
```

```ts
// app/api/surveys/route.ts
import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError, ok } from "@/lib/http/responses";
import { createSurvey, listSurveys } from "@/lib/surveys/service";

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await listSurveys());
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    return created(await createSurvey(await request.json()));
  } catch (error) {
    return fromError(error);
  }
}
```

```ts
// app/api/surveys/[id]/route.ts
import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import { deleteSurvey, getSurveyById, updateSurvey } from "@/lib/surveys/service";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return ok(await getSurveyById(Number(id)));
  } catch (error) {
    return fromError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return ok(await updateSurvey(Number(id), await request.json()));
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await deleteSurvey(Number(id));
    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
```

- [ ] **Step 4: 跑通 CRUD 单测与列表页 lint**

Run:
```bash
pnpm vitest run tests/lib/surveys/service.test.ts
pnpm lint
```

Expected:
- `tests/lib/surveys/service.test.ts` PASS
- `app/surveys/page.tsx` 与 CRUD route handlers 无 lint 报错

- [ ] **Step 5: 提交问卷 CRUD 基础能力**

```bash
git add .
git commit -m "feat: add survey crud and admin list"
```

### Task 5: 交付 MVP 问卷编辑器

**Files:**
- Create: `lib/surveys/editor-state.ts`
- Create: `components/survey-editor/editor-shell.tsx`
- Create: `components/survey-editor/component-palette.tsx`
- Create: `components/survey-editor/question-list.tsx`
- Create: `components/survey-editor/question-card.tsx`
- Create: `components/survey-editor/property-panel.tsx`
- Create: `app/surveys/new/page.tsx`
- Create: `app/surveys/[id]/page.tsx`
- Test: `tests/lib/surveys/editor-state.test.ts`

- [ ] **Step 1: 先为编辑器 reducer 写失败测试**

```ts
// tests/lib/surveys/editor-state.test.ts
import { describe, expect, it } from "vitest";

import { createInitialEditorState, editorReducer } from "@/lib/surveys/editor-state";

describe("editor reducer", () => {
  it("adds a single choice question with default options", () => {
    const next = editorReducer(createInitialEditorState(), {
      type: "addQuestion",
      questionType: "single_choice",
    });

    expect(next.questions).toHaveLength(1);
    expect(next.questions[0]?.options).toHaveLength(2);
  });

  it("moves a selected question upward", () => {
    const initial = {
      ...createInitialEditorState(),
      questions: [
        { clientId: "a", type: "text", title: "Q1", required: false, orderIndex: 0, config: null, options: [] },
        { clientId: "b", type: "text", title: "Q2", required: false, orderIndex: 1, config: null, options: [] },
      ],
      selectedQuestionId: "b",
    };

    const next = editorReducer(initial, { type: "moveQuestionUp", clientId: "b" });
    expect(next.questions[0]?.clientId).toBe("b");
  });
});
```

- [ ] **Step 2: 运行 reducer 测试，确认状态机尚未实现**

Run:
```bash
pnpm vitest run tests/lib/surveys/editor-state.test.ts
```

Expected: FAIL，提示 `editor-state` 模块不存在。

- [ ] **Step 3: 实现编辑器状态、三栏组件与新建/编辑页面**

```ts
// lib/surveys/editor-state.ts
import { createDefaultQuestion } from "@/lib/surveys/question-defaults";
import type { QuestionType, SurveyInput } from "@/lib/surveys/types";

type EditorQuestion = SurveyInput["questions"][number] & { clientId: string };

export type EditorState = {
  title: string;
  description: string;
  questions: EditorQuestion[];
  selectedQuestionId: string | null;
};

export type EditorAction =
  | { type: "setTitle"; value: string }
  | { type: "setDescription"; value: string }
  | { type: "addQuestion"; questionType: QuestionType }
  | { type: "selectQuestion"; clientId: string }
  | { type: "moveQuestionUp"; clientId: string }
  | { type: "updateQuestion"; clientId: string; patch: Partial<EditorQuestion> };

export function createInitialEditorState(): EditorState {
  return {
    title: "未命名问卷",
    description: "",
    questions: [],
    selectedQuestionId: null,
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === "addQuestion") {
    const clientId = crypto.randomUUID();
    const question = createDefaultQuestion(action.questionType, state.questions.length);
    return {
      ...state,
      questions: [...state.questions, { ...question, clientId }],
      selectedQuestionId: clientId,
    };
  }

  if (action.type === "moveQuestionUp") {
    const index = state.questions.findIndex((item) => item.clientId === action.clientId);
    if (index <= 0) return state;
    const next = [...state.questions];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    return {
      ...state,
      questions: next.map((item, orderIndex) => ({ ...item, orderIndex })),
    };
  }

  if (action.type === "updateQuestion") {
    return {
      ...state,
      questions: state.questions.map((question) =>
        question.clientId === action.clientId ? { ...question, ...action.patch } : question,
      ),
    };
  }

  if (action.type === "setTitle") return { ...state, title: action.value };
  if (action.type === "setDescription") return { ...state, description: action.value };
  if (action.type === "selectQuestion") return { ...state, selectedQuestionId: action.clientId };
  return state;
}
```

```tsx
// components/survey-editor/component-palette.tsx
"use client";

import { Button } from "@/components/ui/button";
import type { QuestionType } from "@/lib/surveys/types";

const MVP_TYPES: Array<{ type: QuestionType; label: string }> = [
  { type: "single_choice", label: "单选题" },
  { type: "multiple_choice", label: "多选题" },
  { type: "text", label: "填空题" },
  { type: "rating", label: "评分题" },
];

export function ComponentPalette({ onAdd }: { onAdd: (type: QuestionType) => void }) {
  return (
    <aside className="space-y-3 rounded-xl border bg-white p-4">
      <h2 className="font-medium">题型组件</h2>
      <div className="grid gap-2">
        {MVP_TYPES.map((item) => (
          <Button key={item.type} type="button" variant="outline" onClick={() => onAdd(item.type)}>
            {item.label}
          </Button>
        ))}
      </div>
    </aside>
  );
}
```

```tsx
// components/survey-editor/editor-shell.tsx
"use client";

import { useMemo, useReducer, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComponentPalette } from "@/components/survey-editor/component-palette";
import { PropertyPanel } from "@/components/survey-editor/property-panel";
import { QuestionList } from "@/components/survey-editor/question-list";
import { createInitialEditorState, editorReducer } from "@/lib/surveys/editor-state";
import type { SurveyDetail } from "@/lib/surveys/types";

export function EditorShell({ survey }: { survey?: SurveyDetail | null }) {
  const [pending, setPending] = useState(false);
  const [state, dispatch] = useReducer(
    editorReducer,
    survey,
    (initialSurvey) =>
      initialSurvey
        ? {
            title: initialSurvey.title,
            description: initialSurvey.description ?? "",
            selectedQuestionId: initialSurvey.questions[0]?.id ? String(initialSurvey.questions[0].id) : null,
            questions: initialSurvey.questions.map((question) => ({
              ...question,
              clientId: String(question.id),
            })),
          }
        : createInitialEditorState(),
  );

  const selectedQuestion = useMemo(
    () => state.questions.find((item) => item.clientId === state.selectedQuestionId) ?? null,
    [state.questions, state.selectedQuestionId],
  );

  async function handleSave() {
    setPending(true);
    const payload = {
      title: state.title,
      description: state.description,
      questions: state.questions.map(({ clientId, ...question }) => question),
    };

    const response = await fetch(survey ? `/api/surveys/${survey.id}` : "/api/surveys", {
      method: survey ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setPending(false);

    if (!response.ok) {
      toast.error("保存失败");
      return;
    }

    toast.success("问卷已保存");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      <ComponentPalette onAdd={(type) => dispatch({ type: "addQuestion", questionType: type })} />
      <section className="space-y-4 rounded-xl border bg-white p-4">
        <Input value={state.title} onChange={(event) => dispatch({ type: "setTitle", value: event.target.value })} />
        <Textarea value={state.description} onChange={(event) => dispatch({ type: "setDescription", value: event.target.value })} />
        <QuestionList
          questions={state.questions}
          selectedQuestionId={state.selectedQuestionId}
          onMoveUp={(clientId) => dispatch({ type: "moveQuestionUp", clientId })}
          onSelect={(clientId) => dispatch({ type: "selectQuestion", clientId })}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleSave} disabled={pending}>
            {pending ? "保存中..." : "保存"}
          </Button>
          {survey ? (
            <Button type="button" onClick={() => window.open(`/surveys/${survey.id}/fill?preview=1`, "_blank")}>预览</Button>
          ) : null}
        </div>
      </section>
      <PropertyPanel question={selectedQuestion} onChange={(patch) => selectedQuestion && dispatch({ type: "updateQuestion", clientId: selectedQuestion.clientId, patch })} />
    </div>
  );
}
```

```tsx
// app/surveys/new/page.tsx
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { EditorShell } from "@/components/survey-editor/editor-shell";
import { requireAdminSession } from "@/lib/auth/session";

export default async function NewSurveyPage() {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  return (
    <AdminShell title="新建问卷">
      <EditorShell />
    </AdminShell>
  );
}
```

```tsx
// app/surveys/[id]/page.tsx
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { EditorShell } from "@/components/survey-editor/editor-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { getSurveyById } from "@/lib/surveys/service";

export default async function SurveyEditorPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const survey = await getSurveyById(Number(id));
  if (!survey) notFound();

  return (
    <AdminShell title={`编辑问卷：${survey.title}`}>
      <EditorShell survey={survey} />
    </AdminShell>
  );
}
```

- [ ] **Step 4: 运行 reducer 测试与编辑器相关 lint**

Run:
```bash
pnpm vitest run tests/lib/surveys/editor-state.test.ts
pnpm lint
```

Expected:
- `tests/lib/surveys/editor-state.test.ts` PASS
- 编辑器组件无类型/导入错误

- [ ] **Step 5: 提交 MVP 编辑器**

```bash
git add .
git commit -m "feat: add survey editor mvp"
```

### Task 6: 交付发布能力、公开读取接口与回答提交主流程

**Files:**
- Create: `lib/security/sanitize.ts`
- Create: `lib/surveys/response-service.ts`
- Create: `app/api/surveys/[id]/public/route.ts`
- Create: `app/api/surveys/[id]/publish/route.ts`
- Create: `app/api/surveys/[id]/responses/route.ts`
- Test: `tests/lib/surveys/response-service.test.ts`
- Modify: `lib/surveys/service.ts`

- [ ] **Step 1: 先写回答提交流程失败测试**

```ts
// tests/lib/surveys/response-service.test.ts
import { describe, expect, it } from "vitest";

import { createSurvey, setSurveyStatus } from "@/lib/surveys/service";
import { submitSurveyResponse } from "@/lib/surveys/response-service";

describe("submitSurveyResponse", () => {
  it("accepts preview submission without writing duplicate records", async () => {
    const survey = await createSurvey({
      title: "客户回访",
      questions: [
        {
          type: "text",
          title: "你的名字",
          required: true,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });
    const questionKey = `question_${survey.questions[0]!.id}`;

    const result = await submitSurveyResponse({
      surveyId: survey.id,
      payload: {
        answers: { [questionKey]: "Alice" },
        respondent_id: "preview-user",
        duration_seconds: 12,
      },
      preview: true,
      isAdminPreview: true,
    });

    expect(result.preview).toBe(true);
  });

  it("rejects duplicate respondent_id on published surveys", async () => {
    const survey = await createSurvey({
      title: "活动报名",
      questions: [
        {
          type: "text",
          title: "姓名",
          required: true,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });
    const questionKey = `question_${survey.questions[0]!.id}`;

    await setSurveyStatus(survey.id, "published");

    await submitSurveyResponse({
      surveyId: survey.id,
      payload: {
        answers: { [questionKey]: "Alice" },
        respondent_id: "same-device",
      },
      preview: false,
      isAdminPreview: false,
    });

    await expect(
      submitSurveyResponse({
        surveyId: survey.id,
        payload: {
          answers: { [questionKey]: "Bob" },
          respondent_id: "same-device",
        },
        preview: false,
        isAdminPreview: false,
      }),
    ).rejects.toThrow(/重复提交/);
  });
});
```

- [ ] **Step 2: 运行回答测试，确认提交服务尚未实现**

Run:
```bash
pnpm vitest run tests/lib/surveys/response-service.test.ts
```

Expected: FAIL，提示 `submitSurveyResponse` 不存在。

- [ ] **Step 3: 实现发布、公开读取、预览提交与正式提交逻辑**

```ts
// lib/security/sanitize.ts
import sanitizeHtml from "sanitize-html";

export function sanitizePlainText(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}
```

```ts
// lib/surveys/response-service.ts
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { surveyResponses, surveys } from "@/lib/db/schema";
import { ApiError } from "@/lib/http/api-error";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { getSurveyById } from "@/lib/surveys/service";
import { submitResponsePayloadSchema, validateAnswersAgainstSurvey } from "@/lib/surveys/validators";

export async function submitSurveyResponse({
  surveyId,
  payload,
  preview,
  isAdminPreview,
}: {
  surveyId: number;
  payload: unknown;
  preview: boolean;
  isAdminPreview: boolean;
}) {
  const parsed = submitResponsePayloadSchema.parse(payload);
  const survey = await getSurveyById(surveyId);

  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }

  if (preview) {
    if (!isAdminPreview) {
      throw new ApiError(401, "预览提交仅管理员可用");
    }
  } else if (survey.status !== "published") {
    throw new ApiError(409, "问卷尚未发布");
  }

  validateAnswersAgainstSurvey(survey, parsed.answers);

  const sanitizedAnswers = Object.fromEntries(
    Object.entries(parsed.answers).map(([key, value]) => [
      key,
      typeof value === "string" ? sanitizePlainText(value) : value,
    ]),
  );

  if (!preview) {
    const duplicate = db.query.surveyResponses.findFirst({
      where: and(
        eq(surveyResponses.surveyId, surveyId),
        eq(surveyResponses.respondentId, parsed.respondent_id),
      ),
    });

    if (duplicate) {
      throw new ApiError(409, "请勿重复提交问卷");
    }

    db.insert(surveyResponses)
      .values({
        surveyId,
        answers: JSON.stringify(sanitizedAnswers),
        respondentId: parsed.respondent_id,
        durationSeconds: parsed.duration_seconds ?? null,
      })
      .run();
  }

  return {
    preview,
    surveyId,
  };
}
```

```ts
// app/api/surveys/[id]/public/route.ts
import { fromError, ok } from "@/lib/http/responses";
import { getSurveyById } from "@/lib/surveys/service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const survey = await getSurveyById(Number(id));
    if (!survey || survey.status !== "published") {
      return Response.json({ error: "问卷不可用" }, { status: 404 });
    }

    return ok(survey);
  } catch (error) {
    return fromError(error);
  }
}
```

```ts
// app/api/surveys/[id]/publish/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import { setSurveyStatus } from "@/lib/surveys/service";

const publishSchema = z.object({
  status: z.enum(["draft", "published", "closed"]),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const payload = publishSchema.parse(await request.json());
    return ok(await setSurveyStatus(Number(id), payload.status));
  } catch (error) {
    return fromError(error);
  }
}
```

```ts
// app/api/surveys/[id]/responses/route.ts
import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import { listSurveyResponses } from "@/lib/analytics/service";
import { submitSurveyResponse } from "@/lib/surveys/response-service";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return ok(await listSurveyResponses(Number(id)));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const preview = request.nextUrl.searchParams.get("preview") === "1";
    let isAdminPreview = false;

    if (preview) {
      await requireAdminSession();
      isAdminPreview = true;
    }

    return ok(
      await submitSurveyResponse({
        surveyId: Number(id),
        payload: await request.json(),
        preview,
        isAdminPreview,
      }),
    );
  } catch (error) {
    return fromError(error);
  }
}
```

- [ ] **Step 4: 运行回答服务测试，确认预览与防重复分支都成立**

Run:
```bash
pnpm vitest run tests/lib/surveys/response-service.test.ts
```

Expected: PASS，预览提交成功、正式重复提交返回错误。

- [ ] **Step 5: 提交发布与提交主流程**

```bash
git add .
git commit -m "feat: add publish and response submission flow"
```

### Task 7: 交付公开填写页与 respondent_id 管理

**Files:**
- Create: `lib/respondent/respondent-id.ts`
- Create: `components/survey-fill/question-field.tsx`
- Create: `components/survey-fill/survey-fill-form.tsx`
- Create: `app/surveys/[id]/fill/page.tsx`
- Create: `app/surveys/[id]/fill/thank-you/page.tsx`
- Test: `tests/components/survey-fill-form.test.tsx`

- [ ] **Step 1: 先写填写表单失败测试**

```tsx
// tests/components/survey-fill-form.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SurveyFillForm } from "@/components/survey-fill/survey-fill-form";

const survey = {
  id: 1,
  title: "活动报名",
  description: "请填写信息",
  status: "published",
  expiresAt: null,
  createdAt: 0,
  updatedAt: 0,
  questions: [
    {
      id: 11,
      type: "text",
      title: "姓名",
      required: true,
      orderIndex: 0,
      config: null,
      options: [],
    },
  ],
};

describe("SurveyFillForm", () => {
  it("shows validation error when required answer is missing", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SurveyFillForm survey={survey} preview={false} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "提交问卷" }));

    expect(await screen.findByText("请完成所有必填题后再提交")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行填写表单测试，确认组件未实现**

Run:
```bash
pnpm vitest run tests/components/survey-fill-form.test.tsx
```

Expected: FAIL，提示 `SurveyFillForm` 未导出。

- [ ] **Step 3: 实现 respondent_id、题型渲染器与填写页**

```ts
// lib/respondent/respondent-id.ts
const STORAGE_KEY = "juanbing.respondent_id";

export function getRespondentId() {
  const current = window.localStorage.getItem(STORAGE_KEY);
  if (current) return current;

  const next = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}
```

```tsx
// components/survey-fill/question-field.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function QuestionField({
  question,
  value,
  onChange,
}: {
  question: {
    id: number;
    type: string;
    title: string;
    options: Array<{ label: string; value: string }>;
    config: Record<string, unknown> | null;
  };
  value: string | string[] | number | null | undefined;
  onChange: (value: string | string[] | number | null) => void;
}) {
  if (question.type === "text") {
    return <Textarea value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />;
  }

  if (question.type === "rating") {
    const maxRating = Number(question.config?.maxRating ?? 5);
    return (
      <div className="flex gap-2">
        {Array.from({ length: maxRating }, (_, index) => index + 1).map((score) => (
          <button
            key={score}
            className="rounded-md border px-3 py-2"
            type="button"
            onClick={() => onChange(score)}
          >
            {score}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "single_choice") {
    return (
      <div className="space-y-2">
        {question.options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <Input
              checked={value === option.value}
              className="h-4 w-4"
              type="radio"
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    const selectedValues = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {question.options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <Input
              checked={selectedValues.includes(option.value)}
              className="h-4 w-4"
              type="checkbox"
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((item) => item !== option.value),
                )
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return <div className="text-sm text-slate-500">当前题型待扩展</div>;
}
```

```tsx
// components/survey-fill/survey-fill-form.tsx
"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionField } from "@/components/survey-fill/question-field";
import { getRespondentId } from "@/lib/respondent/respondent-id";
import type { SurveyDetail } from "@/lib/surveys/types";

export function SurveyFillForm({
  survey,
  preview,
  onSubmit,
}: {
  survey: SurveyDetail;
  preview: boolean;
  onSubmit: (payload: {
    answers: Record<string, string | string[] | number | null>;
    respondent_id: string;
    duration_seconds: number;
  }) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | null>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useMemo(() => Date.now(), []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requiredMissing = survey.questions.some((question) => {
      if (!question.required) return false;
      const value = answers[`question_${question.id}`];
      return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    });

    if (requiredMissing) {
      setError("请完成所有必填题后再提交");
      return;
    }

    setError(null);
    setPending(true);

    await onSubmit({
      answers,
      respondent_id: preview ? `preview-${crypto.randomUUID()}` : getRespondentId(),
      duration_seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
    });

    setPending(false);
    toast.success(preview ? "预览提交成功" : "提交成功，感谢填写");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {survey.questions.map((question) => (
        <Card key={question.id} className="scroll-mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {question.title}
              {question.required ? <span className="ml-1 text-red-500">*</span> : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionField
              question={question}
              value={answers[`question_${question.id}`]}
              onChange={(value) =>
                setAnswers((current) => ({
                  ...current,
                  [`question_${question.id}`]: value,
                }))
              }
            />
          </CardContent>
        </Card>
      ))}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button disabled={pending} type="submit">
        {pending ? "提交中..." : "提交问卷"}
      </Button>
    </form>
  );
}
```

```tsx
// app/surveys/[id]/fill/page.tsx
import { notFound, redirect } from "next/navigation";

import { SurveyFillForm } from "@/components/survey-fill/survey-fill-form";
import { requireAdminSession } from "@/lib/auth/session";
import { getSurveyById } from "@/lib/surveys/service";

export default async function SurveyFillPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { id } = await params;
  const { preview } = await searchParams;

  if (preview === "1") {
    try {
      await requireAdminSession();
    } catch {
      redirect("/login");
    }
  }

  const survey = await getSurveyById(Number(id));

  if (!survey) notFound();
  if (survey.status !== "published" && preview !== "1") notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{survey.title}</h1>
        <p className="text-slate-600">{survey.description}</p>
      </header>
      <SurveyFillForm
        survey={survey}
        preview={preview === "1"}
        onSubmit={async (payload) => {
          await fetch(`/api/surveys/${survey.id}/responses${preview === "1" ? "?preview=1" : ""}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          window.location.href = `/surveys/${survey.id}/fill/thank-you${preview === "1" ? "?preview=1" : ""}`;
        }}
      />
    </main>
  );
}
```

```tsx
// app/surveys/[id]/fill/thank-you/page.tsx
export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">{preview === "1" ? "预览提交成功" : "感谢你的填写"}</h1>
        <p className="text-slate-600">
          {preview === "1" ? "这是预览模式，数据未入库。" : "你的回答已成功提交。"}
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: 运行填写表单测试，确认必填校验在前端可见**

Run:
```bash
pnpm vitest run tests/components/survey-fill-form.test.tsx
```

Expected: PASS，缺失必填题时不会调用 `onSubmit`。

- [ ] **Step 5: 提交公开填写流程**

```bash
git add .
git commit -m "feat: add public fill flow"
```

### Task 8: 交付结果看板、回答列表与 CSV 导出

**Files:**
- Create: `lib/analytics/service.ts`
- Create: `lib/export/csv.ts`
- Create: `components/survey-results/results-overview.tsx`
- Create: `components/survey-results/trend-chart.tsx`
- Create: `components/survey-results/raw-data-table.tsx`
- Create: `app/surveys/[id]/results/page.tsx`
- Create: `app/api/surveys/[id]/export/route.ts`
- Test: `tests/lib/analytics/service.test.ts`

- [ ] **Step 1: 为概览统计与 CSV 展平写失败测试**

```ts
// tests/lib/analytics/service.test.ts
import { describe, expect, it } from "vitest";

import { buildSurveyOverview, toCsvRows } from "@/lib/analytics/service";

describe("analytics service", () => {
  it("builds overview metrics from responses", () => {
    const overview = buildSurveyOverview([
      { createdAt: 1710000000, durationSeconds: 12, answers: { question_11: "A" } },
      { createdAt: 1710003600, durationSeconds: 18, answers: { question_11: "B" } },
    ]);

    expect(overview.totalResponses).toBe(2);
    expect(overview.averageDurationSeconds).toBe(15);
    expect(overview.trend.length).toBe(1);
  });

  it("flattens response rows for csv export", () => {
    const rows = toCsvRows(
      [{ id: 11, title: "姓名" }],
      [{ id: 1, createdAt: 1710000000, respondentId: "abc", answers: { question_11: "Alice" } }],
    );

    expect(rows[0]?.姓名).toBe("Alice");
    expect(rows[0]?.respondent_id).toBe("abc");
  });
});
```

- [ ] **Step 2: 运行分析测试，确认统计 helper 尚未实现**

Run:
```bash
pnpm vitest run tests/lib/analytics/service.test.ts
```

Expected: FAIL，提示 `buildSurveyOverview` / `toCsvRows` 未导出。

- [ ] **Step 3: 实现统计聚合、结果页面与 CSV 导出**

```ts
// lib/analytics/service.ts
import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { surveyResponses } from "@/lib/db/schema";

export async function listSurveyResponses(surveyId: number) {
  return db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId))
    .orderBy(asc(surveyResponses.createdAt))
    .all()
    .map((row) => ({
      id: row.id,
      respondentId: row.respondentId,
      createdAt: row.createdAt,
      durationSeconds: row.durationSeconds,
      answers: JSON.parse(row.answers) as Record<string, string | string[] | number | null>,
    }));
}

export function buildSurveyOverview(
  responses: Array<{ createdAt: number; durationSeconds: number | null; answers: Record<string, unknown> }>,
) {
  const totalResponses = responses.length;
  const averageDurationSeconds =
    totalResponses === 0
      ? 0
      : Math.round(
          responses.reduce((sum, item) => sum + Number(item.durationSeconds ?? 0), 0) / totalResponses,
        );

  const trendMap = new Map<string, number>();
  for (const response of responses) {
    const day = new Date(response.createdAt * 1000).toISOString().slice(0, 10);
    trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
  }

  return {
    totalResponses,
    averageDurationSeconds,
    trend: Array.from(trendMap.entries()).map(([date, count]) => ({ date, count })),
  };
}

export function toCsvRows(
  questions: Array<{ id: number; title: string }>,
  responses: Array<{
    id: number;
    createdAt: number;
    respondentId: string;
    answers: Record<string, string | string[] | number | null>;
  }>,
) {
  return responses.map((response) => ({
    response_id: response.id,
    respondent_id: response.respondentId,
    submitted_at: new Date(response.createdAt * 1000).toISOString(),
    ...Object.fromEntries(
      questions.map((question) => [question.title, response.answers[`question_${question.id}`] ?? ""]),
    ),
  }));
}
```

```ts
// lib/export/csv.ts
import { stringify } from "csv-stringify/sync";

export function buildCsv(rows: Array<Record<string, unknown>>) {
  return stringify(rows, { header: true });
}
```

```tsx
// components/survey-results/results-overview.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResultsOverview({
  totalResponses,
  averageDurationSeconds,
}: {
  totalResponses: number;
  averageDurationSeconds: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>回收量</CardTitle></CardHeader>
        <CardContent className="text-3xl font-semibold">{totalResponses}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>平均填写时长</CardTitle></CardHeader>
        <CardContent className="text-3xl font-semibold">{averageDurationSeconds} 秒</CardContent>
      </Card>
    </div>
  );
}
```

```tsx
// components/survey-results/trend-chart.tsx
"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <div className="h-80 rounded-xl border bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#0f172a" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

```tsx
// components/survey-results/raw-data-table.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RawDataTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  const headers = Object.keys(rows[0] ?? {});

  return (
    <div className="rounded-xl border bg-white p-4">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {headers.map((header) => (
                <TableCell key={header}>{String(row[header] ?? "")}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

```tsx
// app/surveys/[id]/results/page.tsx
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { RawDataTable } from "@/components/survey-results/raw-data-table";
import { ResultsOverview } from "@/components/survey-results/results-overview";
import { TrendChart } from "@/components/survey-results/trend-chart";
import { requireAdminSession } from "@/lib/auth/session";
import { buildSurveyOverview, listSurveyResponses, toCsvRows } from "@/lib/analytics/service";
import { getSurveyById } from "@/lib/surveys/service";

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const survey = await getSurveyById(Number(id));
  if (!survey) notFound();

  const responses = await listSurveyResponses(survey.id);
  const overview = buildSurveyOverview(responses);
  const rows = toCsvRows(survey.questions.map((question) => ({ id: question.id, title: question.title })), responses);

  return (
    <AdminShell title={`数据看板：${survey.title}`}>
      <ResultsOverview {...overview} />
      <TrendChart data={overview.trend} />
      <RawDataTable rows={rows} />
    </AdminShell>
  );
}
```

```ts
// app/api/surveys/[id]/export/route.ts
import { requireAdminSession } from "@/lib/auth/session";
import { buildCsv } from "@/lib/export/csv";
import { listSurveyResponses, toCsvRows } from "@/lib/analytics/service";
import { getSurveyById } from "@/lib/surveys/service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const survey = await getSurveyById(Number(id));
  if (!survey) {
    return new Response("问卷不存在", { status: 404 });
  }

  const responses = await listSurveyResponses(survey.id);
  const rows = toCsvRows(survey.questions.map((question) => ({ id: question.id, title: question.title })), responses);
  const csv = buildCsv(rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="survey-${survey.id}.csv"`,
    },
  });
}
```

- [ ] **Step 4: 运行统计测试并手动校验导出接口**

Run:
```bash
pnpm vitest run tests/lib/analytics/service.test.ts
pnpm lint
```

Expected:
- `tests/lib/analytics/service.test.ts` PASS
- `app/surveys/[id]/results/page.tsx` 与导出接口通过 lint

- [ ] **Step 5: 提交结果看板与 CSV 导出**

```bash
git add .
git commit -m "feat: add results overview and csv export"
```

### Task 9: 补齐公开提交安全边界与端到端验收

**Files:**
- Create: `lib/security/rate-limit.ts`
- Test: `tests/lib/security/rate-limit.test.ts`
- Create: `tests/e2e/admin-crud.spec.ts`
- Create: `tests/e2e/fill-survey.spec.ts`
- Modify: `app/api/surveys/[id]/responses/route.ts`
- Modify: `README.md`

- [ ] **Step 1: 先写速率限制失败测试**

```ts
// tests/lib/security/rate-limit.test.ts
import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/security/rate-limit";

describe("rate limiter", () => {
  it("blocks the 11th request within one minute", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

    for (let index = 0; index < 10; index += 1) {
      expect(limiter.consume("127.0.0.1")).toBe(true);
    }

    expect(limiter.consume("127.0.0.1")).toBe(false);
  });
});
```

- [ ] **Step 2: 运行安全测试，确认速率限制尚未实现**

Run:
```bash
pnpm vitest run tests/lib/security/rate-limit.test.ts
```

Expected: FAIL，提示 `createRateLimiter` 不存在。

- [ ] **Step 3: 实现速率限制并接入公开提交路由**

```ts
// lib/security/rate-limit.ts
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const store = new Map<string, number[]>();

  return {
    consume(key: string) {
      const now = Date.now();
      const history = (store.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
      if (history.length >= max) {
        store.set(key, history);
        return false;
      }

      history.push(now);
      store.set(key, history);
      return true;
    },
  };
}

export const publicSubmissionLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
});
```

```ts
// app/api/surveys/[id]/responses/route.ts（在 POST 中加入公开提交限流）
import { publicSubmissionLimiter } from "@/lib/security/rate-limit";

// ...
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const preview = request.nextUrl.searchParams.get("preview") === "1";
    let isAdminPreview = false;

    if (preview) {
      await requireAdminSession();
      isAdminPreview = true;
    } else {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
      if (!publicSubmissionLimiter.consume(ip)) {
        return Response.json({ error: "提交过于频繁，请稍后再试" }, { status: 429 });
      }
    }

    return ok(
      await submitSurveyResponse({
        surveyId: Number(id),
        payload: await request.json(),
        preview,
        isAdminPreview,
      }),
    );
  } catch (error) {
    return fromError(error);
  }
}
```

- [ ] **Step 4: 编写关键 E2E 验收脚本**

```ts
// tests/e2e/admin-crud.spec.ts
import { expect, test } from "@playwright/test";

test("admin can login and create a survey", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("用户名").fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel("密码").fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/surveys$/);
  await page.getByRole("link", { name: "新建问卷" }).click();
  await page.getByDisplayValue("未命名问卷").fill("E2E 问卷");
  await page.getByRole("button", { name: "填空题" }).click();
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page.getByText("问卷已保存")).toBeVisible();
});
```

```ts
// tests/e2e/fill-survey.spec.ts
import { expect, test } from "@playwright/test";

test("public user can submit only once", async ({ page }) => {
  await page.goto("/surveys/1/fill");
  await page.getByRole("textbox").fill("Alice");
  await page.getByRole("button", { name: "提交问卷" }).click();
  await expect(page.getByText("感谢你的填写")).toBeVisible();

  await page.goto("/surveys/1/fill");
  await page.getByRole("textbox").fill("Bob");
  await page.getByRole("button", { name: "提交问卷" }).click();
  await expect(page.getByText("请勿重复提交问卷")).toBeVisible();
});
```

```md
<!-- README.md 增补内容 -->
## 开发前准备

1. 复制 `.env.example` 为 `.env.local`
2. 用 `bcryptjs` 生成管理员密码哈希并填入 `ADMIN_PASSWORD_HASH`
3. 执行 `pnpm db:generate && pnpm db:migrate`
4. 启动开发环境：`pnpm dev`

## 验证命令

- 单测：`pnpm test`
- E2E：`pnpm test:e2e`
- 构建：`pnpm build`
```

- [ ] **Step 5: 运行最终验收命令**

Run:
```bash
pnpm vitest run tests/lib/security/rate-limit.test.ts
pnpm test
pnpm playwright install --with-deps
pnpm test:e2e
pnpm build
```

Expected:
- 速率限制单测 PASS
- 所有 Vitest 用例 PASS
- 关键 E2E 流程 PASS
- `pnpm build` 成功生成生产构建

- [ ] **Step 6: 提交安全与验收补齐**

```bash
git add .
git commit -m "feat: harden submission flow and add acceptance coverage"
```

## 后续计划拆分建议

- 第二阶段计划 A：新增 `dropdown`、`date`、`matrix` 题型，并扩展填写渲染器与结果聚合器。
- 第二阶段计划 B：新增问卷逻辑跳转与题目条件显示，单独设计规则 DSL 与可视化编辑体验。
- 第二阶段计划 C：将结果页扩展为单题分析图表、Excel 导出与过期时间 UI。
- 后续迭代计划：模板市场、文本词云、分页问卷、实时统计大屏。

## 自检结论

- 规范覆盖：MVP 的 CRUD、发布/下线、公开填写、防重复提交、基础统计、CSV 导出、管理端登录均已有对应任务；第二阶段与后续能力已明确拆分而非遗漏。
- 占位符扫描：全文未保留 `TBD`、`TODO`、`implement later`、`similar to task` 一类占位符。
- 类型一致性：内部统一使用 `question_<id>` 作为答案 key；API 边界统一使用 `respondent_id`/`duration_seconds`，内部统计统一使用 `durationSeconds`。
