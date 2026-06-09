import { createContactRequestAction } from "@/lib/actions";
import { ServerForm } from "@/components/forms/server-form";
import { Field } from "@/components/forms/field";
import { Textarea } from "@/components/ui/textarea";

export function ContactRequestForm({
  receiverUserId,
  relatedOfferId
}: {
  receiverUserId: string;
  relatedOfferId?: string;
}) {
  return (
    <ServerForm action={createContactRequestAction} submitLabel="Anfrage senden">
      <input type="hidden" name="receiver_user_id" value={receiverUserId} />
      {relatedOfferId ? <input type="hidden" name="related_offer_id" value={relatedOfferId} /> : null}
      <Field label="Nachricht">
        <Textarea
          name="message"
          defaultValue="Guten Tag, ich möchte diese Gelegenheit gerne besprechen und den weiteren Ablauf klären."
          required
        />
      </Field>
    </ServerForm>
  );
}
