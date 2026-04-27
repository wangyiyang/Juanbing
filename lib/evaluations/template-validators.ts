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
