import dayjs from "dayjs";
import "dayjs/locale/it";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { it } from "react-day-picker/locale";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

dayjs.locale("it");

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [view, setView] = React.useState<"days" | "months" | "years">("days");

  const [internalDate, setInternalDate] = React.useState<Date>(
    props.month || props.defaultMonth || new Date(),
  );

  React.useEffect(() => {
    if (props.month) {
      setInternalDate(props.month);
    }
  }, [props.month]);

  React.useEffect(() => {
    if (view === "years") {
      const timeoutId = setTimeout(() => {
        const yearButton = document.getElementById(
          `year-${internalDate.getFullYear()}`,
        );
        if (yearButton) {
          yearButton.scrollIntoView({ block: "center", behavior: "auto" });
        }
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [view, internalDate]);

  const handleMonthChange = (date: Date) => {
    setInternalDate(date);
    props.onMonthChange?.(date);
  };

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    const endYear = currentYear + 100;
    return Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => startYear + i,
    );
  }, []);

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      return dayjs(new Date(2000, i, 1)).format("MMMM");
    });
  }, []);

  return (
    <div className={cn("p-3 bg-card", className)}>
      <div className="flex justify-center items-center relative mb-4">
        {view === "days" && (
          <>
            <Button
              variant="outline"
              className="absolute left-0 top-0 h-8 w-8 p-0 bg-transparent z-10 rounded-full"
              onClick={() => {
                const newDate = new Date(internalDate);
                newDate.setMonth(newDate.getMonth() - 1);
                handleMonthChange(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="absolute right-0 top-0 h-8 w-8 p-0 bg-transparent z-10 rounded-full"
              onClick={() => {
                const newDate = new Date(internalDate);
                newDate.setMonth(newDate.getMonth() + 1);
                handleMonthChange(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {view === "years" && (
          <Button
            variant="outline"
            className="absolute left-0 top-0 h-8 w-8 p-0 bg-transparent z-10 rounded-full"
            onClick={() => setView("days")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {view === "months" && (
          <Button
            variant="ghost"
            className="absolute left-0 top-0 h-8 w-auto p-2 text-sm font-normal z-10"
            onClick={() => setView("years")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {internalDate.getFullYear()}
          </Button>
        )}

        <div className="font-medium text-sm">
          {view === "days" && (
            <Button
              variant="ghost"
              className="h-auto py-1 px-2 font-medium capitalize"
              onClick={() => setView("years")}
            >
              {dayjs(internalDate).format("MMMM YYYY")}
            </Button>
          )}
          {view === "years" && "Seleziona Anno"}
          {view === "months" && "Seleziona Mese"}
        </div>
      </div>

      {view === "days" && (
        <DayPicker
          locale={it}
          weekStartsOn={1}
          showOutsideDays={showOutsideDays}
          month={internalDate}
          onMonthChange={handleMonthChange}
          className="p-0"
          classNames={{
            months:
              "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 relative",
            month: "space-y-4",
            month_caption: "hidden",
            nav: "hidden",

            month_grid: "w-full border-collapse space-y-1",
            weekdays: "flex",
            weekday:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            week: "flex w-full mt-2",

            day: cn(
              "h-9 w-9 text-center text-sm p-0 relative",
              "[&:has([aria-selected].day-range-end)]:rounded-r-full",
              "[&:has([aria-selected].day-outside)]:bg-accent/50",
              "[&:has([aria-selected])]:bg-accent",
              "first:[&:has([aria-selected])]:rounded-l-full",
              "last:[&:has([aria-selected])]:rounded-r-full",
              "focus-within:relative focus-within:z-20",
            ),

            day_button: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full",
              "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
            ),

            range_end: "day-range-end",
            range_start: "day-range-start",

            selected: cn(
              "bg-primary text-primary-foreground rounded-full",
              "hover:bg-primary hover:text-primary-foreground",
              "focus:bg-primary focus:text-primary-foreground",
            ),

            today: "bg-accent text-accent-foreground rounded-full",
            outside:
              "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            disabled: "text-muted-foreground opacity-50",
            range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            hidden: "invisible",
            ...classNames,
          }}
          {...props}
        />
      )}

      {view === "years" && (
        <div className="grid grid-cols-4 gap-2 h-[280px] overflow-y-auto p-1 scroll-smooth">
          {years.map((year) => (
            <Button
              key={year}
              id={`year-${year}`}
              variant={
                year === internalDate.getFullYear() ? "default" : "ghost"
              }
              className="h-9 w-full rounded-full"
              onClick={() => {
                const newDate = new Date(internalDate);
                newDate.setFullYear(year);
                setInternalDate(newDate);
                setView("months");
              }}
            >
              {year}
            </Button>
          ))}
        </div>
      )}

      {view === "months" && (
        <div className="grid grid-cols-3 gap-2 py-4">
          {months.map((month, index) => (
            <Button
              key={month}
              variant={index === internalDate.getMonth() ? "default" : "ghost"}
              className="h-9 w-full capitalize rounded-full"
              onClick={() => {
                const newDate = new Date(internalDate);
                newDate.setMonth(index);
                handleMonthChange(newDate);
                setView("days");
              }}
            >
              {month}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
