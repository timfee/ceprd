"use client";

import { Check, Plus } from "lucide-react";
import { memo, useCallback } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTEXT_CATEGORIES } from "@/lib/repository";
import { usePRDStore } from "@/lib/store";

interface DriverBadgeProps {
  driver: string;
  onRemove: (driver: string) => void;
}

const DriverBadge = memo(({ driver, onRemove }: DriverBadgeProps) => {
  const handleRemove = useCallback(() => {
    onRemove(driver);
  }, [driver, onRemove]);

  return (
    <Badge
      variant="secondary"
      className="gap-1 pr-1 hover:bg-destructive hover:text-destructive-foreground cursor-pointer transition-colors"
      onClick={handleRemove}
    >
      {driver}
      <Check className="h-3 w-3" />
    </Badge>
  );
});

DriverBadge.displayName = "DriverBadge";

interface DriverMenuItemProps {
  item: string;
  isSelected: boolean;
  onToggle: (item: string) => void;
}

const DriverMenuItem = memo(
  ({ item, isSelected, onToggle }: DriverMenuItemProps) => {
    const handleSelect = useCallback(
      (e: Event) => {
        e.preventDefault();
        onToggle(item);
      },
      [item, onToggle]
    );

    return (
      <DropdownMenuItem className="text-xs" onSelect={handleSelect}>
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 truncate">{item}</div>
          {isSelected && <Check className="h-3 w-3 opacity-100" />}
        </div>
      </DropdownMenuItem>
    );
  }
);

DriverMenuItem.displayName = "DriverMenuItem";

/**
 * Component for selecting strategic drivers.
 * Now displayed as an integrated tag list with an "Add Driver" button.
 */
export function BackgroundSelector() {
  const marketDrivers = usePRDStore(
    (state) => state.prd.sections.background.marketDrivers
  );
  const { setActiveSection, updateBackground } = usePRDStore(
    (state) => state.actions
  );

  const toggleDriver = useCallback(
    (driver: string) => {
      setActiveSection("background");
      const exists = marketDrivers.includes(driver);
      const newDrivers = exists
        ? marketDrivers.filter((d) => d !== driver)
        : [...marketDrivers, driver];
      updateBackground({ marketDrivers: newDrivers });
    },
    [marketDrivers, setActiveSection, updateBackground]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Add Strategic Driver
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Select Drivers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {CONTEXT_CATEGORIES.map((category) => (
                <DropdownMenuSub key={category.id}>
                  <DropdownMenuSubTrigger className="text-xs">
                    {category.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {category.items.map((item) => (
                      <DriverMenuItem
                        key={item}
                        item={item}
                        isSelected={marketDrivers.includes(item)}
                        onToggle={toggleDriver}
                      />
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {marketDrivers.length === 0 && (
          <span className="text-xs text-muted-foreground italic">
            No strategic drivers selected. Add context to guide the AI.
          </span>
        )}

        {marketDrivers.map((driver) => (
          <DriverBadge key={driver} driver={driver} onRemove={toggleDriver} />
        ))}
      </div>
    </div>
  );
}
