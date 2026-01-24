import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function Spinner({ className, ...props }: SpinnerProps) {
  return <Loader2 className={cn("animate-spin", className)} {...props} />;
}
