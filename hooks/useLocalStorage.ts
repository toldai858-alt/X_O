"use client";

import { startTransition, useEffect, useState } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

export function useLocalStorage<T>(key: string, fallback: T, parse: (value: unknown) => T) {
  const [value, setValue] = useState(fallback);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const loaded = readStorage(key, fallback, parse);
    startTransition(() => { setValue(loaded.value); setFailed(loaded.failed); setReady(true); });
  }, [key, fallback, parse]);
  useEffect(() => {
    if (ready && !writeStorage(key, value)) startTransition(() => setFailed(true));
  }, [key, value, ready]);
  return { value, setValue, ready, failed };
}
