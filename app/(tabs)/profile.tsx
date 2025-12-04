import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../src/config/firebase";

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/login");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível sair.  Tente novamente.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles. avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#666" />
        </View>
      </View>

      {/* Informações do usuário */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{user?.displayName || "Usuário"}</Text>
        <Text style={styles.email}>{user?.email || "email@exemplo.com"}</Text>
      </View>

      {/* Cards de informações */}
      <View style={styles.cardsContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="person-outline" size={24} color="#000" />
          <View style={styles.infoCardContent}>
            <Text style={styles. infoCardLabel}>Nome</Text>
            <Text style={styles.infoCardValue}>{user?.displayName || "Não informado"}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="mail-outline" size={24} color="#000" />
          <View style={styles. infoCardContent}>
            <Text style={styles.infoCardLabel}>E-mail</Text>
            <Text style={styles.infoCardValue}>{user?.email || "Não informado"}</Text>
          </View>
        </View>
      </View>

      {/* Botão de logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  infoCardValue: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: "auto",
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight: "600",
  },
});