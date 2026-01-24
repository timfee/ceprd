"use client";

import { FileText, PlusCircle } from "lucide-react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = memo(
  ({
    title,
    description,
    icon: Icon = FileText,
    actionLabel,
    onAction,
    className,
  }: EmptyStateProps) => (
    <div className={className}>
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-medium text-lg">{title}</h3>
          <p className="mb-6 max-w-sm text-muted-foreground text-sm">
            {description}
          </p>
          {actionLabel && onAction && (
            <Button onClick={onAction} variant="outline" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
);

EmptyState.displayName = "EmptyState";
