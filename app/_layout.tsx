import { Stack } from "expo-router";
import React, { useState } from "react";
import { ClientsProvider } from "../store/clients";
import { SchedulesProvider } from "../store/schedules";

const [isLoggedIn, setIsLoggedIn] = useState(false);

export default function RootLayout() {
  return (
    <ClientsProvider>
      <SchedulesProvider>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="clients_register" options={{ title: "Novo Cliente" }} />
          <Stack.Screen name="scheduling" options={{ title: "Novo Agendamento" }} />
          <Stack.Screen name="client_history" options={{ title: "Histórico" }} />
        </Stack>
      </SchedulesProvider>
    </ClientsProvider>
  );
}