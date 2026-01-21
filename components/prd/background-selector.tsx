"use client";

import { Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CONTEXT_CATEGORIES } from "@/lib/repository";
import { usePRDStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Component for selecting strategic drivers for the project background.
 */
export function BackgroundSelector() {
  const marketDrivers = usePRDStore(
    (state) => state.prd.sections.background.marketDrivers
  );
  const { updateBackground } = usePRDStore((state) => state.actions);

  const toggleDriver = (driver: string) => {
    const exists = marketDrivers.includes(driver);
    const newDrivers = exists
      ? marketDrivers.filter((d) => d !== driver)
      : [...marketDrivers, driver];
    updateBackground({ marketDrivers: newDrivers });
  };

  return (
    <div className="flex h-full flex-col rounded-xl border bg-muted/30">
      <div className="border-b bg-muted/50 p-4">
        <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
          Strategic Drivers
        </h3>
        <p className="mt-1 text-muted-foreground text-xs">
          Select the key factors driving this project.
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Accordion
            className="w-full space-y-4"
            defaultValue={["evolving-threats", "competitive-pressures"]}
            type="multiple"
          >
            {CONTEXT_CATEGORIES.map((category) => (
              <AccordionItem
                className="border-none"
                key={category.id}
                value={category.id}
              >
                <AccordionTrigger className="group flex items-center justify-between py-2 font-medium text-sm hover:no-underline">
                  <span className="transition-colors group-hover:text-primary">
                    {category.label}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="grid gap-2">
                    {category.items.map((item) => {
                      const isSelected = marketDrivers.includes(item);
                      return (
                        <div
                          className={cn(
                            "flex items-start gap-3 rounded-md border p-3 transition-all hover:bg-background",
                            isSelected
                              ? "border-primary/50 bg-primary/5 shadow-sm"
                              : "border-transparent bg-muted/50"
                          )}
                          key={item}
                        >
                          <Checkbox
                            checked={isSelected}
                            className="mt-0.5"
                            id={item}
                            onCheckedChange={() => toggleDriver(item)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label
                              className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              htmlFor={item}
                            >
                              {item}
                            </Label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>

      {marketDrivers.length > 0 && (
        <div className="border-t bg-background p-4">
          <div className="flex flex-wrap gap-2">
            {marketDrivers.map((driver) => (
              <Badge
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                key={driver}
                onClick={() => toggleDriver(driver)}
                variant="secondary"
              >
                {driver}
                <Check className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            {marketDrivers.length} drivers selected
          </p>
        </div>
      )}
    </div>
  );
}
