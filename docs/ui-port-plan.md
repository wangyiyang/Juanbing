# UI 优化移植清单（原 PR #3）

> 原 PR #3 (`feature/ui-optimization`) 已关闭。以下列出其中有价值的 UI 改进点，供 `feature/dropdown-date-expiration` 合并到 `master` 后，在新建的 `feature/ui-polish` 分支中手动移植。

---

## 1. 全局品牌与布局

### 1.1 页面标题
- **文件**: `app/layout.tsx`
- **改动**: `title` 从 `"Juanbing 问卷平台"` 改为 `"卷饼问卷平台"`

### 1.2 首页 Hero 区域
- **文件**: `app/page.tsx`
- **改动**:
  - 添加渐变背景 `bg-gradient-to-br from-slate-50 to-slate-100`
  - 顶部 Header：Logo（渐变方块 + ClipboardList 图标）+ 品牌名"卷饼" + 副标题
  - Hero 区域：大 Logo + 标题 + 描述 + 渐变 CTA 按钮
  - 特性卡片网格（4 列）：创建问卷 / 分享链接 / 收集数据 / 分析结果，带图标和 hover 上浮动画
  - Footer：品牌信息 + 作者名

### 1.3 管理后台布局
- **文件**: `components/layout/admin-shell.tsx`
- **改动**:
  - 添加渐变背景
  - 顶部固定 Header：Logo + 导航链接（首页 / 问卷管理）
  - 页面标题区增加面包屑式小字"问卷管理"
  - **注意**: `feature/dropdown-date-expiration` 中此文件可能有变化，需以当前代码为准融合

---

## 2. 认证与公共页面

### 2.1 登录页
- **文件**: `app/login/page.tsx`
- **改动**:
  - 渐变背景
  - 卡片增加阴影 `shadow-lg` 和细边框
  - 顶部添加 Logo 图标（渐变方块 + ClipboardList）
  - 添加副标题"登录后管理问卷和数据"
  - 输入框增加 placeholder
  - 提交按钮改为渐变色 `from-indigo-500 to-violet-600` + LogIn 图标

### 2.2 感谢页
- **文件**: `app/surveys/[id]/fill/thank-you/page.tsx`
- **改动**:
  - 渐变背景
  - 添加成功图标（绿色圆形背景 + CheckCircle）
  - 标题和描述增加颜色层次

---

## 3. 问卷填写流程

### 3.1 填写页布局
- **文件**: `app/surveys/[id]/fill/page.tsx`
- **改动**:
  - 渐变背景
  - 顶部 Header：Logo + "卷饼问卷" + 预览模式标签（ amber 色）
  - 问卷标题和描述用白色卡片包裹（rounded-xl + shadow-sm）
  - **注意**: 需保留 `expiresAt` 过期提示（`feature/dropdown-date-expiration` 已添加）

### 3.2 填写表单
- **文件**: `components/survey-fill/survey-fill-form.tsx`
- **改动**:
  - **Sticky 进度条**：固定在顶部，显示"填写进度 X / Y" + Progress 组件
  - 问题卡片增加 `hover:shadow-sm` 和细边框
  - 题目序号：圆形 indigo 背景编号（`bg-indigo-50` + `text-indigo-600`）
  - 提交按钮：渐变 + Send 图标 + 全宽 + 加高 `py-6`
  - 错误提示：红色边框卡片样式
  - **依赖**: 需要新增 `components/ui/progress.tsx` 组件

### 3.3 问题字段渲染
- **文件**: `components/survey-fill/question-field.tsx`
- **改动**:
  - **Textarea**: 增加 `min-h-[100px] resize-none` 和 placeholder
  - **评分题**: 从数字按钮改为 Star 图标（lucide），支持 fill 状态（amber-400），hover 放大动画
  - **单选/多选**: 选项改为可点击卡片样式（rounded-lg + hover:bg-slate-50 + border），radio/checkbox 使用 `accent-indigo-500`
  - **注意**: `dropdown` 和 `date` 的渲染实现请以 `feature/dropdown-date-expiration` 为准，**仅移植样式优化**（如 select 的 focus ring、date input 的样式）

---

## 4. 问卷编辑器

### 4.1 题型面板
- **文件**: `components/survey-editor/component-palette.tsx`
- **改动**:
  - 每个题型添加 lucide 图标：`CircleDot` / `CheckSquare` / `AlignLeft` / `Star`
  - 按钮改为左对齐布局（`justify-start gap-2`）
  - Hover 效果：`hover:bg-indigo-50 hover:text-indigo-600`
  - 面板标题增加颜色和字号细化
  - **注意**: `feature/dropdown-date-expiration` 已添加 `dropdown` 和 `date` 类型，图标映射需同步扩展（`List` / `Calendar`）

### 4.2 编辑器外壳
- **文件**: `components/survey-editor/editor-shell.tsx`
- **改动**:
  - **顶部 Header**：左侧 Logo + 问卷标题 + 问题数；右侧 预览/分享/保存按钮
  - 布局从 `grid` 改为 `flex` 三栏（左面板 | 分隔线 | 中间编辑区 | 分隔线 | 右属性面板）
  - 中间编辑区增加 `bg-slate-50/50` 背景，内容 max-w-2xl 居中
  - 问卷标题和描述输入框分开，标题加大字号 `text-lg font-semibold`
  - 添加分享对话框（同 survey-list 中的实现）
  - **注意**: 需保留 `expiresAt` 输入控件（`feature/dropdown-date-expiration` 已添加）

### 4.3 问题卡片
- **文件**: `components/survey-editor/question-card.tsx`
- **改动**:
  - 添加题型图标（映射表 `TYPE_ICONS`）和类型标签（`TYPE_LABELS`）
  - 问题序号（`index + 1`）
  - 选中态改为 indigo 主题：`border-indigo-300` + `ring-1 ring-indigo-100`
  - 添加删除按钮（Trash2 图标，hover 显示）
  - 必填标签改为 amber 配色
  - 标题增加 `truncate` 和默认文字"未命名问题"
  - **注意**: 图标和标签映射需包含 `date` 类型（`Calendar` 图标）

### 4.4 问题列表
- **文件**: `components/survey-editor/question-list.tsx`
- **改动**: 传递 `index` 和 `onDelete` 回调给 QuestionCard

### 4.5 编辑器状态
- **文件**: `lib/surveys/editor-state.ts`
- **改动**: 添加 `deleteQuestion` action（过滤 + 重新排序 + 更新选中态）

---

## 5. 问卷列表

### 5.1 列表组件（重点）
- **文件**: `components/surveys/survey-list.tsx`
- **改动**:
  - **Table → Card 网格布局**：`grid gap-4 md:grid-cols-2 lg:grid-cols-3`
  - **卡片内容**：标题（truncate + hover 变 indigo）+ 状态标签 + 描述 + 创建/更新时间
  - **操作按钮网格**（4 列）：编辑 / 分享 / 结果 / 删除
  - **状态切换按钮**：发布/关闭/重新发布（带 Eye/EyeOff 图标）
  - **分享对话框**：复制链接到剪贴板（含降级方案）
  - **删除确认**：AlertDialog，提示删除将同时删除所有数据
  - **空状态**：引导卡片（图标 + 文案 + 创建按钮）
  - **状态标签映射**：draft(草稿/灰) / published(已发布/绿) / closed(已关闭/黄)
  - **注意**: **必须保留 `expiresAt` 过期日期显示**（`feature/dropdown-date-expiration` 已添加在 Badge 下方），移植时融合到 Card 布局中

---

## 6. 结果分析页

### 6.1 统计概览
- **文件**: `components/survey-results/results-overview.tsx`
- **改动**:
  - 卡片增加图标（indigo/amber 圆形背景 + lucide 图标）
  - 标题改为小字灰色，数值大字加粗
  - 增加辅助说明文字（"份有效答卷"/"每份问卷平均耗时"）
  - 时长格式化：分+秒显示

### 6.2 趋势图表
- **文件**: `components/survey-results/trend-chart.tsx`
- **改动**:
  - 添加图表标题区（TrendingUp 图标 + "回收趋势"）
  - 线条颜色从 `#0f172a` 改为 `#6366f1`（indigo）
  - 卡片增加 shadow-sm 和细边框

---

## 7. 通用 UI 组件

### 7.1 Progress 进度条
- **文件**: `components/ui/progress.tsx`（新增）
- **来源**: 基于 `@base-ui/react/progress`
- **导出**: `Progress`, `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue`
- **用途**: 问卷填写页 Sticky 进度条

---

## 8. 其他微改动

| 文件 | 改动 | 优先级 |
|---|---|---|
| `app/surveys/page.tsx` | 新建按钮改为渐变色 | 低 |
| `README.md` | 添加作者信息 | 低 |
| `tests/app/home-page.test.tsx` | 标题文本同步更新 | 低 |

---

## 移植注意事项（与功能分支融合）

1. **`survey-list.tsx`**: Card 布局移植时，**务必保留 `expiresAt` 显示**。当前 `feature/dropdown-date-expiration` 的实现是在 Badge 下方用 `text-xs text-slate-500` 显示到期日期，移植时应将此信息融入 Card 的 Header 或 Content 区域。

2. **`editor-shell.tsx`**: 移植顶部 Header 和 flex 布局时，**保留 `expiresAt` 的 Input 或 DatePicker 控件**。当前实现是在保存逻辑中传递 `expiresAt`，在描述 Textarea 下方（或旁边）有一个日期选择器。

3. **`question-field.tsx`**: PR #3 中添加了 `dropdown` 和 `date` 的渲染，但 `feature/dropdown-date-expiration` 分支的实现更完整（包含测试和 validator）。**应以功能分支为准，仅移植样式层面的改进**（Star 图标、选项卡片样式、textarea 最小高度等）。

4. **`component-palette.tsx` 与 `question-card.tsx`**: 图标映射表需要扩展，包含 `date` 类型（建议使用 `Calendar` 图标）。

5. **渐变主色**: PR #3 使用 `from-indigo-500 to-violet-600` 作为品牌渐变色，统一应用于 Logo、按钮、Header 装饰等元素。移植时保持一致。
