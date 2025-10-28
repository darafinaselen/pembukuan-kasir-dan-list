import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, color = "teal", className }) {
  const colorMap = {
    teal: "bg-teal-100 text-teal-700",
    indigo: "bg-indigo-100 text-indigo-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
}
