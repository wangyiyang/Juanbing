"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: number;
    employeeNo?: string | null;
    name: string;
    email?: string | null;
    department?: string | null;
    title?: string | null;
    status: string;
  } | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    employeeNo: "",
    name: "",
    email: "",
    department: "",
    title: "",
  });

  useEffect(() => {
    if (employee) {
      setForm({
        employeeNo: employee.employeeNo ?? "",
        name: employee.name,
        email: employee.email ?? "",
        department: employee.department ?? "",
        title: employee.title ?? "",
      });
    } else {
      setForm({
        employeeNo: "",
        name: "",
        email: "",
        department: "",
        title: "",
      });
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    try {
      const payload = {
        ...form,
        employeeNo: form.employeeNo || null,
        email: form.email || null,
        department: form.department || null,
        title: form.title || null,
        managerId: null,
      };

      if (employee) {
        const response = await fetch(`/api/employees/${employee.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("更新失败");
        toast.success("员工信息已更新");
      } else {
        const response = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("创建失败");
        toast.success("员工已创建");
      }

      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error(employee ? "更新失败，请重试" : "创建失败，请重试");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? "编辑员工" : "新建员工"}</DialogTitle>
          <DialogDescription>
            {employee ? "修改员工档案信息" : "添加一位新员工到系统中"}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">姓名 *</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeNo">员工编号</Label>
            <Input
              id="employeeNo"
              value={form.employeeNo}
              onChange={(e) =>
                setForm((f) => ({ ...f, employeeNo: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">部门</Label>
            <Input
              id="department"
              value={form.department}
              onChange={(e) =>
                setForm((f) => ({ ...f, department: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">岗位</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-gradient-to-r from-indigo-500 to-violet-600"
            >
              {pending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
