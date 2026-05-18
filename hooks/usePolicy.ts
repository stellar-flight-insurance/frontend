"use client";
import { useState, useEffect } from "react";
import { api, Policy } from "@/lib/api";

export function usePolicy(wallet: string | null) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;
    setLoading(true);
    api
      .getPolicies(wallet)
      .then(setPolicies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [wallet]);

  return { policies, loading, error };
}
