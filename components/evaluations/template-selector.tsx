import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EvaluationTemplate } from "@/lib/evaluations/template-types";

interface TemplateSelectorProps {
  value?: number;
  onChange: (template: EvaluationTemplate | null) => void;
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);

  useEffect(() => {
    fetch("/api/evaluation-templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data.data ?? []));
  }, []);

  const handleChange = (id: string) => {
    const template = templates.find((t) => t.id === Number(id));
    onChange(template ?? null);
  };

  const builtin = templates.filter((t) => t.isBuiltin);
  const custom = templates.filter((t) => !t.isBuiltin);

  return (
    <Select value={value?.toString()} onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择模板（可选）" />
      </SelectTrigger>
      <SelectContent>
        {builtin.length > 0 && (
          <SelectGroup>
            <SelectLabel>系统模板</SelectLabel>
            {builtin.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {custom.length > 0 && (
          <SelectGroup>
            <SelectLabel>我的模板</SelectLabel>
            {custom.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
