# 员工 360 环评 MVP 设计文档

## 1. 目的与结论

Juanbing 当前是通用问卷系统，已经具备问卷编辑、发布、公开填写、防重复提交、基础结果看板和 CSV 导出能力。客户希望用于员工 360 环评时，关键差距不在题型数量，而在“人、组织、评价项目、评价关系、匿名汇总、报告交付”这些业务对象。

本设计建议在现有问卷引擎之上增加一层 360 环评业务模块。问卷仍负责题目、答案校验和基础提交；360 模块负责员工档案、评价项目、被评人、评价人分配、专属填写链接、进度追踪和报告聚合。这样可以最大化复用现有代码，同时避免把 360 业务规则硬塞进通用问卷模型。

## 2. 当前项目基线

现有能力：

- 管理员登录：单管理员账号，使用 `iron-session` 和 bcrypt 校验。
- 问卷模型：`surveys`、`survey_questions`、`survey_options`、`survey_responses`。
- 题型：单选、多选、填空、评分、下拉、日期；矩阵题在类型和校验层存在，填写 UI 未完整开放。
- 填写链路：公开链接、预览模式、过期时间、防重复提交、速率限制、文本净化。
- 结果链路：回收量、平均填写时长、回收趋势、原始数据表、CSV 导出。
- 工程质量：`pnpm lint`、`pnpm test`、`pnpm build` 当前通过。

不适合直接承载 360 的现状：

- `respondent_id` 是浏览器设备标识，不是企业员工身份。
- 公开链接只表达“填写某份问卷”，不能表达“某评价人评价某被评人”。
- 结果看板按问卷聚合，不能按被评人、关系类型、维度和匿名阈值汇总。
- 系统只有单管理员，不区分 HR 管理员、项目查看者和普通员工。

## 3. 范围

### 3.1 MVP 包含

1. 员工档案：支持管理员维护员工姓名、邮箱、部门、岗位、主管关系和在职状态。
2. 360 评价项目：支持创建评价项目，绑定一份现有问卷作为评价表，设置开始时间、截止时间和匿名阈值。
3. 被评人与评价人分配：支持为一个项目添加被评人，并为每个被评人分配本人、上级、同事、下级、其他关系的评价人。
4. 专属填写链接：每个评价任务生成唯一 token，评价人通过 token 填写。链接不能横向访问其他任务。
5. 进度看板：按项目展示被评人数量、评价任务数量、已完成数量、完成率、临近截止状态。
6. 360 报告：按被评人生成维度评分、关系组评分、自评与他评对比、开放题匿名摘录。
7. 导出：支持项目级任务清单 CSV、被评人报告 CSV。

### 3.2 MVP 不包含

1. 多租户客户隔离。
2. 企业微信、钉钉、飞书、SSO 登录。
3. 邮件或短信自动发送提醒。
4. PDF 报告生成。
5. HRIS 自动同步。
6. 薪酬、晋升、绩效等级计算。
7. AI 文本总结和词云。
8. 复杂流程审批。

这些能力会影响权限、安全和交付复杂度，不放入第一版，避免拖慢 360 核心闭环。

## 4. 方案选择

### 方案 A：直接复用普通问卷公开链接

把“被评人姓名”“评价关系”做成问卷题，让评价人手动选择。

优点是开发量最低；缺点是数据质量不可控，评价人可以选错被评人或关系，无法可靠追踪进度，也无法保障匿名报告。该方案不适合客户正式使用。

### 方案 B：在问卷系统上增加 360 业务层，推荐

保留现有问卷作为题目与答案引擎，新增员工、评价项目、被评人、评价任务和报告模块。填写入口从公开问卷链接变成一次性评价任务链接。

优点是复用现有资产，开发风险可控，业务边界清晰；缺点是需要新增一组表和页面。该方案最适合第一版。

### 方案 C：重建为独立 360 系统

完全绕开问卷模型，单独做 360 表单、答案和报告。

优点是领域模型纯粹；缺点是会重写已完成的问卷编辑、填写、校验和结果基础设施。当前项目还处于早期，不需要这样重。

## 5. 核心概念

### 5.1 员工 Employee

员工是系统中的组织成员。MVP 只要求管理员维护，不要求员工登录。

字段建议：

- `employeeNo`：员工编号，可为空但在非空时唯一。
- `name`：姓名。
- `email`：邮箱，可为空但在非空时唯一。
- `department`：部门名称，MVP 使用文本字段，避免过早引入复杂组织树。
- `title`：岗位或职级名称。
- `managerId`：直属主管员工 ID，可为空。
- `status`：`active` 或 `inactive`。

### 5.2 评价项目 Evaluation Cycle

评价项目是一轮 360 环评，例如“2026 Q2 管理干部 360”。

字段建议：

- `title`：项目名称。
- `description`：项目说明。
- `status`：`draft`、`active`、`closed`。
- `surveyId`：绑定的问卷 ID。
- `startsAt`：开始时间。
- `endsAt`：截止时间。
- `anonymityThreshold`：匿名展示阈值，默认 3。

### 5.3 被评人 Evaluation Subject

被评人是某个项目中被评价的员工。同一个员工可以在不同项目中多次成为被评人。

字段建议：

- `cycleId`：评价项目 ID。
- `employeeId`：被评员工 ID。
- `status`：`active` 或 `removed`。

### 5.4 评价任务 Evaluation Assignment

评价任务表达“谁以什么关系评价谁”。这是 360 模块的核心对象。

字段建议：

- `cycleId`：评价项目 ID。
- `subjectId`：被评人记录 ID。
- `raterEmployeeId`：评价人员工 ID。外部评价人可为空，MVP 默认不开放外部评价人。
- `relationship`：`self`、`manager`、`peer`、`direct_report`、`other`。
- `token`：唯一填写 token。
- `status`：`pending`、`submitted`、`expired`。
- `responseId`：提交后关联到 `survey_responses.id`。
- `submittedAt`：提交时间。

## 6. 数据流

### 6.1 管理员配置项目

1. 管理员维护员工档案。
2. 管理员创建或选择一份问卷作为评价表。
3. 管理员创建评价项目并绑定问卷。
4. 管理员添加被评人。
5. 管理员为每个被评人分配评价人和关系。
6. 管理员发布项目，系统为未生成 token 的评价任务生成 token。

### 6.2 评价人填写

1. 评价人打开 `/evaluations/fill/[token]`。
2. 服务端校验 token 存在、项目处于 active、任务未提交、项目未截止。
3. 页面展示项目名称、被评人姓名、评价关系和问卷题目。
4. 提交时复用现有问卷答案校验和净化逻辑。
5. 系统写入 `survey_responses`，并把 `evaluation_assignments.responseId` 更新为该回答 ID。
6. 同一个 token 再次提交时返回“该评价任务已完成”。

### 6.3 管理员查看报告

1. 管理员进入评价项目详情页。
2. 系统展示项目进度和每个被评人的完成情况。
3. 管理员打开某个被评人报告。
4. 系统拉取该被评人的所有已提交任务和答案。
5. 系统按题目、评分维度和关系组聚合。
6. 系统按照匿名规则隐藏不满足阈值的关系组和开放题摘录。

## 7. 数据模型

新增表：

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_no TEXT,
  name TEXT NOT NULL,
  email TEXT,
  department TEXT,
  title TEXT,
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX employees_employee_no_unique
  ON employees(employee_no)
  WHERE employee_no IS NOT NULL AND employee_no != '';

CREATE UNIQUE INDEX employees_email_unique
  ON employees(email)
  WHERE email IS NOT NULL AND email != '';

CREATE TABLE evaluation_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE RESTRICT,
  starts_at INTEGER,
  ends_at INTEGER,
  anonymity_threshold INTEGER NOT NULL DEFAULT 3,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE evaluation_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX evaluation_subjects_cycle_employee_unique
  ON evaluation_subjects(cycle_id, employee_id);

CREATE TABLE evaluation_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES evaluation_subjects(id) ON DELETE CASCADE,
  rater_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  relationship TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  response_id INTEGER REFERENCES survey_responses(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  submitted_at INTEGER
);
```

现有 `survey_responses` 不需要在 MVP 修改 schema。评价任务与问卷回答通过 `evaluation_assignments.response_id` 关联，避免把 360 字段写进通用问卷回答表。

## 8. 后端模块设计

新增模块：

- `lib/employees/types.ts`：员工领域类型。
- `lib/employees/validators.ts`：员工创建、更新、导入校验。
- `lib/employees/repository.ts`：员工查询和写入。
- `lib/employees/service.ts`：员工业务规则。
- `lib/evaluations/types.ts`：评价项目、被评人、评价任务类型。
- `lib/evaluations/validators.ts`：项目、被评人、评价任务输入校验。
- `lib/evaluations/repository.ts`：评价项目相关数据库访问。
- `lib/evaluations/service.ts`：创建项目、分配评价人、发布、关闭、token 查询、提交状态更新。
- `lib/evaluations/report-service.ts`：按被评人生成报告数据。
- `lib/evaluations/report-policy.ts`：匿名阈值和关系组展示规则。

服务边界：

- `surveys` 模块继续只理解问卷。
- `evaluations` 模块可以调用 `surveys` 的查询和回答校验能力。
- `report-service` 只返回聚合后的报告模型，不向前端暴露评价人身份。

## 9. 前端页面设计

新增管理端页面：

- `/employees`：员工列表、搜索、新建、编辑、停用。
- `/evaluations`：评价项目列表。
- `/evaluations/new`：创建评价项目。
- `/evaluations/[id]`：项目详情、进度看板、被评人列表。
- `/evaluations/[id]/subjects/[subjectId]/report`：单个被评人 360 报告。

新增公开填写页：

- `/evaluations/fill/[token]`：评价任务填写页。
- `/evaluations/fill/[token]/thank-you`：评价任务提交完成页。

导航调整：

- 管理端侧边或顶部导航增加“问卷”“员工”“360 环评”三个入口。
- 不改动现有普通问卷 URL，避免破坏已有功能。

## 10. 匿名与权限规则

MVP 采用单管理员权限，管理员可以配置项目和查看报告。

匿名规则：

1. `self` 自评单独展示。
2. `manager` 上级评价单独展示，因为上级关系在企业内通常可识别。
3. `peer`、`direct_report`、`other` 的评分分组必须达到 `anonymityThreshold` 才单独展示。
4. 未达到阈值的非上级他评进入“其他他评汇总”，如果汇总数量仍低于阈值，则不展示该汇总。
5. 开放题摘录只展示 `self`、`manager` 和满足阈值的关系组；不展示评价人姓名、邮箱、员工编号。
6. 原始回答仍保存在数据库中，但报告 API 不返回评价人身份。

## 11. 报告口径

MVP 报告按题目聚合，不新增复杂维度配置表。评分题直接作为可量化指标；矩阵题在 UI 完整开放前不作为 MVP 报告基础。

报告包含：

- 被评人基本信息：姓名、部门、岗位。
- 项目基本信息：项目名称、评价周期、完成数。
- 总览：自评分、上级评分、他评平均分。
- 单题评分：每道评分题的关系组平均分和样本数。
- 差异分析：自评与他评平均分差值。
- 开放题：按关系组展示匿名文本摘录。

CSV 导出包含：

- 项目任务清单：被评人、评价关系、评价人、任务状态、提交时间。
- 被评人报告数据：题目、关系组、平均分、样本数。

## 12. 错误处理

| 场景 | 行为 |
|------|------|
| token 不存在 | 返回 404，页面显示“评价链接不存在” |
| 项目未发布 | 返回 403，页面显示“评价项目尚未开始” |
| 项目已关闭或已截止 | 返回 403，页面显示“评价项目已结束” |
| 任务已提交 | 返回 409，页面显示“该评价任务已完成” |
| 被评人或评价人停用 | 管理端创建任务时禁止选择停用员工；已发布项目保留历史任务 |
| 绑定问卷被删除 | 数据库使用 RESTRICT 阻止删除已绑定项目的问卷 |
| 报告样本数不足 | 报告隐藏对应关系组，并说明“样本数不足，已按匿名规则隐藏” |

## 13. 测试策略

单元测试：

- 员工输入校验、唯一性校验、停用规则。
- 评价项目状态流转。
- 评价任务 token 生成唯一性。
- token 填写提交的状态校验。
- 报告匿名阈值策略。
- 评分题报告聚合。

组件测试：

- 员工表单。
- 评价项目表单。
- 任务分配表格。
- 报告组件。

E2E 测试：

1. 管理员创建员工。
2. 管理员创建问卷。
3. 管理员创建 360 项目并绑定问卷。
4. 管理员添加被评人和评价任务。
5. 管理员发布项目。
6. 评价人通过 token 填写。
7. 管理员查看进度和报告。

回归测试：

- 普通问卷创建、发布、填写、结果查看、CSV 导出不受影响。
- `pnpm lint`、`pnpm test`、`pnpm build` 通过。

## 14. 验收标准

1. 管理员可以维护员工档案，并能通过员工姓名、邮箱、部门搜索。
2. 管理员可以创建 360 评价项目并绑定一份已存在问卷。
3. 管理员可以为项目添加被评人，并为每个被评人分配多个评价任务。
4. 项目发布后，每个评价任务都有唯一填写链接。
5. 评价人打开 token 链接时能看到被评人和评价关系，并能提交答案。
6. 同一个 token 不能重复提交。
7. 管理员可以查看项目整体进度和每个被评人的完成情况。
8. 管理员可以打开被评人报告，看到评分题按关系组聚合后的结果。
9. 报告遵守匿名阈值，不暴露 peer、direct_report、other 的单个评价人身份。
10. 管理员可以导出项目任务清单和被评人报告 CSV。
11. 普通问卷功能保持兼容。
12. `pnpm lint`、`pnpm test`、`pnpm build` 均通过。
