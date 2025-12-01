import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "../components/PrimaryButton";
import { useClients } from "../store/clients";

export default function ClientsRegister() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  // Usando 'as any' temporariamente se o TS reclamar dos tipos, mas o ideal é tipar corretamente
  const { clients, addClient, updateClient, removeClient } = useClients() as any;

  const editing = typeof id === "string" && id.length > 0;
  const editingClient = editing ? clients.find((c: any) => c.id === id) : undefined;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editingClient) return;
    setName(editingClient.name || "");
    setPhone(editingClient.phone || "");
    setAddress(editingClient.address || "");
  }, [editingClient]);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha nome e telefone.");
      return;
    }

    setIsSaving(true);
    try {
      if (editing && editingClient) {
        await updateClient(editingClient.id, {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        });
      } else {
        await addClient({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        });
      }
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing || !editingClient) return;

    Alert.alert(
      "Excluir cliente",
      `Tem certeza que deseja excluir ${editingClient.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await removeClient(editingClient.id);
              router.back();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.flex}
    >
      <View style={styles.flex}>
        <View style={styles.container}>
          <Text style={styles.label}>Nome *</Text>
          <View style={styles.fieldWrapper}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nome do cliente"
              style={styles.textInput}
              returnKeyType="next"
              editable={!isSaving}
            />
          </View>

          <Text style={[styles.label, { marginTop: 18 }]}>Telefone *</Text>
          <View style={styles.fieldWrapper}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
              style={styles.textInput}
              returnKeyType="next"
              editable={!isSaving}
            />
          </View>

          <Text style={[styles.label, { marginTop: 18 }]}>Endereço</Text>
          <View style={styles.fieldWrapper}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Endereço (opcional)"
              style={styles.textInput}
              returnKeyType="done"
              editable={!isSaving}
            />
          </View>

          <View style={{ flex: 1 }} />

          {editing && (
            <TouchableOpacity
              style={[styles.dangerButton, isSaving && { opacity: 0.5 }]}
              activeOpacity={0.7}
              onPress={handleDelete}
              disabled={isSaving}
            >
              <Ionicons name="trash-outline" size={18} color="#ff3b30" />
              <Text style={styles.dangerText}>Excluir cliente</Text>
            </TouchableOpacity>
          )}
        </View>

        {/*  SAFE AREA REAL PARA IOS + ANDROID  */}
        <View style={[styles.buttonSafeArea, { paddingBottom: insets.bottom + 10 }]}>
          {isSaving ? (
            <ActivityIndicator size="large" color="#000" style={{ marginBottom: 20 }} />
          ) : (
            <PrimaryButton
              title={editing ? "Salvar alterações" : "Cadastrar cliente"}
              rightIconName="save-outline"
              onPress={handleSave}
              style={styles.primaryButton}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  label: {
    marginBottom: 6,
    fontWeight: "600",
  },

  fieldWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center",
  },

  textInput: {
    flex: 1,
  },

  dangerButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  dangerText: {
    color: "#ff3b30",
    fontWeight: "700",
  },

  buttonSafeArea: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
  },

  primaryButton: {
    marginBottom: 0,
  },
});