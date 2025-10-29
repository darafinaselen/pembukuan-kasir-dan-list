import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ defaultValue, className, children }) {
  const [active, setActive] = React.useState(defaultValue);
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) => {
        if (child.type.displayName === "TabsList") {
          return React.cloneElement(child, { active, setActive });
        }
        if (child.type.displayName === "TabsContent") {
          return child.props.value === active ? child : null;
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, active, setActive, className }) {
  return (
    <div className={cn("flex gap-2 bg-gray-100 rounded-lg p-1", className)}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { active, setActive })
      )}
    </div>
  );
}
TabsList.displayName = "TabsList";

export function TabsTrigger({ value, children, active, setActive, className }) {
  return (
    <button
      type="button"
      className={cn(
        "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition",
        active === value ? "bg-white shadow text-teal-600" : "text-gray-500",
        className
      )}
      onClick={() => setActive(value)}
    >
      {children}
    </button>
  );
}
TabsTrigger.displayName = "TabsTrigger";

export function TabsContent({ value, children, className }) {
  return <div className={cn("mt-2", className)}>{children}</div>;
}
TabsContent.displayName = "TabsContent";
