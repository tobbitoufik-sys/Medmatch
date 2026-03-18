import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes
} from "react";

import { cn } from "@/lib/utils";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-white">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-secondary/70 text-muted-foreground" {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TR(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="border-b last:border-b-0" {...props} />;
}

export function TH(props: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className="px-4 py-3 font-semibold" {...props} />;
}

export function TD(props: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className="px-4 py-3 align-top" {...props} />;
}
