import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { auth, db } from "../src/config/firebase"; // Confirme se o caminho está correto

export type Client = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  userId?: string; // Para saber de quem é esse cliente
};

type Ctx = {
  clients: Client[];
  addClient: (c: Omit<Client, "id">) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
};

const ClientsContext = createContext<Ctx | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [user, setUser] = useState(auth.currentUser);

  // Efeito para monitorar login e buscar dados em tempo real
  useEffect(() => {
    // 1. Monitora se o usuário mudou (login/logout)
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 2. Se está logado, cria uma query para buscar SÓ os clientes dele
        const q = query(
          collection(db, "clients"), 
          where("userId", "==", currentUser.uid)
        );

        // 3. 'onSnapshot' fica ouvindo o banco de dados em tempo real
        const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
          const clientsList: Client[] = [];
          querySnapshot.forEach((doc) => {
            clientsList.push({ id: doc.id, ...doc.data() } as Client);
          });
          setClients(clientsList);
        });

        return () => unsubscribeSnapshot();
      } else {
        // Se deslogou, limpa a lista local
        setClients([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const addClient = async (c: Omit<Client, "id">) => {
    if (!user) return; // Segurança extra
    try {
      await addDoc(collection(db, "clients"), {
        ...c,
        userId: user.uid,
        createdAt: new Date() // Útil para ordenação futura
      });
      // Não precisamos dar setClients, o onSnapshot fará isso sozinho!
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      throw error;
    }
  };

  const updateClient = async (id: string, patch: Partial<Client>) => {
    try {
      const docRef = doc(db, "clients", id);
      await updateDoc(docRef, patch);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      throw error;
    }
  };

  const removeClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, "clients", id));
    } catch (error) {
      console.error("Erro ao remover:", error);
      throw error;
    }
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient, updateClient, removeClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
}