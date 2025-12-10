import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../src/config/firebase";
import * as SecureStore from "expo-secure-store";

type UserData = {
  uid: string;
  name: string;
  email: string;
  cpfCnpj?: string;
};

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;
  const [switchModalVisible, setSwitchModalVisible] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [switching, setSwitching] = useState(false);

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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as UserData[];
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Erro", "Não foi possível carregar os usuários.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const openSwitchModal = () => {
    setSwitchModalVisible(true);
    fetchUsers();
  };

  const closeSwitchModal = () => {
    setSwitchModalVisible(false);
    setSelectedUser(null);
    setPassword("");
    setNeedsPassword(false);
  };

  const handleUserSelection = async (selectedUserData: UserData) => {
    // Can't select current user
    if (selectedUserData.email === user?.email) {
      return;
    }

    setSelectedUser(selectedUserData);

    // Check if password is stored in SecureStore
    try {
      const storedPassword = await SecureStore.getItemAsync(
        `user_password_${selectedUserData.email}`
      );
      if (storedPassword) {
        setNeedsPassword(false);
        setPassword(""); // Clear password field
      } else {
        setNeedsPassword(true);
      }
    } catch (error) {
      console.error("Error checking stored password:", error);
      setNeedsPassword(true);
    }
  };

  const handleSwitchAccount = async () => {
    if (!selectedUser) {
      Alert.alert("Atenção", "Por favor, selecione um usuário.");
      return;
    }

    // Get password from SecureStore or input field
    let passwordToUse = password;
    try {
      const storedPassword = await SecureStore.getItemAsync(
        `user_password_${selectedUser.email}`
      );
      if (storedPassword) {
        passwordToUse = storedPassword;
      } else if (!password.trim()) {
        Alert.alert("Atenção", "Por favor, digite a senha.");
        return;
      }
    } catch (error) {
      console.error("Error reading stored password:", error);
      if (!password.trim()) {
        Alert.alert("Atenção", "Por favor, digite a senha.");
        return;
      }
    }

    // Confirmation alert
    Alert.alert(
      "Trocar de Conta",
      `Deseja trocar para a conta de ${selectedUser.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setSwitching(true);
            try {
              // Logout from current account
              await signOut(auth);

              // Login with selected user
              await signInWithEmailAndPassword(
                auth,
                selectedUser.email,
                passwordToUse
              );

              // Save password in SecureStore for future use
              await SecureStore.setItemAsync(
                `user_password_${selectedUser.email}`,
                passwordToUse
              );

              // Close modal and redirect
              closeSwitchModal();
              router.replace("/(tabs)");
            } catch (error: any) {
              console.error("Error switching account:", error);
              let msg = "Não foi possível trocar de conta";
              if (
                error.code === "auth/wrong-password" ||
                error.code === "auth/invalid-credential"
              ) {
                msg = "Senha incorreta";
              }
              Alert.alert("Erro", msg);
            } finally {
              setSwitching(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
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
            <Text style={styles.infoCardLabel}>Nome</Text>
            <Text style={styles.infoCardValue}>
              {user?.displayName || "Não informado"}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="mail-outline" size={24} color="#000" />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>E-mail</Text>
            <Text style={styles.infoCardValue}>
              {user?.email || "Não informado"}
            </Text>
          </View>
        </View>
      </View>

      {/* Botão de trocar de perfil */}
      <TouchableOpacity
        style={styles.switchProfileButton}
        onPress={openSwitchModal}
      >
        <Ionicons name="swap-horizontal-outline" size={24} color="#007AFF" />
        <Text style={styles.switchProfileText}>Trocar de Perfil</Text>
      </TouchableOpacity>

      {/* Botão de logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      {/* Modal de Troca de Perfil */}
      <Modal
        visible={switchModalVisible}
        animationType="slide"
        onRequestClose={closeSwitchModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Trocar de Perfil</Text>
            <TouchableOpacity onPress={closeSwitchModal}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {loadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Carregando usuários...</Text>
            </View>
          ) : (
            <ScrollView style={styles.usersList}>
              {users.map((userData) => {
                const isCurrentUser = userData.email === user?.email;
                const isSelected = selectedUser?.email === userData.email;

                return (
                  <TouchableOpacity
                    key={userData.uid}
                    style={[
                      styles.userCard,
                      isSelected && styles.userCardSelected,
                      isCurrentUser && styles.userCardDisabled,
                    ]}
                    onPress={() => handleUserSelection(userData)}
                    disabled={isCurrentUser}
                  >
                    <View style={styles.userCardAvatar}>
                      <Ionicons name="person" size={32} color="#666" />
                    </View>
                    <View style={styles.userCardContent}>
                      <View style={styles.userCardHeader}>
                        <Text style={styles.userCardName}>
                          {userData.name}
                        </Text>
                        {isCurrentUser && (
                          <View style={styles.currentUserBadge}>
                            <Text style={styles.currentUserBadgeText}>
                              (Você)
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.userCardEmail}>
                        {userData.email}
                      </Text>
                      {userData.cpfCnpj && (
                        <Text style={styles.userCardDocument}>
                          {userData.cpfCnpj}
                        </Text>
                      )}
                    </View>
                    {isSelected && !isCurrentUser && (
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {selectedUser && needsPassword && (
            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Senha</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder="Digite a senha"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.switchButton,
                (!selectedUser ||
                  (needsPassword && !password.trim()) ||
                  switching) &&
                  styles.switchButtonDisabled,
              ]}
              onPress={handleSwitchAccount}
              disabled={
                !selectedUser ||
                (needsPassword && !password.trim()) ||
                switching
              }
            >
              {switching ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.switchButtonText}>Trocar de Conta</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeSwitchModal}
              disabled={switching}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  switchProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  switchProfileText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  usersList: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  userCardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  userCardDisabled: {
    opacity: 0.6,
  },
  userCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  userCardContent: {
    flex: 1,
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  currentUserBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentUserBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  userCardEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userCardDocument: {
    fontSize: 12,
    color: "#999",
  },
  passwordContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000",
  },
  modalActions: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  switchButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  switchButtonDisabled: {
    opacity: 0.5,
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});