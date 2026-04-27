import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnonymityThresholdFieldProps {
  value: number;
  onChange: (value: number) => void;
}

export function AnonymityThresholdField({ value, onChange }: AnonymityThresholdFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="anonymity-threshold">匿名阈值</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        匿名阈值用于保护评价者身份。当某个关系组（同级/下属/其他）的实际回收份数低于此数值时，该组的评分和评语将自动隐藏。自评和直属经理评价不受此限制，始终展示。
      </p>
      <Input
        id="anonymity-threshold"
        type="number"
        min={1}
        max={20}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
