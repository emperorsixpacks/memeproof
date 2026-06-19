"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { createWalletKit } from "./stellar";

interface StellarContextType {
  kit: StellarWalletsKit | null;
  publicKey: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const StellarContext = createContext<StellarContextType>({
  kit: null,
  publicKey: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
});

export function useStellar() {
  return useContext(StellarContext);
}

export function StellarProvider({ children }: { children: ReactNode }) {
  const [kit] = useState(() => createWalletKit());
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("stellarPublicKey");
    if (saved) {
      setPublicKey(saved);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      const { address } = await kit.getAddress();
      await kit.setWallet("freighter");
      setPublicKey(address);
      localStorage.setItem("stellarPublicKey", address);
    } catch (e) {
      console.error("Failed to connect wallet:", e);
      throw e;
    }
  }, [kit]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    localStorage.removeItem("stellarPublicKey");
  }, []);

  return (
    <StellarContext.Provider
      value={{
        kit,
        publicKey,
        isConnected: !!publicKey,
        connect,
        disconnect,
      }}
    >
      {children}
    </StellarContext.Provider>
  );
}
