import { beforeEach, describe, expect, it } from "vitest";

import {
  createEmployee,
  deactivateEmployee,
  listEmployees,
  updateEmployee,
} from "@/lib/employees/service";
import { resetDatabase } from "@/tests/helpers/reset-db";

describe("employee service", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("creates and lists active employees", async () => {
    await createEmployee({
      employeeNo: "E001",
      name: "张三",
      email: "zhangsan@example.com",
      department: "研发部",
      title: "工程师",
      managerId: null,
    });

    const employees = await listEmployees();

    expect(employees).toHaveLength(1);
    expect(employees[0]).toMatchObject({
      employeeNo: "E001",
      name: "张三",
      status: "active",
    });
  });

  it("updates employee profile fields", async () => {
    const employee = await createEmployee({
      employeeNo: "E002",
      name: "李四",
      email: "lisi@example.com",
      department: "销售部",
      title: "销售",
      managerId: null,
    });

    const updated = await updateEmployee(employee.id, {
      employeeNo: "E002",
      name: "李四",
      email: "lisi@example.com",
      department: "华东销售部",
      title: "销售经理",
      managerId: null,
    });

    expect(updated.department).toBe("华东销售部");
    expect(updated.title).toBe("销售经理");
  });

  it("deactivates an employee instead of deleting it", async () => {
    const employee = await createEmployee({
      employeeNo: "E003",
      name: "王五",
      email: "wangwu@example.com",
      department: "人力资源部",
      title: "HRBP",
      managerId: null,
    });

    await deactivateEmployee(employee.id);
    const employees = await listEmployees("", "inactive");

    expect(employees[0]?.status).toBe("inactive");
  });
});
