import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  getDoc
} from "firebase/firestore";
import { auth, db } from "../src/config/firebase"; // Confirme se o caminho está correto

export type Client = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  userId?: string; // Para saber quem criou esse cliente (auditoria)
  salonId?: string; // Para compartilhar clientes entre profissionais do mesmo salão
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
  const [salonId, setSalonId] = useState<string | null>(null);

  // Efeito para monitorar login e buscar dados em tempo real
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    // 1. Monitora se o usuário mudou (login/logout)
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      // Limpa listener anterior se existir
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      setUser(currentUser);

      if (currentUser) {
        // 2. Busca o salonId do usuário logado na coleção users
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userSalonId = userData?.salonId || null;
          setSalonId(userSalonId);

          if (userSalonId) {
            // 3. Se está logado e tem salonId, cria uma query para buscar clientes do salão
            const q = query(
              collection(db, "clients"), 
              where("salonId", "==", userSalonId)
            );

            // 4. 'onSnapshot' fica ouvindo o banco de dados em tempo real
            unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
              const clientsList: Client[] = [];
              querySnapshot.forEach((doc) => {
                clientsList.push({ id: doc.id, ...doc.data() } as Client);
              });
              setClients(clientsList);
            });
          } else {
            // Se não tem salonId, limpa a lista (usuário sem salão configurado)
            setClients([]);
          }
        } else {
          // Se documento do usuário não existe, limpa tudo
          setSalonId(null);
          setClients([]);
        }
      } else {
        // Se deslogou, limpa a lista local e salonId
        setSalonId(null);
        setClients([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const addClient = async (c: Omit<Client, "id">) => {
    if (!user || !salonId) return; // Segurança extra - precisa estar logado e ter salonId
    try {
      await addDoc(collection(db, "clients"), {
        ...c,
        userId: user.uid, // Mantém userId para auditoria (quem criou)
        salonId, // Adiciona salonId para compartilhamento
        createdAt: new Date() // Útil para ordenação futura
      });
      // Não precisamos dar setClients, o onSnapshot fará isso sozinho!
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      throw error;
    }
  };

  const updateClient = async (id: string, patch: Partial<Client>) => {
    if (!salonId) {
      console.error("Não é possível atualizar cliente sem salonId");
      throw new Error("Usuário não tem salão configurado");
    }
    
    try {
      const docRef = doc(db, "clients", id);
      // Verifica se o cliente pertence ao mesmo salão
      const clientDoc = await getDoc(docRef);
      if (!clientDoc.exists()) {
        throw new Error("Cliente não encontrado");
      }
      
      const clientData = clientDoc.data();
      // Verifica se o cliente tem salonId e se pertence ao mesmo salão
      if (!clientData?.salonId || clientData.salonId !== salonId) {
        throw new Error("Você não tem permissão para atualizar este cliente");
      }
      
      await updateDoc(docRef, patch);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      throw error;
    }
  };

  const removeClient = async (id: string) => {
    if (!salonId) {
      console.error("Não é possível remover cliente sem salonId");
      throw new Error("Usuário não tem salão configurado");
    }
    
    try {
      const docRef = doc(db, "clients", id);
      // Verifica se o cliente pertence ao mesmo salão
      const clientDoc = await getDoc(docRef);
      if (!clientDoc.exists()) {
        throw new Error("Cliente não encontrado");
      }
      
      const clientData = clientDoc.data();
      // Verifica se o cliente tem salonId e se pertence ao mesmo salão
      if (!clientData?.salonId || clientData.salonId !== salonId) {
        throw new Error("Você não tem permissão para remover este cliente");
      }
      
      await deleteDoc(docRef);
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