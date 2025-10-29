import * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({ checked, onCheckedChange, id, className }) {
  return (
    <button
      type="button"
      id={id}
      aria-checked={checked}
      role="switch"
      tabIndex={0}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
        checked ? "bg-teal-600" : "bg-gray-300",
        className
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}
