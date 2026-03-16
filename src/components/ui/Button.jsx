import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Button = forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-600 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-violet-600 text-white shadow hover:bg-violet-700": variant === "default",
          "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600": variant === "secondary",
          "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100": variant === "ghost",
          "border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100": variant === "outline",
          "h-9 px-4 py-2": size === "default",
          "h-8 rounded-md px-3 text-xs": size === "sm",
          "h-10 rounded-md px-8": size === "lg",
          "h-9 w-9": size === "icon",
        },
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
