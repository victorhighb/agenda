// src/services/firestore.ts
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from "firebase/firestore";

export async function addClient(data: { name: string; phone?: string; createdAt?: Date }) {
  const coll = collection(db, "clients");
  const docRef = await addDoc(coll, {
    ...data,
    createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : Timestamp.now(),
  });
  return docRef.id;
}

export async function getClients() {
  const coll = collection(db, "clients");
  const snap = await getDocs(query(coll, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DocumentData[];
}

export async function addSchedule(data: {
  clientId: string;
  date: Date;
  notes?: string;
  createdAt?: Date;
}) {
  const coll = collection(db, "schedules");
  const docRef = await addDoc(coll, {
    ...data,
    date: Timestamp.fromDate(data.date),
    createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : Timestamp.now(),
  });
  return docRef.id;
}

export async function getSchedules() {
  const coll = collection(db, "schedules");
  const snap = await getDocs(query(coll, orderBy("date", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DocumentData[];
}