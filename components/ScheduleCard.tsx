import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Schedule = {
  id: string;
  date: string;
  title: string;
  clientName: string;
  startTime: string;
  endTime?: string;
  payment?: string | null;
  value?: number;
};

type Props = {
  schedule: Schedule;
  onEditPress?: (schedule: Schedule) => void;
};

export default function ScheduleCard({ schedule, onEditPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => onEditPress?.(schedule)}
    >
      <View style={styles.timeBox}>
        <Text style={styles.time}>{schedule.startTime}</Text>
        {schedule.endTime && (
          <Text style={styles.endTime}>{schedule.endTime}</Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{schedule.title}</Text>
        <Text style={styles.client}>{schedule.clientName}</Text>
        {!!schedule.payment && (
          <Text style={styles.payment}>
            Pagamento: {schedule.payment}
            {typeof schedule.value === "number" ? ` • R$ ${schedule.value}` : ""}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeBox: { minWidth: 70 },
  time: { fontWeight: "700", fontSize: 14 },
  endTime: { fontWeight: "600", fontSize: 13, color: "#666", marginTop: 2 },
  title: { fontWeight: "700", fontSize: 15 },
  client: { color: "#666", marginTop: 2 },
  payment: { color: "#333", fontSize: 12, marginTop: 4 },
});