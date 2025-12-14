import { Stack } from "expo-router";
import React from "react";
import { ClientsProvider } from "../store/clients";
import { SchedulesProvider } from "../store/schedules";

export default function RootLayout() {
  return (
    <ClientsProvider>
      <SchedulesProvider>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          {/* Telas de Auth sem header */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />

          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="user_profile" options={{ title: "Meu Perfil" }} />
          <Stack.Screen name="clients_register" options={{ title: "Novo Cliente" }} />
          <Stack.Screen name="scheduling" options={{ title: "Novo Agendamento" }} />
          <Stack.Screen name="client_history" options={{ title: "Histórico" }} />
        </Stack>
      </SchedulesProvider>
    </ClientsProvider>
  );
}