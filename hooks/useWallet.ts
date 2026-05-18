"use client";
import { useCallback } from "react";
import freighter from "@stellar/freighter-api";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

export function useWallet() {
  const { address, jwt, setAddress, setJwt, disconnect } = useStore();

  const connect = useCallback(async () => {
    try {
      await freighter.setAllowed();
      const { address: addr } = await freighter.getAddress();
      setAddress(addr);
      const { token } = await api.getToken(addr);
      setJwt(token);
    } catch (err) {
      console.error("Wallet connect failed:", err);
    }
  }, [setAddress, setJwt]);

  return { address, jwt, connect, disconnect, isConnected: !!address };
}
