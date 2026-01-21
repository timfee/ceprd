"use client";

import type * as React from "react";

import { Root } from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<typeof Root>) {
  return (
    <Root
      className={cn(
        "font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      data-slot="label"
      {...props}
    />
  );
}

export { Label };
