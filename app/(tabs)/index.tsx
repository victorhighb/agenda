import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import PrimaryButton from "../../components/PrimaryButton";
import ScheduleCard from "../../components/ScheduleCard";
import { useSchedules } from "../../store/schedules";
import { auth } from "../../src/config/firebase";

LocaleConfig.locales["pt-br"] = {
  monthNames: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  monthNamesShort: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  dayNames: ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"],
  dayNamesShort: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],
  today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-br";

function getTodayYMD(timeZone: string = "America/Sao_Paulo") {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}

function formatDateBR(ymd: string) {
  if (!ymd || ymd.length < 10) return ymd;
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function UserDisplayName() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  if (!user?.displayName) return null;

  // Pega apenas o primeiro nome para não ocupar muito espaço
  const firstName = user.displayName.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={styles.profileChip}
      onPress={() => router.push('/user_profile')}
      activeOpacity={0.7}
    >
      {user.photoURL ? (
        <Image source={{ uri: user.photoURL }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
      <Text style={styles.userName}>
        {firstName}
      </Text>
    </TouchableOpacity>
  );
}

export default function Index() {
  const [selected, setSelected] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const router = useRouter();
  const { schedules } = useSchedules();

  const countsByDate = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const s of schedules) acc[s.date] = (acc[s.date] ?? 0) + 1;
    return acc;
  }, [schedules]);

  const dayItems = useMemo(() => {
    if (!selected) return [];
    return schedules
      .filter((s) => s.date === selected)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selected, schedules]);

  const todayDs = getTodayYMD();
  const displayDate = selected || todayDs;

  const DayCell = ({ date, state }: any) => {
    const ds = date.dateString;
    const isSelected = selected === ds;
    const isToday = ds === todayDs;
    const count = countsByDate[ds] ?? 0;

    return (
      <Pressable onPress={() => setSelected(ds)} style={styles.dayPress}>
        <View style={[styles.day, isSelected && styles.daySelected]}>
          <Text
            style={[
              styles.dayText,
              state === "disabled" && styles.dayTextDisabled,
              isSelected && styles.dayTextSelected,
              isToday && !isSelected && styles.dayTextToday,
            ]}
          >
            {date.day}
          </Text>
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 9 ? "9+" : String(count)}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const handleAgendar = () => {
    router.push({ pathname: "/scheduling", params: { date: selected || todayDs } });
  };

  return (
    <View style={styles.container}>
      {/* Row with date selector and user profile */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.dateButton}
          activeOpacity={0.7}
          onPress={() => setCalendarOpen(!calendarOpen)}
        >
          <Ionicons name="calendar-outline" size={20} color="#111" />
          <Text style={styles.dateText}>{formatDateBR(displayDate)}</Text>
          <Ionicons
            name={calendarOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color="#111"
          />
        </TouchableOpacity>
        <UserDisplayName />
      </View>

      {/* Calendário expansível */}
      {calendarOpen && (
        <Calendar
          key={selected}
          style={styles.calendar}
          dayComponent={DayCell}
          current={displayDate}
          onDayPress={(day) => {
            setSelected(day.dateString);
            setCalendarOpen(false);
          }}
          renderArrow={(direction) => (
            <Ionicons
              name={direction === "left" ? "chevron-back" : "chevron-forward"}
              size={22}
              color="#000"
            />
          )}
          theme={{ arrowColor: "#000", todayTextColor: "red" }}
        />
      )}

      <PrimaryButton
        title="Novo Agendamento"
        rightIconName="calendar-outline"
        onPress={handleAgendar}
      />

      <FlatList
        data={dayItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16, gap: 8 }}
        renderItem={({ item }) => (
          <ScheduleCard
            schedule={item}
            onEditPress={(s) =>
              router.push({ pathname: "/scheduling", params: { id: s.id } })
            }
          />
        )}
        ListEmptyComponent={
          selected ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Text>Nenhum agendamento para este dia</Text>
            </View>
          ) : (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Text>Selecione um dia no calendário</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingHorizontal: 16, paddingTop: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  dateText: { flex: 1, fontSize: 16, fontWeight: "600", color: "#111" },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 6,
    paddingRight: 12,
    borderRadius: 32,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  calendar: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  dayPress: { 
    alignItems: "center", 
    justifyContent: "center",
    padding: 4,
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  daySelected: {
    backgroundColor: "#000",
    borderRadius: 10,
  },
  dayText: { color: "#111", fontWeight: "600" },
  dayTextSelected: { color: "#fff" },
  dayTextDisabled: { color: "#c2c2c2" },
  dayTextToday: { color: "red" },
  badge: {
    position: "absolute", 
    top: 0, 
    right: 0,
    minWidth: 16, 
    height: 16, 
    borderRadius: 8, 
    backgroundColor: "#ff3b30",
    alignItems: "center", 
    justifyContent: "center",
    paddingHorizontal: 3, 
    borderWidth: 1.5, 
    borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700", lineHeight: 11 },
});