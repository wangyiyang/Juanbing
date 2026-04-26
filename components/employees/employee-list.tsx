"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { EmployeeImportDialog } from "@/components/employees/employee-import-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, X, Users, Edit2, UserX, Plus, Upload } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "在职", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  inactive: { label: "停用", color: "text-slate-600 bg-slate-100 border-slate-200" },
};

export function EmployeeList({
  employees,
}: {
  employees: Array<{
    id: number;
    employeeNo?: string | null;
    name: string;
    email?: string | null;
    department?: string | null;
    title?: string | null;
    status: string;
  }>;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<typeof employees[0] | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (filterStatus) params.set("status", filterStatus);
    router.push(`/employees?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("");
    router.push("/employees");
  };

  const handleDeactivate = async (id: number) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("停用失败");
      toast.success("员工已停用");
      router.refresh();
    } catch {
      toast.error("停用失败，请重试");
    }
  };

  const openEdit = (employee: typeof employees[0]) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="搜索姓名、邮箱、编号、部门..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="active">在职</option>
            <option value="inactive">停用</option>
          </select>
          <Button size="sm" onClick={handleSearch}>
            <Search className="mr-1 h-4 w-4" />
            搜索
          </Button>
          {(searchQuery || filterStatus) && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              清除
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="mr-1 h-4 w-4" />
            批量导入
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-500 to-violet-600"
            onClick={openCreate}
          >
            <Plus className="mr-1 h-4 w-4" />
            新建员工
          </Button>
        </div>
        <p className="text-sm text-slate-500">共 {employees.length} 位员工</p>
      </div>

      {employees.length === 0 ? (
        <Card className="border-dashed border-2 bg-white/50">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-slate-700">
              还没有员工
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              点击右上角按钮添加第一位员工
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>编号</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>岗位</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const statusInfo = STATUS_MAP[employee.status] ?? STATUS_MAP.active;
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.employeeNo ?? "—"}</TableCell>
                      <TableCell>{employee.email ?? "—"}</TableCell>
                      <TableCell>{employee.department ?? "—"}</TableCell>
                      <TableCell>{employee.title ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color} variant="outline">
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(employee)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {employee.status === "active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeactivate(employee.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editingEmployee}
      />
      <EmployeeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </>
  );
}


