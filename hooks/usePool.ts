"use client";
import { useState, useEffect } from "react";
import { api, PoolInfo, LpPosition } from "@/lib/api";

export function usePool(wallet: string | null) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [position, setPosition] = useState<LpPosition | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const tasks: Promise<void>[] = [
      api.getPoolReserve().then(setPool).catch(() => {}),
    ];
    if (wallet) {
      tasks.push(api.getLpPosition(wallet).then(setPosition).catch(() => {}));
    }
    Promise.all(tasks).finally(() => setLoading(false));
  }, [wallet]);

  return { pool, position, loading };
}
