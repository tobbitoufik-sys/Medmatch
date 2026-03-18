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
    <ServerForm action={createContactRequestAction} submitLabel="Send request">
      <input type="hidden" name="receiver_user_id" value={receiverUserId} />
      {relatedOfferId ? <input type="hidden" name="related_offer_id" value={relatedOfferId} /> : null}
      <Field label="Message">
        <Textarea
          name="message"
          defaultValue="Hello, I would like to discuss this opportunity and confirm the expected hiring timeline."
          required
        />
      </Field>
    </ServerForm>
  );
}
