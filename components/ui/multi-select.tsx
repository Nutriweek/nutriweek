"use client";

import * as Checkbox from "@radix-ui/react-checkbox";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";

type MultiSelectOption<T extends string> = {
  value: T;
  label: string;
};

type MultiSelectProps<T extends string> = {
  id: string;
  options: readonly MultiSelectOption<T>[];
  value: readonly T[];
  onValueChange: (value: T[]) => void;
  placeholder: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export default function MultiSelect<T extends string>({
  id,
  options,
  value,
  onValueChange,
  placeholder,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: MultiSelectProps<T>) {
  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);
  const triggerLabel = selectedLabels.length === 0 ? placeholder : selectedLabels.join(", ");

  function toggleValue(optionValue: T, checked: boolean) {
    onValueChange(checked ? [...value, optionValue] : value.filter((valueItem) => valueItem !== optionValue));
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-describedby={ariaDescribedBy}
          data-invalid={ariaInvalid ? "true" : undefined}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 data-[invalid=true]:border-rose-400"
        >
          <span className={selectedLabels.length === 0 ? "truncate text-zinc-500" : "truncate"}>{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl shadow-black/50" align="start" sideOffset={6}>
          <div className="max-h-60 space-y-1 overflow-y-auto" role="group" aria-label={placeholder}>
            {options.map((option) => {
              const isSelected = value.includes(option.value);

              return (
                <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-emerald-500/15 hover:text-emerald-100">
                  <Checkbox.Root
                    checked={isSelected}
                    onCheckedChange={(checked) => toggleValue(option.value, checked === true)}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-600 bg-zinc-900 text-zinc-950 outline-none transition focus:ring-2 focus:ring-emerald-400/50 data-[state=checked]:border-emerald-400 data-[state=checked]:bg-emerald-400"
                  >
                    <Checkbox.Indicator>
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  {option.label}
                </label>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
