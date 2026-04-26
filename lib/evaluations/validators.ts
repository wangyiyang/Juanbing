import { z } from "zod";

export const evaluationCycleInputSchema = z.object({
  title: z.string().trim().min(1, "项目名称不能为空"),
  description: z.string().trim().optional().nullable(),
  surveyId: z.number().int().positive(),
  startsAt: z.number().int().nullable().optional(),
  endsAt: z.number().int().nullable().optional(),
  anonymityThreshold: z.number().int().min(2).max(10).optional(),
});

export const evaluationAssignmentInputSchema = z.object({
  subjectId: z.number().int().positive(),
  raterEmployeeId: z.number().int().positive().nullable(),
  relationship: z.enum(["self", "manager", "peer", "direct_report", "other"]),
});
