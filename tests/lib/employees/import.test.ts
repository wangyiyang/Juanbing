import { describe, expect, it, beforeEach } from "vitest";

import { db } from "@/lib/db/client";
import { employees } from "@/lib/db/schema";
import { parseEmployeeCsv, importEmployees } from "@/lib/employees/import";

describe("parseEmployeeCsv", () => {
  it("parses valid CSV with headers", () => {
    const csv = `name,email,department,title
张三,zhangsan@example.com,研发部,工程师`;
    const result = parseEmployeeCsv(csv);
    expect(result.error).toBeUndefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("张三");
  });

  it("handles BOM prefix", () => {
    const csv = "\uFEFFname,email\n张三,zhangsan@example.com";
    const result = parseEmployeeCsv(csv);
    expect(result.error).toBeUndefined();
    expect(result.rows).toHaveLength(1);
  });

  it("returns error for invalid CSV", () => {
    const result = parseEmployeeCsv("");
    expect(result.rows).toHaveLength(0);
  });
});

describe("importEmployees", () => {
  beforeEach(() => {
    db.delete(employees).run();
  });

  it("imports employees successfully", async () => {
    const rows = [
      { name: "张三", email: "zhangsan@example.com", department: "研发部", title: "工程师", manager_email: "", employee_no: "E001" },
      { name: "李四", email: "lisi@example.com", department: "研发部", title: "主管", manager_email: "zhangsan@example.com", employee_no: "E002" },
    ];

    const result = await importEmployees(rows);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.importedIds).toHaveLength(2);
  });

  it("skips duplicate emails", async () => {
    const rows = [
      { name: "张三", email: "zhangsan@example.com", department: "研发部", title: "工程师", manager_email: "", employee_no: "E001" },
      { name: "张三2", email: "zhangsan@example.com", department: "产品部", title: "产品", manager_email: "", employee_no: "E002" },
    ];

    const result = await importEmployees(rows);
    expect(result.success).toBe(1);
    expect(result.failed).toBe(1);
  });

  it("skips rows without name", async () => {
    const rows = [
      { name: "", email: "test@example.com", department: "", title: "", manager_email: "", employee_no: "" },
    ];

    const result = await importEmployees(rows);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(1);
  });

  it("links manager by email", async () => {
    const rows = [
      { name: "主管", email: "manager@example.com", department: "研发部", title: "主管", manager_email: "", employee_no: "M001" },
      { name: "员工", email: "staff@example.com", department: "研发部", title: "工程师", manager_email: "manager@example.com", employee_no: "S001" },
    ];

    const result = await importEmployees(rows);
    expect(result.success).toBe(2);

    const all = db.select().from(employees).all();
    const staff = all.find((e) => e.email === "staff@example.com");
    const manager = all.find((e) => e.email === "manager@example.com");
    expect(staff?.managerId).toBe(manager?.id);
  });
});
