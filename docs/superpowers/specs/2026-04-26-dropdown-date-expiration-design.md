# 夯实核心体验（第一批）— 设计文档

## 1. 背景与目标

Juanbing MVP 已支持单选、多选、填空、评分四种基础题型，以及问卷的创建、发布、填写和结果查看。为了扩展问卷的适用场景，第一批聚焦补齐两种常用题型（下拉选择、日期选择）和过期时间控制，使平台能覆盖更多数据收集需求。

## 2. 范围

本次实现包含以下三个功能点：

| 功能点 | 复杂度 | 说明 |
|--------|--------|------|
| 下拉选择题型 | 低 | 复用现有选项模型，前端增加 Select 渲染 |
| 日期选择题型 | 低 | 前端增加 date input 渲染，答案为 `YYYY-MM-DD` 字符串 |
| 问卷过期时间控制 | 低 | 编辑器支持设置 `expiresAt`，公开接口校验过期状态 |

**不包含的内容**：矩阵题、逻辑跳转、数据可视化图表、Excel 导出。

## 3. 架构概览

本次改动以**前端补齐为主**，后端基础设施（schema、校验器、repository）已完全支持，仅需增加过期校验逻辑。

```
编辑器（EditorShell / ComponentPalette / PropertyPanel）
    ↓ 保存
API（/api/surveys, /api/surveys/[id]）— validators.ts 已支持
    ↓
数据库（surveys.expiresAt, surveyQuestions.type: dropdown|date）

填写端（/surveys/[id]/fill）
    ← 获取问卷（public API 校验 expiresAt）
    ← 提交响应（response-service 校验 expiresAt）
    QuestionField 渲染 dropdown / date
```

## 4. 模块详细设计

### 4.1 题型扩展 — 下拉选择（dropdown）

#### 编辑器侧

- **ComponentPalette**：在 `MVP_TYPES` 中追加 `{ type: "dropdown", label: "下拉选择" }`。默认问题创建逻辑已存在（`question-defaults.ts`），会自动生成 2 个默认选项。
- **PropertyPanel**：`dropdown` 的选项编辑逻辑与单选/多选完全一致。将现有条件 `(question.type === "single_choice" || question.type === "multiple_choice")` 扩展为包含 `"dropdown"`。

#### 填写侧

- **QuestionField**：新增 `dropdown` 分支，使用 `components/ui/select.tsx` 中的 `Select` 组件渲染。选项数据来自 `question.options`，答案值为单个字符串（选中选项的 `value`）。

#### 校验

- 后端 `validators.ts` 中 `choiceQuestionSchema` 已包含 `"dropdown"`，`validateChoiceQuestion` 已处理该类型的答案合法性校验。

### 4.2 题型扩展 — 日期选择（date）

#### 编辑器侧

- **ComponentPalette**：在 `MVP_TYPES` 中追加 `{ type: "date", label: "日期选择" }`。默认问题创建逻辑已存在。
- **PropertyPanel**：`date` 无需特殊属性配置，当前面板（题目标题 + 必填开关）已足够。

#### 填写侧

- **QuestionField**：新增 `date` 分支，使用原生 `<input type="date">` 渲染。答案值为 `YYYY-MM-DD` 格式字符串。

#### 校验

- 后端 `validators.ts` 中 `dateQuestionSchema` 已存在，`validateAnswersAgainstSurvey` 中 `date` 走 `validateTextLikeQuestion`（校验值为字符串类型）。

### 4.3 过期时间控制

#### 编辑器侧

- **EditorShell**：在问卷标题/描述输入下方增加 `expiresAt` 日期选择器（`<input type="date">`）。
- **状态管理**：
  - `EditorState` 新增 `expiresAt: number | null`（Unix 秒级时间戳，与数据库一致）。
  - `EditorAction` 新增 `{ type: "setExpiresAt"; value: number | null }`。
  - `createInitialEditorState` 从 `survey.expiresAt` 初始化。
- **保存**：`handleSave` 中将 `state.expiresAt` 随请求体发送。`validators.ts:surveyInputSchema` 已接受 `expiresAt: number.int().nullable().optional()`。

#### 后端校验

- **公开获取问卷**（`app/api/surveys/[id]/public/route.ts`）：
  - 在 `survey.status !== "published"` 校验之后，追加 `expiresAt` 校验。
  - 若 `survey.expiresAt` 存在且当前 Unix 时间 > `expiresAt`，返回 `403` 状态码，`{ error: "问卷已过期" }`。
- **提交响应**（`lib/surveys/response-service.ts`）：
  - 在正式提交前校验 `expiresAt`，过期则抛出 `ApiError(403, "问卷已过期")`。
  - 预览模式不受过期限制。

#### 填写侧

- **填写页服务端预检**（`app/surveys/[id]/fill/page.tsx`）：
  - 在获取问卷后、渲染表单前，校验 `expiresAt`。
  - 若已过期，渲染静态过期提示页面（无需加载客户端表单）。
  - 预览模式（`?preview=1`）跳过过期校验。

#### 管理端展示（可选增强）

- **问卷列表**（`components/surveys/survey-list.tsx`）：若问卷已设置 `expiresAt`，在卡片上显示过期日期标签（例如 "2026-05-01 到期"）。过期问卷视觉上以灰色或警告色区分。

## 5. 数据流

### 创建/编辑含新题型的问卷

```
用户点击 ComponentPalette "下拉选择" / "日期选择"
  → editorReducer 创建默认问题（含默认选项/配置）
  → 用户在 PropertyPanel 编辑标题、选项（dropdown）、必填状态
  → 用户点击保存
  → EditorShell 组装 { title, description, expiresAt, questions }
  → POST/PUT /api/surveys
  → validators.ts 校验（dropdown 走 choiceQuestionSchema，date 走 dateQuestionSchema）
  → repository.ts 写入 surveys + surveyQuestions + surveyOptions
```

### 用户填写含新题型的问卷

```
访问 /surveys/:id/fill
  → fill/page.tsx 获取问卷
  → 校验 expiresAt（未过期则继续，已过期则显示过期页）
  → SurveyFillPageClient 渲染 QuestionField
     → dropdown: Select 组件
     → date: input type="date"
  → 用户提交
  → POST /api/surveys/:id/responses
  → response-service 校验 expiresAt + validateAnswersAgainstSurvey
  → 数据入库
```

## 6. 错误处理

| 场景 | 行为 |
|------|------|
| 过期问卷被公开访问 | 返回 403 `"问卷已过期"`，前端显示友好提示页 |
| 过期问卷被提交 | 返回 403 `"问卷已过期"` |
| dropdown 答案包含非法选项 | 返回 400 `"选择题答案格式错误"`（现有行为） |
| date 答案非字符串 | 返回 400 `"文本题答案格式错误"`（现有行为） |
| 必填 dropdown/date 未作答 | 前端拦截（现有行为），后端兜底返回 400 |

## 7. 测试策略

### 7.1 单元测试（Vitest）

- **`tests/components/question-field.test.tsx`**（新增）：
  - `dropdown`：渲染 Select，选择选项后 `onChange` 被正确调用。
  - `date`：渲染 date input，输入 `2026-05-01` 后 `onChange` 被正确调用。
- **`tests/lib/validators.test.ts`**（新增或补充）：
  - `dropdown` 答案校验：合法选项通过，非法选项报错，空值在必填时报错。
  - `date` 答案校验：字符串通过，非字符串报错，空值在必填时报错。

### 7.2 E2E 测试（Playwright）

- **`tests/e2e/fill-survey.spec.ts`**（扩展）：
  - 管理员创建含 `dropdown` 和 `date` 的问卷 → 发布 → 匿名用户填写并提交 → 提交成功。
- **`tests/e2e/admin-crud.spec.ts`**（扩展）：
  - 创建问卷时设置 `expiresAt`，保存后在列表中正确显示过期日期。

### 7.3 过期时间专项测试

- **`tests/e2e/survey-expiration.spec.ts`**（新增）：
  - 过期问卷公开访问返回 403，显示"问卷已过期"。
  - 未过期问卷正常填写。
  - 预览模式下过期问卷仍可访问和填写。

### 7.4 回归测试清单

- [ ] 现有 4 种题型（单选、多选、填空、评分）的创建/填写/结果查看不受影响。
- [ ] CSV 导出包含新题型的答案（dropdown 导出为字符串，date 导出为日期字符串）。
- [ ] 结果看板正常显示含新题型的问卷数据。

## 8. 验收标准

- [ ] 管理员可以在编辑器中创建含下拉选择和日期选择的问卷，并设置过期时间。
- [ ] 下拉选择和日期选择在公开填写页正常渲染和提交。
- [ ] 已过期的问卷无法被公开访问和提交，显示"问卷已过期"提示。
- [ ] 预览模式不受过期时间限制。
- [ ] 所有现有测试通过，新增测试覆盖新功能。
