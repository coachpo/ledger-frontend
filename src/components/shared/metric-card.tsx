import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

type MetricCardProps = {
  icon?: LucideIcon;
  iconClassName?: string;
  note?: string;
  title: string;
  to?: string;
  value: string;
  valueClassName?: string;
};

function MetricCardBody({
  icon: Icon,
  iconClassName,
  note,
  title,
  value,
  valueClassName,
}: Omit<MetricCardProps, "to">) {
  return (
    <CardContent className="pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </p>
          <p className={cn("text-2xl tracking-tight", valueClassName)}>{value}</p>
          {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
        </div>
        {Icon ? (
          <div className={cn("rounded-lg p-2 text-primary", iconClassName)}>
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
    </CardContent>
  );
}

export function MetricCard(props: MetricCardProps) {
  if (props.to) {
    return (
      <Link
        className="bg-card text-card-foreground block rounded-xl border transition-shadow hover:shadow-md"
        to={props.to}
      >
        <MetricCardBody {...props} />
      </Link>
    );
  }

  return (
    <Card>
      <MetricCardBody {...props} />
    </Card>
  );
}
