import * as React from "react";

function cn(...inputs: Array<string | false | null | undefined>) {
    return inputs.filter(Boolean).join(" ");
}

export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement> { }

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(
                "text-sm font-medium text-slate-700 dark:text-slate-200 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                className
            )}
            {...props}
        />
    )
);
Label.displayName = "Label";
