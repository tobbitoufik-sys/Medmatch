"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function ContactEventsCount({ applicationId }: { applicationId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const loadCount = async () => {
      const { data, error } = await supabase
        .from("contact_events")
        .select("id")
        .eq("application_id", applicationId);

      const nextCount = data?.length ?? 0;

      console.log("[contact-events-count] browser query", {
        applicationId,
        data,
        count: nextCount,
        error: error?.message ?? null
      });

      if (!active) return;
      setCount(nextCount);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadCount();
      }
    };

    const handleFocus = () => {
      void loadCount();
    };

    void loadCount();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applicationId]);

  return <p className="mt-2 font-medium">{count}</p>;
}
