import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { RelationshipRule } from "@/lib/evaluations/template-types";

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: "自评",
  manager: "直属经理",
  peer: "同级",
  direct_report: "下属",
  other: "其他",
};

interface RelationshipRuleBuilderProps {
  rules: RelationshipRule[];
  onChange: (rules: RelationshipRule[]) => void;
}

export function RelationshipRuleBuilder({ rules, onChange }: RelationshipRuleBuilderProps) {
  const updateRule = (index: number, patch: Partial<RelationshipRule>) => {
    const next = rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <Label>评价关系规则</Label>
      {rules.map((rule, index) => (
        <div key={rule.type} className="flex items-center gap-4 rounded border p-3">
          <span className="w-20 font-medium">{RELATIONSHIP_LABELS[rule.type]}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => updateRule(index, { count: Math.max(0, rule.count - 1) })}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center">{rule.count}</span>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => updateRule(index, { count: Math.min(50, rule.count + 1) })}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`required-${rule.type}`}
              checked={rule.required}
              onCheckedChange={(checked) => updateRule(index, { required: !!checked })}
            />
            <Label htmlFor={`required-${rule.type}`} className="text-sm font-normal">
              必填
            </Label>
          </div>
        </div>
      ))}
    </div>
  );
}
