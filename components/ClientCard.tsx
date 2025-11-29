import React from "react";
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Client } from "../store/clients";

type Props = {
  client: Client;
  onPress?: () => void;
  onHistoryPress?: (client: Client) => void;
  onEditPress?: (client: Client) => void;
};

const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");
function phoneToE164BR(phone: string) {
  const d = onlyDigits(phone);
  if (!d) return null;
  if (d.startsWith("55")) return d;
  if (d.length >= 10 && d.length <= 11) return `55${d}`;
  return d;
}
async function openWhatsApp(phone: string, text?: string) {
  const to = phoneToE164BR(phone);
  if (!to) {
    Alert.alert("Telefone inválido", "Este cliente não possui telefone válido.");
    return;
  }
  const encoded = text ? encodeURIComponent(text) : "";
  const appUrl = `whatsapp://send?phone=${to}${encoded ? `&text=${encoded}` : ""}`;
  const webUrl = `https://wa.me/${to}${encoded ? `?text=${encoded}` : ""}`;
  const supported = await Linking.canOpenURL("whatsapp://send?text=hello");
  await Linking.openURL(supported ? appUrl : webUrl);
}

export default function ClientCard({ client, onPress, onHistoryPress, onEditPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{client.name}</Text>
        {!!client.phone && <Text style={styles.phone}>{client.phone}</Text>}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onHistoryPress?.(client)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={18} color="#111" />
        </TouchableOpacity>

        {!!client.phone && (
          <TouchableOpacity
            style={[styles.iconBtn, styles.whatsapp]}
            onPress={() => openWhatsApp(client.phone)}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {onEditPress && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onEditPress(client)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color="#111" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  name: { fontWeight: "700", color: "#000" },
  phone: { color: "#333", marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },
  whatsapp: { backgroundColor: "#25D366" },
});