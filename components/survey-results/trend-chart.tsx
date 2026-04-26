"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TrendingUp } from "lucide-react";

export function TrendChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50"
        >
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
        <h3 className="text-sm font-medium text-slate-600"
        >回收趋势</h3>
      </div>
      <div className="h-80"
      >
        <ResponsiveContainer height="100%" width="100%"
        >
          <LineChart data={data}
          >
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
