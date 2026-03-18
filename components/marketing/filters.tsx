import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Filters({
  fields
}: {
  fields: { name: string; label: string; placeholder: string }[];
}) {
  return (
    <form className="surface grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
      {fields.map((field) => (
        <div key={field.name}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {field.label}
          </p>
          <Input name={field.name} placeholder={field.placeholder} />
        </div>
      ))}
      <div className="flex items-end">
        <Button type="submit" className="w-full">
          Apply filters
        </Button>
      </div>
    </form>
  );
}
