/**
 * Letter-template picker — renders a Select when GET /letter-templates
 * succeeds, falls back to a UUID Input + helper hint when the endpoint
 * isn't (yet) available. Controlled component: pass `value` + `onChange`.
 *
 * The backend doesn't expose /letter-templates today (templates are
 * managed via the admin harness). When that endpoint lands the UI lights
 * up automatically — no change needed here.
 */
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLetterTemplates } from "@/lib/queries";

type Props = {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  disabled?: boolean;
};

export function TemplateSelect({ value, onChange, id = "template", disabled }: Props) {
  const { data, isLoading, isError } = useLetterTemplates();

  const hasTemplates = !isError && Array.isArray(data) && data.length > 0;

  if (hasTemplates) {
    return (
      <div>
        <Label htmlFor={id}>Template</Label>
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={isLoading ? "Loading…" : "Select a template"} />
          </SelectTrigger>
          <SelectContent>
            {data!.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Fallback: backend has no /letter-templates list endpoint, so accept a
  // UUID directly. Surfaces the constraint without blocking the flow.
  return (
    <div>
      <Label htmlFor={id}>Template ID</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="00000000-0000-0000-0000-000000000000"
        disabled={disabled}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {isLoading
          ? "Loading templates…"
          : isError
            ? "Template list unavailable — paste a template UUID from the admin panel."
            : "No templates available — paste a template UUID from the admin panel."}
      </p>
    </div>
  );
}
