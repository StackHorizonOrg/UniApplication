"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AcademicYearPickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

function generateAcademicYears(count = 10): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = -2; i < count; i++) {
    const startYear = currentYear + i;
    const endYear = startYear + 1;
    years.push(`${startYear}/${endYear}`);
  }
  return years;
}

export function AcademicYearPicker({
  value,
  onChange,
  className,
  id,
}: AcademicYearPickerProps) {
  const [open, setOpen] = useState(false);
  const academicYears = generateAcademicYears();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 bg-background border-border",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value || "Seleziona anno accademico..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 bg-card border-border rounded-lg shadow-lg">
          <div className="mb-2 px-2">
            <h4 className="text-sm font-medium text-card-foreground">
              Anno Accademico
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seleziona l'anno di riferimento
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2">
            {academicYears.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  onChange(year);
                  setOpen(false);
                }}
                className={cn(
                  "px-3 py-2 text-sm rounded-md transition-all font-medium",
                  value === year
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-card-foreground hover:bg-accent border border-border",
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
