import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover border border-primary",
        accent: "bg-accent text-primary-foreground hover:bg-accent-hover border border-accent",
        secondary: "bg-background text-foreground border border-border-strong hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground",
        outline: "border border-border-strong bg-transparent hover:bg-muted",
      },
      size: {
        // Every size meets WCAG 2.2 AA 2.5.8 (44x44). `sm` and `icon` were
        // 36px and 40px — a primitive that ships an illegal size guarantees
        // illegal targets wherever it is used (audit/FINDINGS.md P1-5).
        default: "h-11 px-6 py-2.5",
        sm: "h-11 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
