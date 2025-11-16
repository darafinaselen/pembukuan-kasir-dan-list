import { cn } from "@/lib/utils";

function Progress({
  value = 0,
  max = 100,
  className,
  showValue = false,
  indeterminate = false,
  ...props
}) {
  const percentage = Math.min(Math.max(value, 0), max);
  const progressPercentage = (percentage / max) * 100;

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all",
          indeterminate
            ? "animate-pulse"
            : "transition-all duration-300 ease-in-out"
        )}
        style={{
          transform: indeterminate
            ? "translateX(-100%)"
            : `translateX(-${100 - progressPercentage}%)`,
        }}
      />
      {showValue && !indeterminate && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-primary-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

export { Progress };