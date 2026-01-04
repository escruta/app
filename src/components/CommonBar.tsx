import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function CommonBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <Card className={cn("flex mb-4", className)}>{children}</Card>;
}
