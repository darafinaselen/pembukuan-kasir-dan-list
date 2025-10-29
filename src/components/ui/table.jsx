"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Table({ children, className, ...props }) {
  return (
    <div className={cn("w-full overflow-auto", className)} {...props}>
      <table className="w-full caption-bottom text-sm" aria-hidden="false">
        {children}
      </table>
    </div>
  );
}

function TableHeader({ children, className, ...props }) {
  return (
    <thead className={cn(className)} {...props}>
      {children}
    </thead>
  );
}

function TableBody({ children, className, ...props }) {
  return (
    <tbody className={cn(className)} {...props}>
      {children}
    </tbody>
  );
}

function TableRow({ children, className, ...props }) {
  return (
    <tr className={cn(className)} {...props}>
      {children}
    </tr>
  );
}

function TableHead({ children, className, ...props }) {
  return (
    <th
      className={cn("h-12 px-3 text-left align-middle font-medium", className)}
      {...props}
    >
      {children}
    </th>
  );
}

function TableCell({ children, className, ...props }) {
  return (
    <td className={cn("p-3 align-middle", className)} {...props}>
      {children}
    </td>
  );
}

function TableCaption({ children, className, ...props }) {
  return (
    <caption
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </caption>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};

export default Table;
