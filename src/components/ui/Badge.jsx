import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Badge = forwardRef(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        {
          "border-transparent bg-violet-600 text-white shadow hover:bg-violet-700": variant === "default",
          "border-transparent bg-red-500 text-white shadow hover:bg-red-600": variant === "destructive",
          "text-slate-900 border-slate-200": variant === "outline"
        },
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";
