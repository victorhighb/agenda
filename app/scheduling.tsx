import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../components/PrimaryButton";
import { useClients } from "../store/clients";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSchedules } from "../store/schedules";

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão", "Transferência"];

function formatTime(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

const normalize = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function Scheduling() {
  const { clients } = useClients();
  const { schedules, addSchedule, updateSchedule, removeSchedule } = useSchedules();
  const router = useRouter();
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();

  const editing = typeof id === "string" && id.length > 0;
  const editingSchedule = editing ? schedules.find((s) => s.id === id) : undefined;

  const [scheduleDate, setScheduleDate] = useState(
    (typeof date === "string" && date.length
      ? date
      : new Date().toISOString().slice(0, 10)) as string
  );

  const [clientModal, setClientModal] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [payment, setPayment] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (!editingSchedule) return;
    setScheduleDate(editingSchedule.date);
    setSelectedClientId(editingSchedule.clientId);
    setTitle(editingSchedule.title);
    setValue(
      typeof editingSchedule.value === "number"
        ? String(editingSchedule.value)
        : ""
    );
    setPayment(editingSchedule.payment ?? null);
    setStartTime(editingSchedule.startTime);
    setEndTime(editingSchedule.endTime || "");
  }, [editingSchedule]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleValue = (v: string) => {
    const digits = v.replace(/[^\d]/g, "");
    setValue(digits);
  };

  const handleStart = (v: string) => setStartTime(formatTime(v));
  const handleEnd = (v: string) => setEndTime(formatTime(v));

  // Validação: endTime não é mais obrigatório
  const isValid = useMemo(
    () =>
      selectedClient &&
      title.trim().length > 0 &&
      value.trim().length > 0 &&
      startTime.trim().length >= 4,
    [selectedClient, title, value, startTime]
  );

  const handleSubmit = () => {
    if (!isValid || !selectedClient) return;

    const payload = {
      date: scheduleDate,
      title: title.trim(),
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      value: Number(value),
      payment,
      startTime,
      endTime: endTime.trim().length >= 4 ? endTime : "",
    };

    if (editing && editingSchedule) {
      updateSchedule(editingSchedule.id, payload);
    } else {
      addSchedule(payload);
    }
    router.back();
  };

  const handleCancelAppointment = () => {
    if (editing && editingSchedule) {
      removeSchedule(editingSchedule.id);
      router.back();
    }
  };

  const filteredClients = useMemo(() => {
    const raw = clientQuery.trim();
    const q = normalize(raw);
    const digits = raw.replace(/\D/g, "");
    if (!q && !digits) return clients;
    return clients.filter((c) => {
      const nameOk = q ? normalize(c.name).includes(q) : false;
      const phoneDigits = (c.phone || "").replace(/\D/g, "");
      const phoneOk = digits ? phoneDigits.includes(digits) : false;
      return nameOk || phoneOk;
    });
  }, [clients, clientQuery]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: "height" })}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>
          {editing ? "Editar agendamento" : "Novo agendamento"} (dia {scheduleDate})
        </Text>

        <TouchableOpacity
          style={styles.fieldWrapper}
          activeOpacity={0.6}
          onPress={() => setClientModal(true)}
        >
          <Text>{selectedClient ? selectedClient.name : "Selecionar cliente"}</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 18 }]}>Título do serviço</Text>
        <View style={styles.fieldWrapper}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Corte de cabelo"
            style={styles.textInput}
            returnKeyType="next"
          />
        </View>

        <Text style={[styles.label, { marginTop: 18 }]}>Valor (R$)</Text>
        <View style={styles.fieldWrapper}>
          <TextInput
            value={value}
            onChangeText={handleValue}
            keyboardType="number-pad"
            placeholder="Ex: 5000 (para 50,00)"
            style={styles.textInput}
            returnKeyType="next"
            maxLength={7}
          />
        </View>

        <Text style={[styles.label, { marginTop: 18 }]}>Forma de pagamento</Text>
        <View style={styles.methodsRow}>
          {PAYMENT_METHODS.map((m) => {
            const active = payment === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setPayment(m)}
                activeOpacity={0.7}
                style={[styles.methodPill, active && styles.methodPillActive]}
              >
                <Text>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 18 }]}>Hora início *</Text>
        <View style={styles.fieldWrapper}>
          <TextInput
            value={startTime}
            onChangeText={handleStart}
            placeholder="HH:MM"
            style={styles.textInput}
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="next"
          />
        </View>

        <Text style={[styles.label, { marginTop: 18 }]}>Hora fim (opcional)</Text>
        <View style={styles.fieldWrapper}>
          <TextInput
            value={endTime}
            onChangeText={handleEnd}
            placeholder="HH:MM"
            style={styles.textInput}
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="done"
          />
        </View>

        <View style={{ height: 12 }} />

        <PrimaryButton
          title={editing ? "Salvar alterações" : "Salvar Agendamento"}
          rightIconName="save-outline"
          disabled={!isValid}
          onPress={handleSubmit}
        />

        {editing && (
          <TouchableOpacity
            style={styles.dangerButton}
            activeOpacity={0.7}
            onPress={handleCancelAppointment}
          >
            <Ionicons name="trash-outline" size={18} color="#ff3b30" />
            <Text style={styles.dangerText}>Cancelar agendamento</Text>
          </TouchableOpacity>
        )}
        {/* Espaço extra para garantir rolagem até o fim */}
        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal
        visible={clientModal}
        animationType="slide"
        onRequestClose={() => setClientModal(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.label}>Selecionar Cliente</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              value={clientQuery}
              onChangeText={setClientQuery}
              placeholder="Pesquisar por nome ou telefone"
              placeholderTextColor="#888"
              style={{ flex: 1, color: "#111" }}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filteredClients}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 12, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedClientId(item.id);
                  setClientModal(false);
                  setClientQuery("");
                }}
              >
                <Text style={{ fontWeight: "600" }}>{item.name}</Text>
                <Text>{item.phone}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text>Nenhum cliente encontrado</Text>
              </View>
            }
          />
          <PrimaryButton
            title="Fechar"
            rightIconName="close"
            onPress={() => setClientModal(false)}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48, // espaço extra para rolar até o fim
  },
  label: { marginBottom: 6 },
  fieldWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center",
  },
  textInput: { flex: 1 },
  methodsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  methodPill: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
  },
  methodPillActive: { borderWidth: 2 },
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
  dangerText: { color: "#ff3b30", fontWeight: "700" },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 8,
  },
  modalItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
});