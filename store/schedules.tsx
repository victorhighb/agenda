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
import { auth, db } from "../src/config/firebase"; // Ajuste o caminho se necessário

export type Schedule = {
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;
  clientId: string;
  clientName: string;
  value?: number;
  payment?: string | null;
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  userId?: string;    // Para segurança
};

type Ctx = {
  schedules: Schedule[];
  addSchedule: (s: Omit<Schedule, "id">) => Promise<void>;
  updateSchedule: (id: string, patch: Partial<Schedule>) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;
};

const SchedulesContext = createContext<Ctx | null>(null);

export function SchedulesProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Busca apenas agendamentos deste usuário
        const q = query(
          collection(db, "schedules"), 
          where("userId", "==", currentUser.uid)
        );

        const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
          const list: Schedule[] = [];
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Schedule);
          });
          
          // Ordenação simples (opcional): Data mais recente primeiro, depois hora
          list.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
          });

          setSchedules(list);
        });

        return () => unsubscribeSnapshot();
      } else {
        setSchedules([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const addSchedule = async (s: Omit<Schedule, "id">) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "schedules"), {
        ...s,
        userId: user.uid,
        createdAt: new Date() // Útil para auditoria
      });
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      throw error;
    }
  };

  const updateSchedule = async (id: string, patch: Partial<Schedule>) => {
    try {
      const docRef = doc(db, "schedules", id);
      await updateDoc(docRef, patch);
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      throw error;
    }
  };

  const removeSchedule = async (id: string) => {
    try {
      await deleteDoc(doc(db, "schedules", id));
    } catch (error) {
      console.error("Erro ao remover agendamento:", error);
      throw error;
    }
  };

  return (
    <SchedulesContext.Provider value={{ schedules, addSchedule, updateSchedule, removeSchedule }}>
      {children}
    </SchedulesContext.Provider>
  );
}

export function useSchedules() {
  const ctx = useContext(SchedulesContext);
  if (!ctx) throw new Error("useSchedules must be used within SchedulesProvider");
  return ctx;
}