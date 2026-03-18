import Link from "next/link";
import { HeartPulse } from "lucide-react";

import { appName } from "@/lib/utils";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 font-semibold tracking-tight text-foreground">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <HeartPulse className="h-5 w-5" />
      </span>
      <span className="text-lg">{appName()}</span>
    </Link>
  );
}
