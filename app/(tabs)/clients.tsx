import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ClientCard from "../../components/ClientCard";
import PrimaryButton from "../../components/PrimaryButton";
import { useClients } from "../../store/clients";

const normalize = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");
const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export default function Clients() {
  const router = useRouter();
  const { clients, addClient, upsertMany } = useClients() as any;

  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return clients;
    return clients.filter((c: any) => normalize(c.name).includes(q));
  }, [clients, search]);

  async function handleImportContacts() {
    try {
      setImporting(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Habilite o acesso aos contatos nas configurações.");
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        pageSize: 2000,
      });

      if (!data?.length) {
        Alert.alert("Sem contatos", "Nenhum contato encontrado.");
        return;
      }

      const flat = data
        .filter((c) => c.name && c.phoneNumbers?.length)
        .flatMap((c) =>
          (c.phoneNumbers || [])
            .map((p) => ({
              name: c.name!.trim(),
              phone: onlyDigits(p.number || ""),
            }))
            .filter((x) => x.phone.length >= 8)
        );

      const byPhone = new Map<string, { name: string; phone: string }>();
      for (const c of flat) if (!byPhone.has(c.phone)) byPhone.set(c.phone, c);
      const unique = Array.from(byPhone.values());

      const existingPhones = new Set(
        clients.map((c: any) => onlyDigits(c.phone))
      );
      const toInsert = unique.filter(
        (c) => !existingPhones.has(onlyDigits(c.phone))
      );

      if (!toInsert.length) {
        Alert.alert("Nada para importar", "Todos já cadastrados.");
        return;
      }

      const payload = toInsert.map((c) => ({
        id: uid(),
        name: c.name,
        phone: c.phone,
      }));

      if (typeof upsertMany === "function") await upsertMany(payload);
      else if (typeof addClient === "function")
        for (const c of payload) await addClient(c);

      Alert.alert("Importação concluída", `Importados ${payload.length} contato(s).`);
    } catch (e: any) {
      Alert.alert("Erro ao importar", e?.message || "Tente novamente.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <PrimaryButton
        title={importing ? "Importando..." : "Importar contatos"}
        rightIconName="cloud-upload-outline"
        disabled={importing}
        onPress={handleImportContacts}
      />

      <View style={styles.searchInput}>
        <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pesquisar Cliente"
          placeholderTextColor="#888"
          style={styles.input}
          returnKeyType="search"
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: any, index) =>
          item.id || `${onlyDigits(item.phone)}-${index}`
        }
        contentContainerStyle={{ paddingVertical: 8, gap: 8 }}
        renderItem={({ item }) => (
          <ClientCard
            client={item}
            onPress={() =>
              router.push({ pathname: "/clients_register", params: { id: item.id } })
            }
            onHistoryPress={(c) =>
              router.push({ pathname: "/client_history", params: { id: c.id } })
            }
          />
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <Text>Nenhum cliente</Text>
          </View>
        }
        style={{ flex: 1 }}
      />

      <PrimaryButton
        title="Cadastrar cliente"
        rightIconName="add"
        onPress={() => router.push("/clients_register")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  input: { flex: 1, color: "#222", fontSize: 14 },
});