import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/config/firebase";
import * as SecureStore from "expo-secure-store";

interface SavedAccount {
  email: string;
  password: string;
}

const ACCOUNTS_KEY = "saved_accounts";

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;

  // Estados para o modal de troca de contas
  const [switchModalVisible, setSwitchModalVisible] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar contas salvas ao montar o componente
  useEffect(() => {
    loadSavedAccounts();
  }, []);

  const loadSavedAccounts = async () => {
    try {
      const accountsJson = await SecureStore.getItemAsync(ACCOUNTS_KEY);
      if (accountsJson) {
        const accounts = JSON.parse(accountsJson);
        setSavedAccounts(accounts);
      }
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    }
  };

  const saveAccounts = async (accounts: SavedAccount[]) => {
    try {
      await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(accounts));
      setSavedAccounts(accounts);
    } catch (error) {
      console.error("Erro ao salvar contas:", error);
      Alert.alert("Erro", "Não foi possível salvar as contas.");
    }
  };

  const handleAddAccount = async () => {
    if (!newEmail.trim() || !newPassword.trim()) {
      Alert.alert("Atenção", "Por favor, preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      // Verificar se a conta já existe
      const accountExists = savedAccounts.some(
        (acc) => acc.email.toLowerCase() === newEmail.toLowerCase().trim()
      );

      if (accountExists) {
        Alert.alert("Atenção", "Esta conta já está salva.");
        setLoading(false);
        return;
      }

      // Adicionar nova conta
      const newAccount: SavedAccount = {
        email: newEmail.trim(),
        password: newPassword.trim(),
      };

      const updatedAccounts = [...savedAccounts, newAccount];
      await saveAccounts(updatedAccounts);

      setNewEmail("");
      setNewPassword("");
      setShowAddForm(false);
      Alert.alert("Sucesso", "Conta adicionada com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível adicionar a conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async (account: SavedAccount) => {
    setLoading(true);
    try {
      // Fazer logout da conta atual
      await signOut(auth);

      // Fazer login na conta selecionada
      await signInWithEmailAndPassword(auth, account.email, account.password);

      setSwitchModalVisible(false);
      Alert.alert("Sucesso", "Conta trocada com sucesso!");
    } catch (error: any) {
      let msg = "Não foi possível trocar de conta.";
      if (error.code === "auth/invalid-credential") {
        msg = "Credenciais inválidas. A conta pode ter sido removida ou a senha alterada.";
      }
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = (email: string) => {
    Alert.alert(
      "Remover Conta",
      `Deseja remover a conta ${email} da lista?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            const updatedAccounts = savedAccounts.filter(
              (acc) => acc.email !== email
            );
            await saveAccounts(updatedAccounts);
          },
        },
      ]
    );
  };

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

      {/* Botão de trocar de conta */}
      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => {
          loadSavedAccounts();
          setSwitchModalVisible(true);
        }}
      >
        <Ionicons name="people-outline" size={24} color="#007AFF" />
        <Text style={styles.switchText}>Trocar de conta</Text>
      </TouchableOpacity>

      {/* Botão de logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      {/* Modal de Troca de Contas */}
      <Modal
        visible={switchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSwitchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Trocar de Conta</Text>

            {!showAddForm ? (
              <>
                {savedAccounts.length > 0 ? (
                  <FlatList
                    data={savedAccounts}
                    keyExtractor={(item) => item.email}
                    renderItem={({ item }) => (
                      <View style={styles.accountItem}>
                        <TouchableOpacity
                          style={styles.accountInfo}
                          onPress={() => handleSwitchAccount(item)}
                          disabled={loading}
                        >
                          <Ionicons
                            name="person-circle-outline"
                            size={32}
                            color="#000"
                          />
                          <Text style={styles.accountEmail}>{item.email}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteAccount(item.email)}
                          disabled={loading}
                        >
                          <Ionicons name="close-circle" size={24} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                    )}
                    style={styles.accountsList}
                  />
                ) : (
                  <Text style={styles.emptyText}>
                    Nenhuma conta salva. Adicione uma nova conta.
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddForm(true)}
                  disabled={loading}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                  <Text style={styles.addButtonText}>Adicionar nova conta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setSwitchModalVisible(false);
                    setShowAddForm(false);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.modalCancelText}>Fechar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.formContainer}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="E-mail"
                    placeholderTextColor="#999"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Senha"
                    placeholderTextColor="#999"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.modalButton, loading && { opacity: 0.7 }]}
                  onPress={handleAddAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Adicionar conta</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewEmail("");
                    setNewPassword("");
                  }}
                  disabled={loading}
                >
                  <Text style={styles.modalCancelText}>Voltar</Text>
                </TouchableOpacity>
              </>
            )}
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight: "600",
  },
  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: "auto",
    marginBottom: 12,
  },
  switchText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
    textAlign: "center",
  },
  accountsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  accountEmail: {
    fontSize: 16,
    color: "#000",
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 24,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  formContainer: {
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#000",
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalCancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  modalCancelText: {
    color: "#666",
    fontSize: 16,
  },
});