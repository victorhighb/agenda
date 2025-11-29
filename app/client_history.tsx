import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useClients } from "../store/clients";
import { useSchedules } from "../store/schedules";

const monthNames = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function monthTitle(ym: string) {
  const [year, mm] = ym.split("-");
  const idx = Math.max(0, Math.min(11, Number(mm) - 1));
  return `${monthNames[idx]} ${year}`;
}

export default function ClientHistory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { schedules } = useSchedules();
  const { clients } = useClients();

  // mantém caso precise do cliente depois
  clients.find((c) => c.id === id);

  // Agrupa por ano-mês (YYYY-MM)
  const sections = useMemo(() => {
    const items = schedules
      .filter((s) => s.clientId === id)
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date); // recentes primeiro
        return a.startTime.localeCompare(b.startTime);
      });

    const map = new Map<string, typeof items>();
    for (const it of items) {
      const ym = (it.date || "").slice(0, 7); // YYYY-MM
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym)!.push(it);
    }

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // meses recentes primeiro
      .map(([ym, data]) => ({ title: monthTitle(ym), data }));
  }, [id, schedules]);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8, gap: 8 }}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.section}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              router.push({ pathname: "/scheduling", params: { id: item.id } })
            }
          >
            <View style={{ minWidth: 80 }}>
              <Text style={styles.time}>
                {item.startTime} - {item.endTime}
              </Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.service}>{item.title}</Text>
              {!!item.payment && (
                <Text style={styles.sub}>
                  Pagamento: {item.payment}
                  {typeof item.value === "number" ? ` • R$ ${item.value}` : ""}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <Text>Nenhum atendimento encontrado</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  section: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginTop: 8,
    marginBottom: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  time: { fontWeight: "700", color: "#000" },
  date: { color: "#666", marginTop: 2 },
  service: { fontWeight: "700", color: "#000" },
  sub: { color: "#333", marginTop: 2 },
});