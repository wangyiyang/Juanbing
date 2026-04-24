# Juanbing (卷饼) 问卷调查平台 — 设计文档

## 1. 项目概述

Juanbing 是一个自用的中文问卷调查与数据收集平台，支持多种场景（内部反馈、客户调研、考试测评、活动报名等）。采用单管理员 + 受访者免登录的模式，通过轻量级手段（浏览器 Cookie/设备标识）防止重复填写。

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 组件库 | Shadcn UI (基于 Radix UI) |
| 数据库 | SQLite |
| ORM | Drizzle ORM |
| 图表 | Recharts |
| 导出 | SheetJS (xlsx) |
| 会话管理 | iron-session |

## 3. 数据模型

### 3.1 核心表结构

```sql
-- 问卷表
CREATE TABLE surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft / published / closed
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER -- 可选过期时间
);

-- 题目表
CREATE TABLE survey_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- single_choice / multiple_choice / text / rating / dropdown / date / matrix
  title TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 0, -- 0=false, 1=true
  order_index INTEGER NOT NULL,
  config TEXT -- JSON: 如 matrix 行列定义、rating 最大分值等
);

-- 选项表（适用于单选、多选、下拉）
CREATE TABLE survey_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- 回答表
CREATE TABLE survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  answers TEXT NOT NULL, -- JSON: {"question_id": "answer_value"}
  respondent_id TEXT NOT NULL, -- 浏览器指纹/设备标识，用于防重复
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### 3.2 设计说明

- `answers` 采用 JSON 存储，避免为每种题型创建独立答案表，简化查询逻辑。
- `respondent_id` 由前端生成（如 `crypto.randomUUID()` 存入 localStorage），配合后端简单校验防止重复提交。注：此机制为"防君子不防小人"，适用于自用低 stakes 场景。
- `config` 字段用于存储题型特定配置，如矩阵题的行/列定义、评分题的最大分值等。

## 4. 前端架构

### 4.1 页面结构

```
app/
├── page.tsx                    # 首页：问卷列表
├── layout.tsx                  # 根布局
├── globals.css                 # 全局样式
├── surveys/
│   ├── new/
│   │   └── page.tsx            # 创建问卷（编辑器）
│   ├── [id]/
│   │   ├── page.tsx            # 编辑问卷
│   │   ├── results/
│   │   │   └── page.tsx        # 数据看板
│   │   └── fill/
│   │       └── page.tsx        # 填写问卷（公开访问）
│   └── page.tsx                # 问卷列表（管理端）
├── api/                        # API Routes（见第5节）
└── components/
    ├── survey-editor/          # 问卷编辑器
    │   ├── index.tsx           # 编辑器主组件
    │   ├── component-palette.tsx    # 左侧组件库
    │   ├── canvas.tsx          # 中间画布
    │   └── property-panel.tsx  # 右侧属性面板
    ├── survey-fill/            # 问卷填写
    │   ├── index.tsx
    │   └── question-renderer.tsx    # 题型渲染器
    ├── survey-results/         # 数据看板
    │   ├── index.tsx
    │   ├── stats-overview.tsx  # 概览统计
    │   ├── question-analysis.tsx    # 单题分析
    │   └── raw-data-table.tsx  # 原始数据表
    └── ui/                     # Shadcn UI 组件
```

### 4.2 问卷编辑器交互设计

对标问卷星，采用**左-中-右三栏布局**：

- **左侧组件库**：单选题、多选题、填空题、评分题、下拉选择、日期选择、矩阵题。点击或拖拽添加到画布。
- **中间画布**：展示问卷题目，支持点击题目展开内联编辑、上下拖拽排序。
- **右侧属性面板**：当选中题目时，显示题目文本、是否必填、选项配置等属性。
- **顶部工具栏**：问卷标题编辑、保存、预览、发布、复制链接。

### 4.3 问卷填写页

- 单页展示所有题目，垂直排列。
- 每道题进入视口时轻微动画（使用 Framer Motion 或 Shadcn UI 动画）。
- 必填题未填写时，提交按钮提示并滚动到未填题目。
- **预览模式**：管理员点击编辑器顶部"预览"进入，可通过 `?preview=1` 标识。预览提交**不入库**，仅校验格式后返回成功，可无限次重复填写。
- **正式发布**：通过公开链接进入，提交数据入库，同一 `respondent_id` 仅允许提交一次。提交后显示感谢页面。

### 4.4 数据看板

- **概览页**：回收量、平均填写时长、回收趋势折线图。
- **单题分析**：
  - 单选/多选/下拉：饼图或柱状图（Recharts）。
  - 评分：平均分 + 分布柱状图。
  - 文本：列表展示（词云后续迭代）。
  - 矩阵：热力图或分组柱状图。
- **原始数据页**：表格展示所有回答，支持按题目筛选、按时间范围筛选。
- **导出**：支持 Excel (.xlsx) 和 CSV 导出，可结合筛选条件导出子集。

## 5. API 设计

| 路由 | 方法 | 描述 | 鉴权 |
|------|------|------|------|
| `/api/surveys` | GET | 获取问卷列表（管理端） | 需登录 |
| `/api/surveys` | POST | 创建新问卷 | 需登录 |
| `/api/surveys/[id]` | GET | 获取问卷完整详情（管理端） | 需登录 |
| `/api/surveys/[id]/public` | GET | 获取已发布问卷的题目和选项（填写端） | 公开 |
| `/api/surveys/[id]` | PUT | 更新问卷 | 需登录 |
| `/api/surveys/[id]` | DELETE | 删除问卷 | 需登录 |
| `/api/surveys/[id]/publish` | POST | 发布/下线问卷 | 需登录 |
| `/api/surveys/[id]/responses` | GET | 获取回答列表 | 需登录 |
| `/api/surveys/[id]/responses` | POST | 提交回答（正式） | 公开 |
| `/api/surveys/[id]/responses` | POST | 提交回答（预览，`?preview=1`） | 需登录（仅管理员） |
| `/api/surveys/[id]/export` | GET | 导出 Excel/CSV | 需登录 |

### 5.1 提交回答接口详情

**POST `/api/surveys/[id]/responses`**

请求体：
```json
{
  "answers": {
    "question_1": "option_a",
    "question_2": ["option_b", "option_c"],
    "question_3": "用户输入的文本"
  },
  "respondent_id": "uuid-generated-by-frontend"
}
```

后端逻辑（**正式提交**）：
1. 校验问卷状态为 `published`。
2. 校验 `respondent_id` 是否已提交过（查 `survey_responses` 表）。
3. 校验必填题是否都已回答。
4. 校验答案格式是否符合题目类型要求。
5. 写入数据库，返回成功。

后端逻辑（**预览提交**，`?preview=1`）：
1. 校验当前用户已登录（管理员身份）。
2. 校验问卷存在（不限状态）。
3. 校验必填题是否都已回答。
4. 校验答案格式是否符合题目类型要求。
5. **不写入数据库**，直接返回成功响应。
6. 前端收到成功响应后展示感谢页面，数据不保留。

## 6. 功能模块

### 6.1 MVP 功能（第一阶段）

- [ ] 问卷 CRUD（创建、编辑、删除）
- [ ] 题型：单选、多选、填空、评分
- [ ] 问卷发布/下线
- [ ] 公开填写页
- [ ] 基础数据列表查看
- [ ] CSV 导出

### 6.2 完善功能（第二阶段）

- [ ] 题型：下拉选择、日期、矩阵题
- [ ] 问卷逻辑跳转（如选 A 才显示第 3 题）
- [ ] 数据可视化图表（Recharts）
- [ ] Excel 导出（SheetJS）
- [ ] 问卷过期时间控制
- [ ] 填写页动画优化

### 6.3 进阶功能（后续迭代）

- [ ] 问卷模板预设
- [ ] 文本题词云分析
- [ ] 分页问卷
- [ ] 实时统计大屏

## 7. 非功能需求

### 7.1 性能

- SQLite 单文件部署，适合低至中等并发（自用场景足够）。
- Next.js 静态生成/服务端渲染结合，首屏加载快。
- 图表和数据表格采用分页加载，避免一次性渲染大量数据。

### 7.2 安全

- 管理端接口使用 `iron-session` 做 Cookie-based 会话认证。
- 公开填写接口做简单的速率限制（如每 IP 每分钟最多 10 次提交）。
- 用户输入（问卷标题、题目文本、答案）做 XSS 过滤。
- SQLite 查询使用参数化查询（Drizzle ORM 自动处理）。

### 7.3 部署

- 单容器/单进程部署，无需额外数据库服务。
- SQLite 数据文件持久化到磁盘或挂载卷。
- 支持 `npm run build` 后 `npm start` 启动生产服务。

## 8. 风险与依赖

| 风险 | 缓解措施 |
|------|----------|
| SQLite 并发写入性能瓶颈 | 自用场景并发低，若后续并发增高可迁移至 PostgreSQL |
| 问卷星交互复杂度超预期 | MVP 先实现点击添加+内联编辑，拖拽排序作为第二阶段 |
| 图表库体积过大 | Recharts 支持按需引入，仅使用需要的图表组件 |

## 9. 验收标准

- [ ] 能完整创建、编辑、发布一份包含单选/多选/填空/评分的问卷
- [ ] 能通过公开链接填写问卷并提交
- [ ] 同一设备/浏览器无法重复提交
- [ ] 后台能查看回收数据列表和基础统计
- [ ] 能导出 CSV 文件
- [ ] 管理端需要登录才能访问
