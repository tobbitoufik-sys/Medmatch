import Link from "next/link";
import type { Route } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  cta,
  href
}: {
  title: string;
  description: string;
  cta?: string;
  href?: Route;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="max-w-lg text-muted-foreground">{description}</p>
        </div>
        {cta && href ? (
          <Button asChild>
            <Link href={href}>{cta}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
