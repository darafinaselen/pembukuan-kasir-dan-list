import React from "react";

// Minimal shadcn-style Form wrappers to integrate with react-hook-form.
// These are lightweight wrappers used by forms across the app.

export function Form({ children, ...props }) {
  // Render a normal <form> so callers can pass onSubmit={handleSubmit(...)}
  return <form {...props}>{children}</form>;
}

export function FormField({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function FormItem({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function FormLabel({ children, ...props }) {
  return (
    <label {...props} className={props.className}>
      {children}
    </label>
  );
}

export function FormControl({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function FormMessage({ children, ...props }) {
  return <p {...props}>{children}</p>;
}
