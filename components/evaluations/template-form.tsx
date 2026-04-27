import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnonymityThresholdField } from "./anonymity-threshold-field";
import { RelationshipRuleBuilder } from "./relationship-rule-builder";
import type { EvaluationTemplate, RelationshipRule, TimeRule } from "@/lib/evaluations/template-types";

const DEFAULT_RULES: RelationshipRule[] = [
  { type: "self", count: 1, required: true },
  { type: "manager", count: 1, required: true },
  { type: "peer", count: 2, required: false },
  { type: "direct_report", count: 3, required: false },
];

interface TemplateFormProps {
  initial?: EvaluationTemplate | null;
  onSubmit: (data: {
    name: string;
    description: string | null;
    surveyId: number;
    anonymityThreshold: number;
    relationshipRules: RelationshipRule[];
    timeRule: TimeRule;
  }) => void;
  loading?: boolean;
}

export function TemplateForm({ initial, onSubmit, loading }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [surveyId, setSurveyId] = useState(initial?.surveyId ?? 0);
  const [anonymityThreshold, setAnonymityThreshold] = useState(
    initial?.anonymityThreshold ?? 3
  );
  const [relationshipRules, setRelationshipRules] = useState<RelationshipRule[]>(
    initial?.relationshipRules ?? DEFAULT_RULES
  );
  const [durationDays, setDurationDays] = useState(
    initial?.timeRule?.durationDays ?? 14
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || null,
      surveyId,
      anonymityThreshold,
      relationshipRules,
      timeRule: { type: "relative", durationDays },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">模板名称</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">说明</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="survey-id">绑定问卷 ID</Label>
        <Input
          id="survey-id"
          type="number"
          value={surveyId || ""}
          onChange={(e) => setSurveyId(Number(e.target.value))}
          required
        />
      </div>
      <AnonymityThresholdField value={anonymityThreshold} onChange={setAnonymityThreshold} />
      <RelationshipRuleBuilder rules={relationshipRules} onChange={setRelationshipRules} />
      <div className="space-y-2">
        <Label htmlFor="duration">默认持续天数</Label>
        <Input
          id="duration"
          type="number"
          min={1}
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value))}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : initial ? "更新模板" : "创建模板"}
      </Button>
    </form>
  );
}
