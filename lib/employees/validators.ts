import { z } from "zod";

const optionalTrimmedString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().optional().nullable(),
);

export const employeeInputSchema = z.object({
  employeeNo: optionalTrimmedString,
  name: z.string().trim().min(1, "员工姓名不能为空"),
  email: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().email("邮箱格式错误").optional().nullable(),
  ),
  department: optionalTrimmedString,
  title: optionalTrimmedString,
  managerId: z.number().int().positive().optional().nullable(),
});
