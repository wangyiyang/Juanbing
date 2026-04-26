# Dropdown, Date Question Types and Expiration Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dropdown and date question types to the survey platform, plus survey expiration time controls.

**Architecture:** Frontend-focused changes to the editor (component palette, property panel, state management) and fill form (question renderer), plus lightweight backend expiration checks in the public API and submission service. Database schema and validators already support the new types.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, SQLite, Vitest, Playwright

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `components/survey-editor/component-palette.tsx` | Modify | Add dropdown and date buttons to the editor palette |
| `components/survey-editor/property-panel.tsx` | Modify | Enable option editing for dropdown questions |
| `components/survey-editor/editor-shell.tsx` | Modify | Add expiresAt date picker to the editor |
| `lib/surveys/editor-state.ts` | Modify | Add expiresAt to editor state and actions |
| `components/survey-fill/question-field.tsx` | Modify | Render dropdown (Select) and date (input) fields |
| `app/api/surveys/[id]/public/route.ts` | Modify | Reject requests for expired surveys |
| `lib/surveys/response-service.ts` | Modify | Reject submissions for expired surveys |
| `app/surveys/[id]/fill/page.tsx` | Modify | Render expiration notice for expired surveys |
| `components/surveys/survey-list.tsx` | Modify | Show expiration badge in survey list |
| `tests/components/question-field.test.tsx` | Create | Unit tests for dropdown and date rendering |
| `tests/lib/validators.test.ts` | Create | Unit tests for answer validation |
| `tests/e2e/fill-survey.spec.ts` | Modify | E2E test for filling dropdown/date surveys |
| `tests/e2e/admin-crud.spec.ts` | Modify | E2E test for setting expiration time |
| `tests/e2e/survey-expiration.spec.ts` | Create | E2E test for expired survey behavior |

---

### Task 1: Dropdown Editor Support

**Files:**
- Modify: `components/survey-editor/component-palette.tsx`
- Modify: `components/survey-editor/property-panel.tsx`

- [ ] **Step 1: Add dropdown to component palette**

In `components/survey-editor/component-palette.tsx`, update `MVP_TYPES`:

```tsx
const MVP_TYPES: Array<{ type: QuestionType; label: string }> = [
  { type: "single_choice", label: "单选题" },
  { type: "multiple_choice", label: "多选题" },
  { type: "text", label: "填空题" },
  { type: "rating", label: "评分题" },
  { type: "dropdown", label: "下拉选择" },
  { type: "date", label: "日期选择" },
];
```

- [ ] **Step 2: Enable option editing for dropdown in property panel**

In `components/survey-editor/property-panel.tsx`, change the condition on line 43 from:

```tsx
{(question.type === "single_choice" || question.type === "multiple_choice") &&
```

to:

```tsx
{(question.type === "single_choice" || question.type === "multiple_choice" || question.type === "dropdown") &&
```

- [ ] **Step 3: Run lint and commit**

```bash
pnpm lint
```

```bash
git add components/survey-editor/component-palette.tsx components/survey-editor/property-panel.tsx
git commit -m "feat: add dropdown and date to editor palette and property panel"
```

---

### Task 2: Dropdown Fill Form — TDD

**Files:**
- Create: `tests/components/question-field.test.tsx`
- Modify: `components/survey-fill/question-field.tsx`

- [ ] **Step 1: Write failing test for dropdown**

Create `tests/components/question-field.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionField } from "@/components/survey-fill/question-field";
import type { SurveyQuestionDetail } from "@/lib/surveys/types";

describe("QuestionField", () => {
  const dropdownQuestion: SurveyQuestionDetail = {
    id: 1,
    type: "dropdown",
    title: "请选择城市",
    required: false,
    orderIndex: 0,
    config: null,
    options: [
      { id: 1, label: "北京", value: "beijing", orderIndex: 0 },
      { id: 2, label: "上海", value: "shanghai", orderIndex: 1 },
    ],
  };

  it("renders dropdown options and calls onChange when selected", async () => {
    const onChange = vi.fn();
    render(<QuestionField question={dropdownQuestion} value={undefined} onChange={onChange} />);

    const trigger = screen.getByRole("combobox");
    await userEvent.click(trigger);

    const option = screen.getByText("上海");
    await userEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("shanghai");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/components/question-field.test.tsx
```

Expected: FAIL with "Unable to find role=\"combobox\"" because dropdown rendering is not yet implemented.

- [ ] **Step 3: Implement dropdown rendering**

In `components/survey-fill/question-field.tsx`, add before the final `return`:

```tsx
if (question.type === "dropdown") {
  return (
    <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="请选择" />
      </SelectTrigger>
      <SelectContent>
        {question.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

Add imports at the top:

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/components/question-field.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/components/question-field.test.tsx components/survey-fill/question-field.tsx
git commit -m "feat: add dropdown question type rendering with tests"
```

---

### Task 3: Date Fill Form — TDD

**Files:**
- Modify: `tests/components/question-field.test.tsx`
- Modify: `components/survey-fill/question-field.tsx`

- [ ] **Step 1: Write failing test for date**

In `tests/components/question-field.test.tsx`, add:

```tsx
const dateQuestion: SurveyQuestionDetail = {
  id: 2,
  type: "date",
  title: "请选择日期",
  required: false,
  orderIndex: 1,
  config: null,
  options: [],
};

it("renders date input and calls onChange when changed", async () => {
  const onChange = vi.fn();
  render(<QuestionField question={dateQuestion} value={undefined} onChange={onChange} />);

  const input = screen.getByLabelText("请选择日期");
  await userEvent.type(input, "2026-05-01");

  expect(onChange).toHaveBeenCalledWith("2026-05-01");
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/components/question-field.test.tsx
```

Expected: FAIL with "Unable to find element with label text \"请选择日期\"" because date rendering is not yet implemented.

- [ ] **Step 3: Implement date rendering**

In `components/survey-fill/question-field.tsx`, add before the final `return`:

```tsx
if (question.type === "date") {
  return (
    <Input
      type="date"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      aria-label={question.title}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/components/question-field.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/components/question-field.test.tsx components/survey-fill/question-field.tsx
git commit -m "feat: add date question type rendering with tests"
```

---

### Task 4: Validators Unit Tests

**Files:**
- Create: `tests/lib/validators.test.ts`

- [ ] **Step 1: Write validator tests**

Create `tests/lib/validators.test.ts`:

```tsx
import { describe, expect, it } from "vitest";

import { validateAnswersAgainstSurvey } from "@/lib/surveys/validators";
import type { SurveyDetail } from "@/lib/surveys/types";

function createSurvey(questions: SurveyDetail["questions"]): SurveyDetail {
  return {
    id: 1,
    title: "测试问卷",
    description: null,
    status: "published",
    expiresAt: null,
    createdAt: 0,
    updatedAt: 0,
    questions,
  };
}

describe("validateAnswersAgainstSurvey", () => {
  it("accepts valid dropdown answer", () => {
    const survey = createSurvey([
      {
        id: 1,
        type: "dropdown",
        title: "城市",
        required: true,
        orderIndex: 0,
        config: null,
        options: [{ id: 1, label: "北京", value: "beijing", orderIndex: 0 }],
      },
    ]);

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_1: "beijing" }),
    ).not.toThrow();
  });

  it("rejects invalid dropdown answer", () => {
    const survey = createSurvey([
      {
        id: 1,
        type: "dropdown",
        title: "城市",
        required: true,
        orderIndex: 0,
        config: null,
        options: [{ id: 1, label: "北京", value: "beijing", orderIndex: 0 }],
      },
    ]);

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_1: "shanghai" }),
    ).toThrow("选择题答案格式错误");
  });

  it("accepts valid date answer", () => {
    const survey = createSurvey([
      {
        id: 1,
        type: "date",
        title: "日期",
        required: true,
        orderIndex: 0,
        config: null,
        options: [],
      },
    ]);

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_1: "2026-05-01" }),
    ).not.toThrow();
  });

  it("rejects non-string date answer", () => {
    const survey = createSurvey([
      {
        id: 1,
        type: "date",
        title: "日期",
        required: true,
        orderIndex: 0,
        config: null,
        options: [],
      },
    ]);

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_1: 123 as unknown as string }),
    ).toThrow("文本题答案格式错误");
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
pnpm test tests/lib/validators.test.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/lib/validators.test.ts
git commit -m "test: add validator coverage for dropdown and date types"
```

---

### Task 5: Expiration Time — Editor State

**Files:**
- Modify: `lib/surveys/editor-state.ts`

- [ ] **Step 1: Add expiresAt to editor state**

In `lib/surveys/editor-state.ts`:

Update `EditorState`:

```tsx
export type EditorState = {
  title: string;
  description: string;
  expiresAt: number | null;
  questions: EditorQuestion[];
  selectedQuestionId: string | null;
};
```

Update `EditorAction`:

```tsx
export type EditorAction =
  | { type: "setTitle"; value: string }
  | { type: "setDescription"; value: string }
  | { type: "setExpiresAt"; value: number | null }
  | { type: "addQuestion"; questionType: QuestionType }
  | { type: "selectQuestion"; clientId: string }
  | { type: "moveQuestionUp"; clientId: string }
  | { type: "updateQuestion"; clientId: string; patch: Partial<EditorQuestion> };
```

Update `createInitialEditorState`:

```tsx
export function createInitialEditorState(
  survey?: SurveyDetail | null,
): EditorState {
  if (!survey) {
    return {
      title: "未命名问卷",
      description: "",
      expiresAt: null,
      questions: [],
      selectedQuestionId: null,
    };
  }

  const questions = normalizeQuestionOrder(
    survey.questions.map((question) => ({
      ...question,
      clientId: String(question.id),
      config: question.config ?? null,
      options: question.options ?? [],
    })),
  );

  return {
    title: survey.title,
    description: survey.description ?? "",
    expiresAt: survey.expiresAt,
    questions,
    selectedQuestionId: questions[0]?.clientId ?? null,
  };
}
```

Update `editorReducer`:

```tsx
case "setExpiresAt":
  return { ...state, expiresAt: action.value };
```

- [ ] **Step 2: Run tests to ensure no regressions**

```bash
pnpm test
```

Expected: All existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add lib/surveys/editor-state.ts
git commit -m "feat: add expiresAt to editor state management"
```

---

### Task 6: Expiration Time — Editor UI

**Files:**
- Modify: `components/survey-editor/editor-shell.tsx`

- [ ] **Step 1: Add expiresAt date picker to editor**

In `components/survey-editor/editor-shell.tsx`, after the description `Textarea`, add:

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium" htmlFor="expires-at">
    过期时间（可选）
  </label>
  <Input
    id="expires-at"
    type="date"
    value={
      state.expiresAt
        ? new Date(state.expiresAt * 1000).toISOString().split("T")[0]
        : ""
    }
    onChange={(event) => {
      const dateValue = event.target.value;
      dispatch({
        type: "setExpiresAt",
        value: dateValue
          ? Math.floor(new Date(dateValue).getTime() / 1000)
          : null,
      });
    }}
  />
</div>
```

Update `handleSave` to include `expiresAt`:

```tsx
body: JSON.stringify({
  title: state.title,
  description: state.description,
  expiresAt: state.expiresAt,
  questions: state.questions.map((question) => ({
    id: question.id,
    type: question.type,
    title: question.title,
    required: question.required,
    orderIndex: question.orderIndex,
    config: question.config ?? null,
    options: question.options,
  })),
}),
```

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/survey-editor/editor-shell.tsx
git commit -m "feat: add expiresAt date picker to survey editor"
```

---

### Task 7: Expiration Time — Backend Checks

**Files:**
- Modify: `app/api/surveys/[id]/public/route.ts`
- Modify: `lib/surveys/response-service.ts`

- [ ] **Step 1: Add expiration check to public API**

In `app/api/surveys/[id]/public/route.ts`, after the status check:

```tsx
if (!survey || survey.status !== "published") {
  return Response.json({ error: "问卷不可用" }, { status: 404 });
}

if (survey.expiresAt && Math.floor(Date.now() / 1000) > survey.expiresAt) {
  return Response.json({ error: "问卷已过期" }, { status: 403 });
}
```

- [ ] **Step 2: Add expiration check to submission service**

In `lib/surveys/response-service.ts`, after the status check:

```tsx
} else if (survey.status !== "published") {
  throw new ApiError(409, "问卷尚未发布");
}

if (survey.expiresAt && Math.floor(Date.now() / 1000) > survey.expiresAt) {
  throw new ApiError(403, "问卷已过期");
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: All existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/surveys/[id]/public/route.ts lib/surveys/response-service.ts
git commit -m "feat: reject expired surveys in public API and submission"
```

---

### Task 8: Expiration Time — Fill Page Notice

**Files:**
- Modify: `app/surveys/[id]/fill/page.tsx`

- [ ] **Step 1: Render expiration notice for expired surveys**

In `app/surveys/[id]/fill/page.tsx`, after the status check:

```tsx
if (survey.status !== "published" && preview !== "1") {
  notFound();
}

if (survey.expiresAt && Math.floor(Date.now() / 1000) > survey.expiresAt && preview !== "1") {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">问卷已过期</h1>
      <p className="mt-2 text-slate-600">
        该问卷已于 {new Date(survey.expiresAt * 1000).toLocaleDateString("zh-CN")} 截止。
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/surveys/[id]/fill/page.tsx
git commit -m "feat: show expiration notice on fill page for expired surveys"
```

---

### Task 9: Survey List Expiration Badge

**Files:**
- Modify: `components/surveys/survey-list.tsx`

- [ ] **Step 1: Show expiration info in survey list**

In `components/surveys/survey-list.tsx`, update the props type:

```tsx
export function SurveyList({
  surveys,
}: {
  surveys: Array<{
    id: number;
    title: string;
    status: string;
    createdAt: number;
    expiresAt: number | null;
  }>;
}) {
```

Add an expiration column or modify the status cell. Replace the status cell with:

```tsx
<TableCell>
  <div className="flex flex-col gap-1">
    <Badge variant="secondary">{survey.status}</Badge>
    {survey.expiresAt ? (
      <span className="text-xs text-slate-500">
        到期：{new Date(survey.expiresAt * 1000).toLocaleDateString("zh-CN")}
      </span>
    ) : null}
  </div>
</TableCell>
```

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/surveys/survey-list.tsx
git commit -m "feat: show expiration date in survey list"
```

---

### Task 10: E2E Tests

**Files:**
- Modify: `tests/e2e/fill-survey.spec.ts`
- Modify: `tests/e2e/admin-crud.spec.ts`
- Create: `tests/e2e/survey-expiration.spec.ts`

- [ ] **Step 1: Extend fill-survey E2E test**

In `tests/e2e/fill-survey.spec.ts`, add a new test:

```tsx
test("public user can fill dropdown and date questions", async ({ browser, page }) => {
  const surveyId = await createPublishedSurvey(page);

  // Add dropdown and date questions via API
  await page.evaluate(async (id) => {
    await fetch(`/api/surveys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "测试问卷",
        questions: [
          {
            type: "dropdown",
            title: "请选择城市",
            required: true,
            orderIndex: 0,
            config: null,
            options: [
              { label: "北京", value: "beijing", orderIndex: 0 },
              { label: "上海", value: "shanghai", orderIndex: 1 },
            ],
          },
          {
            type: "date",
            title: "请选择日期",
            required: true,
            orderIndex: 1,
            config: null,
            options: [],
          },
        ],
      }),
    });
  }, surveyId);

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  await publicPage.goto(`/surveys/${surveyId}/fill`);

  // Fill dropdown
  await publicPage.getByRole("combobox").click();
  await publicPage.getByText("上海").click();

  // Fill date
  await publicPage.getByLabel("请选择日期").fill("2026-05-01");

  await publicPage.getByRole("button", { name: "提交问卷" }).click();
  await expect(publicPage.getByText("感谢你的填写")).toBeVisible();

  await publicContext.close();
});
```

- [ ] **Step 2: Extend admin-crud E2E test**

In `tests/e2e/admin-crud.spec.ts`, add expiration time setting:

```tsx
test("admin can set expiration time when creating survey", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("用户名").fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel("密码").fill(process.env.E2E_ADMIN_PASSWORD ?? "secret123");
  await page.getByRole("button", { name: "登录" }).click();

  await page.getByRole("link", { name: "新建问卷" }).click();
  await page.locator("input").first().fill("带过期时间的问卷");

  // Set expiration date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split("T")[0];
  await page.getByLabel("过期时间").fill(dateString);

  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("问卷已保存")).toBeVisible();

  // Verify expiration is shown in list
  await page.goto("/surveys");
  await expect(page.getByText(`到期：${tomorrow.toLocaleDateString("zh-CN")}`)).toBeVisible();
});
```

- [ ] **Step 3: Create expiration E2E test**

Create `tests/e2e/survey-expiration.spec.ts`:

```tsx
import { expect, test } from "@playwright/test";

test("expired survey cannot be accessed publicly", async ({ page }) => {
  // Create and publish a survey with past expiration date via API
  const response = await page.request.post("/api/surveys", {
    headers: { "Cookie": process.env.E2E_ADMIN_COOKIE ?? "" },
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
    data: { status: "published" },
  });

  // Try to access fill page
  await page.goto(`/surveys/${surveyId}/fill`);
  await expect(page.getByText("问卷已过期")).toBeVisible();
});

test("expired survey cannot be submitted", async ({ page }) => {
  // Create survey with past expiration
  const response = await page.request.post("/api/surveys", {
    headers: { "Cookie": process.env.E2E_ADMIN_COOKIE ?? "" },
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
```

Note: The E2E tests above use direct API calls. If `E2E_ADMIN_COOKIE` is not set, you may need to log in via UI first in a `test.beforeEach` or helper. Adjust based on existing test infrastructure.

- [ ] **Step 4: Run E2E tests**

```bash
pnpm test:e2e
```

Expected: All E2E tests pass (including new ones).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/
git commit -m "test: add E2E coverage for dropdown, date, and expiration"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] Dropdown question type in editor (Task 1, 2)
- [x] Date question type in editor (Task 1 — palette, Task 4 — fill form)
- [x] Dropdown rendering with Select component (Task 2)
- [x] Date rendering with date input (Task 4)
- [x] ExpiresAt in editor state (Task 5)
- [x] ExpiresAt date picker in editor UI (Task 6)
- [x] Public API expiration check (Task 7)
- [x] Submission service expiration check (Task 7)
- [x] Fill page expiration notice (Task 8)
- [x] Survey list expiration badge (Task 9)
- [x] Unit tests for question-field (Tasks 2, 4)
- [x] Unit tests for validators (Task 4)
- [x] E2E tests (Task 10)

**2. Placeholder scan:**
- [x] No TBD, TODO, or "implement later" found
- [x] Every step contains actual code or exact commands
- [x] No vague instructions like "add appropriate error handling"

**3. Type consistency:**
- [x] `expiresAt` is consistently `number | null` (Unix seconds)
- [x] `dropdown` answer type is consistently `string`
- [x] `date` answer type is consistently `string` (`YYYY-MM-DD`)
- [x] `QuestionType` values match schema enum
