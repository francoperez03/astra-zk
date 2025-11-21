"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  max?: number;
  disabled?: boolean;
}

const PRESET_AMOUNTS = [1, 5, 10, 50];

export function AmountInput({ value, onChange, max, disabled }: AmountInputProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="number"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="text-2xl h-14 pr-16"
          min={0}
          step="0.0000001"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          XLM
        </span>
      </div>

      <div className="flex gap-2">
        {PRESET_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => onChange(amount.toString())}
            disabled={disabled || (max !== undefined && amount > max)}
            className="flex-1"
          >
            {amount} XLM
          </Button>
        ))}
        {max !== undefined && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(max.toString())}
            disabled={disabled}
            className="flex-1"
          >
            Max
          </Button>
        )}
      </div>
    </div>
  );
}
