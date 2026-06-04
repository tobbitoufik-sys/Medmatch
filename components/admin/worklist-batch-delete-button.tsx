"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

type WorklistBatchDeleteButtonProps = Omit<ButtonProps, "onClick" | "type"> & {
  formId: string;
  checkboxName: string;
  confirmMessage: string;
  hiddenInputName?: string;
};

export function WorklistBatchDeleteButton({
  formId,
  checkboxName,
  confirmMessage,
  hiddenInputName = checkboxName,
  children,
  ...props
}: WorklistBatchDeleteButtonProps) {
  return (
    <Button
      {...props}
      type="button"
      onClick={() => {
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (!form) {
          return;
        }

        form
          .querySelectorAll<HTMLInputElement>(`input[data-worklist-hidden="${hiddenInputName}"]`)
          .forEach((input) => input.remove());

        const checkedValues = Array.from(
          document.querySelectorAll<HTMLInputElement>(`input[name="${checkboxName}"]:checked`)
        )
          .map((input) => input.value.trim())
          .filter(Boolean);

        checkedValues.forEach((value) => {
          const hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          hiddenInput.name = hiddenInputName;
          hiddenInput.value = value;
          hiddenInput.setAttribute("data-worklist-hidden", hiddenInputName);
          form.appendChild(hiddenInput);
        });

        if (!window.confirm(confirmMessage)) {
          return;
        }

        form.requestSubmit();
      }}
    >
      {children}
    </Button>
  );
}
