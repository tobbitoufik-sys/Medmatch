"use client";

import { useEffect, useState } from "react";

export function PrintOnMount() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [mounted]);

  return null;
}
