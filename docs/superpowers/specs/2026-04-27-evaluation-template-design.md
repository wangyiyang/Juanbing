# 360 环评模板系统设计文档

## 目的

将 360 环评从「每次手动配置」升级为「基于模板一键发起」，降低使用门槛，统一组织评价标准，解决当前系统"太 demo"、缺乏运营闭环的问题。

## 背景

当前 360 环评每次创建周期时，HR/Admin 需要手动完成以下配置：
- 选择问卷
- 填写标题和描述
- 设置匿名阈值
- 配置评价关系规则（自评、经理、同级、下属等）
- 设置起止时间

这些配置在同类评价活动中高度重复，且没有标准可循，导致发起效率低、评价标准不统一。模板系统通过预置配置快照，实现「一键发起」。

## 方案概述

采用**结构化规则模板（方案 B）**：独立 `evaluation_templates` 表存储模板元数据和规则配置，支持系统内置模板和管理员自定义模板，创建周期时可选择模板自动回填所有配置字段。

## 数据模型

### 新增表：`evaluation_templates`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增 ID |
| `name` | TEXT | NOT NULL | 模板名称，如"季度员工 360" |
| `description` | TEXT | | 模板说明 |
| `survey_id` | INTEGER | NOT NULL → surveys(id) ON DELETE RESTRICT | 绑定的问卷 |
| `anonymity_threshold` | INTEGER | DEFAULT 3 NOT NULL | 匿名阈值 |
| `relationship_rules` | TEXT | NOT NULL (JSON) | 评价关系规则数组 |
| `time_rule` | TEXT | NOT NULL (JSON) | 时间规则 |
| `is_builtin` | INTEGER | DEFAULT 0 NOT NULL | 1=系统内置，0=用户自定义 |
| `created_by` | INTEGER | → users(id) ON DELETE SET NULL | 自定义模板的创建人，系统模板为 NULL |
| `status` | TEXT | DEFAULT 'active' NOT NULL | active / archived |
| `created_at` | INTEGER | DEFAULT (unixepoch()) NOT NULL | |
| `updated_at` | INTEGER | DEFAULT (unixepoch()) NOT NULL | |

### `relationship_rules` JSON 结构

```json
[
  { "type": "self", "count": 1, "required": true },
  { "type": "manager", "count": 1, "required": true },
  { "type": "peer", "count": 2, "required": false },
  { "type": "direct_report", "count": 3, "required": false }
]
```

- `type` 枚举值：self / manager / peer / direct_report / other
- `count`：该关系类型下期望的评价人数
- `required`：是否为必填项（影响批量分配时的行为）

### `time_rule` JSON 结构（V1）

```json
{ "type": "relative", "duration_days": 14 }
```

- `type` 当前仅支持 `relative`，未来可扩展 `fixed`
- `duration_days`：周期默认持续天数，从表单打开当天起算（HR 可手动覆盖）

### 现有表改动

**`evaluation_cycles` 表**

新增字段：

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `template_id` | INTEGER | → evaluation_templates(id) ON DELETE SET NULL | 记录基于哪个模板创建，用于溯源 |

## 用户流程

### 使用模板创建周期

1. HR 进入「360 管理」→ 点击「新建周期」
2. 页面顶部出现「使用模板」下拉框（可选）
   - 下拉选项按 `is_builtin DESC, updated_at DESC` 排序
   - 系统内置模板带「系统」标签
   - 用户自定义模板带创建人姓名
3. 选择模板后，表单自动回填：
   - 标题：模板名称 + 时间后缀（如"季度员工 360（2026 Q2）"）
   - 问卷：模板绑定的问卷
   - 匿名阈值：模板预设值
   - 起止时间：根据 `time_rule` 自动计算（今天起 + duration_days）
   - 关系规则：可视化展示在表单中（只读预览，创建周期后执行批量分配）
4. HR 可手动调整任何字段（模板是快照，不是绑定）
5. 保存后周期进入 `draft` 状态，可立即「批量生成评价关系」

### 管理模板

1. 新增「模板管理」页面，作为「360 管理」的子入口
2. 列表展示所有 `status = active` 的模板
3. 操作：
   - **新建模板**：进入模板编辑表单
   - **编辑模板**：修改现有自定义模板（系统模板不可编辑，但可克隆）
   - **克隆模板**：基于任意模板创建副本，名称自动加"副本"
   - **归档模板**：软删除（status → archived）
4. 模板表单字段与创建周期表单类似，但不包含「主题」「起止时间」

## API 设计

### 模板管理接口

| 方法 | 路由 | 功能 | 权限 |
|---|---|---|---|
| GET | `/api/evaluation-templates` | 模板列表，支持 `?builtin=true/false` 筛选 | Admin |
| POST | `/api/evaluation-templates` | 新建模板 | Admin |
| GET | `/api/evaluation-templates/[id]` | 模板详情 | Admin |
| PUT | `/api/evaluation-templates/[id]` | 编辑模板（仅限非系统模板） | Admin |
| POST | `/api/evaluation-templates/[id]/clone` | 克隆模板 | Admin |
| DELETE | `/api/evaluation-templates/[id]` | 归档模板 | Admin |

### 周期创建接口增强

`POST /api/evaluations` 请求体新增可选字段：

```json
{
  "template_id": 1,
  "title": "季度员工 360（2026 Q2）",
  "survey_id": 2,
  "anonymity_threshold": 3,
  "starts_at": "2026-04-27",
  "ends_at": "2026-05-11"
}
```

如果提供了 `template_id`，后端校验模板存在且 active，将模板字段作为默认值，请求体中的其他字段可覆盖模板值。

## 页面与组件

### 新增页面

| 页面 | 路径 | 说明 |
|---|---|---|
| 模板列表 | `/evaluations/templates` | 表格展示，支持搜索/筛选 |
| 新建模板 | `/evaluations/templates/new` | 模板编辑表单 |
| 编辑模板 | `/evaluations/templates/[id]/edit` | 模板编辑表单 |

### 现有页面改动

| 页面 | 改动 |
|---|---|
| `/evaluations/new` | 顶部新增 `TemplateSelector` 组件，选模板后自动回填表单字段 |
| `/evaluations/[id]` | 如果 `template_id` 存在，在页面头部显示「基于模板：XXX」溯源标签 |
| `/evaluations` | 可选：列表中增加「模板来源」列 |

### 新增/复用组件

- `TemplateSelector`：模板下拉选择器，按系统/自定义分组展示
- `TemplateForm`：模板编辑表单（复用周期创建表单的基础字段）
- `RelationshipRulePreview`：关系规则只读预览组件（在行创建周期页展示模板中的规则）
- `AnonymityThresholdField`：匿名阈值输入框 + 说明文案（复用到周期和模板表单）

## 匿名阈值说明文案

在「创建周期」和「模板编辑」表单的 `anonymity_threshold` 字段旁，显示辅助说明：

> 「匿名阈值用于保护评价者身份。当某个关系组（同级/下属/其他）的实际回收份数低于此数值时，该组的评分和评语将自动隐藏。自评和直属经理评价不受此限制，始终展示。」

## 系统内置模板（初始数据）

| 名称 | 问卷 | 阈值 | 关系规则 | 时间规则 |
|---|---|---|---|---|
| 季度员工 360 | 默认 360 问卷 | 3 | 自评×1, 经理×1, 同级×2, 下属×3 | 14 天 |
| 年度管理层 360 | 领导力 360 问卷 | 5 | 自评×1, 经理×1, 同级×3, 下属×5 | 21 天 |

> 注：系统内置模板通过 migration seed 或初始化脚本写入，字段 `is_builtin = 1, created_by = NULL`。若系统不存在对应问卷，首批内置模板可只创建元数据、问卷字段留空，由 Admin 首次使用时手动绑定；或在初始化脚本中同时创建默认问卷。

## 安全与权限

- 模板管理仅限 Admin 角色访问
- 系统内置模板（`is_builtin = 1`）不可编辑、不可删除，仅可克隆
- 自定义模板只能由创建者或 Admin 编辑/归档
- 归档后的模板不在下拉选择器中展示
- 周期创建时传入的 `template_id` 后端校验存在性、active 状态、可见性

## 测试要点

1. **API 测试**：模板 CRUD、克隆、归档、基于模板创建周期的字段回填逻辑
2. **UI 测试**：模板选择器回填、表单覆盖、系统模板禁用编辑
3. **边界测试**：使用 archived 模板创建周期（应失败）、编辑系统模板（应失败）、匿名阈值范围校验（≥1）
4. **E2E 测试**：基于模板一键发起完整 360 周期并走完评价流程

## 影响与风险

| 影响点 | 说明 |
|---|---|
| 数据库 | 新增 1 张表，现有表新增 1 个字段，需写 migration |
| 现有功能 | 周期创建接口新增可选字段，向后兼容；不选模板时行为不变 |
| 权限模型 | 依赖现有 Admin 角色判断，无新增角色 |
| 性能 | 模板数据量极小（通常 < 100 条），无性能风险 |

## 验收标准

- [ ] Admin 可以在「模板管理」页面新建、编辑、克隆、归档模板
- [ ] 创建 360 周期时，可以通过下拉框选择模板，表单自动回填所有配置
- [ ] 选择模板后仍可手动修改任何字段
- [ ] 系统内置模板不可编辑，但可克隆为自定义模板
- [ ] 周期详情页显示基于哪个模板创建（如有）
- [ ] 匿名阈值字段旁有说明文案
- [ ] 所有现有 360 功能不受模板系统影响（不选模板时行为完全一致）
