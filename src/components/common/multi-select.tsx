import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  creatable?: boolean;
  onCreate?: (label: string) => void | Promise<void>;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  emptyText = "No results.",
  creatable = false,
  onCreate,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const remove = (value: string) => onChange(selected.filter((v) => v !== value));

  const exactMatch = options.some((o) => o.label.toLowerCase() === search.trim().toLowerCase());
  const showCreate = creatable && search.trim().length > 0 && !exactMatch;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate text-muted-foreground">
              {selected.length > 0 ? `${selected.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={true}>
            <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                {showCreate ? (
                  <button
                    className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={async () => {
                      await onCreate?.(search.trim());
                      setSearch("");
                    }}
                  >
                    Create "{search.trim()}"
                  </button>
                ) : (
                  emptyText
                )}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem key={option.value} value={option.label} onSelect={() => toggle(option.value)}>
                    <Check className={cn("mr-2 h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
                {showCreate && (
                  <CommandItem
                    value={`__create__${search}`}
                    onSelect={async () => {
                      await onCreate?.(search.trim());
                      setSearch("");
                    }}
                  >
                    Create "{search.trim()}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => {
            const opt = options.find((o) => o.value === value);
            if (!opt) return null;
            return (
              <Badge key={value} variant="secondary" className="gap-1 pr-1">
                {opt.label}
                <button onClick={() => remove(value)} className="rounded-full hover:bg-black/10">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
