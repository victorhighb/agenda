import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type Client = {
  id: string;
  name: string;
  phone: string;
  address?: string;
};

type Ctx = {
  clients: Client[];
  addClient: (c: Omit<Client, "id"> & { id?: string }) => Client;
  updateClient: (id: string, patch: Partial<Client>) => Client | null;
  removeClient: (id: string) => void;
  upsertMany: (arr: Array<Omit<Client, "id"> & { id?: string }>) => void;
};

const ClientsContext = createContext<Ctx | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);

  const addClient: Ctx["addClient"] = (c) => {
    const id = c.id ?? String(Date.now());
    const client: Client = { ...c, id };
    setClients((prev) => [client, ...prev]);
    return client;
  };

  const updateClient: Ctx["updateClient"] = (id, patch) => {
    let updated: Client | null = null;
    setClients((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        updated = { ...it, ...patch, id: it.id };
        return updated!;
      })
    );
    return updated;
  };

  const removeClient: Ctx["removeClient"] = (id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const upsertMany: Ctx["upsertMany"] = (arr) => {
    setClients((prev) => {
      const copy = [...prev];
      for (const c of arr) {
        const id = c.id ?? String(Date.now() + Math.random());
        const idx = copy.findIndex((x) => x.id === id);
        if (idx >= 0) copy[idx] = { ...copy[idx], ...c, id };
        else copy.push({ ...c, id });
      }
      return copy;
    });
  };

  const value = useMemo(
    () => ({ clients, addClient, updateClient, removeClient, upsertMany }),
    [clients]
  );

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
}