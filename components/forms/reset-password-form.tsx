"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [isInvalidLink, setIsInvalidLink] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function prepareRecoverySession() {
      const supabase = createClient();
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setIsInvalidLink(true);
          setMessage("Ungültiger oder abgelaufener Link");
          return;
        }

        setIsReady(true);
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        window.history.replaceState(null, "", window.location.pathname);

        if (error) {
          setIsInvalidLink(true);
          setMessage("Ungültiger oder abgelaufener Link");
          return;
        }

        setIsReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setIsInvalidLink(true);
        setMessage("Ungültiger oder abgelaufener Link");
        return;
      }

      setIsReady(true);
    }

    void prepareRecoverySession();
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isReady || isInvalidLink) {
      setMessage("Ungültiger oder abgelaufener Link");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password")?.toString() ?? "";
    const passwordConfirm = formData.get("password_confirm")?.toString() ?? "";

    if (password.length < 8) {
      setMessage("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("Die Passwörter stimmen nicht überein.");
      return;
    }

    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsPending(false);

    if (error) {
      setMessage(error.message || "Ungültiger oder abgelaufener Link");
      return;
    }

    setMessage("Passwort erfolgreich geändert");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Neues Passwort">
        <Input name="password" type="password" minLength={8} required />
      </Field>
      <Field label="Passwort bestätigen">
        <Input name="password_confirm" type="password" minLength={8} required />
      </Field>
      {message ? (
        <div className={`rounded-2xl px-4 py-3 text-sm ${
          message === "Passwort erfolgreich geändert" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message}
        </div>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={isPending || isInvalidLink || !isReady}>
        {isPending ? "Speichern..." : "Speichern"}
      </Button>
      {message === "Passwort erfolgreich geändert" ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary">Zum Login</Link>
        </p>
      ) : null}
    </form>
  );
}
