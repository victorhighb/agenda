import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { signOut, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { auth, db } from "../../src/config/firebase";

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;
  const [accountsModalVisible, setAccountsModalVisible] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(user?.photoURL || null);
  const [uploading, setUploading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      // Only expose minimal user information for account switching
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          name: data.name,
          email: data.email,
          // Don't expose sensitive data like cpfCnpj
        };
      });
      setUsers(usersList);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      Alert.alert("Erro", "Não foi possível carregar as contas.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permissão Necessária",
          "Precisamos de permissão para acessar suas fotos."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        
        const imageUri = result.assets[0].uri;
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          Alert.alert("Erro", "Usuário não autenticado.");
          return;
        }

        // Upload to Firebase Storage
        const storage = getStorage(auth.app);
        const filename = `profile_photos/${currentUser.uid}`;
        const storageRef = ref(storage, filename);
        
        // Convert image to blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        // Upload the image
        await uploadBytes(storageRef, blob);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update user profile
        await updateProfile(currentUser, {
          photoURL: downloadURL,
        });
        
        // Update local state
        setAvatar(downloadURL);
        
        Alert.alert("Sucesso", "Foto de perfil atualizada!");
      }
    } catch (error) {
      console.error("Erro ao atualizar foto:", error);
      Alert.alert("Erro", "Não foi possível atualizar a foto de perfil.");
    } finally {
      setUploading(false);
    }
  };

  const handleSwitchAccount = async (selectedUser: any) => {
    if (selectedUser.uid === user?.uid) {
      return; // Already on this account
    }

    Alert.alert(
      "Trocar de Conta",
      `Deseja trocar para a conta de ${selectedUser.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Trocar",
          onPress: async () => {
            setAccountsModalVisible(false);
            setLoading(true);
            
            try {
              // SECURITY NOTE: This retrieves the stored password from SecureStore.
              // While SecureStore provides hardware-backed encryption, storing passwords
              // has security implications. For production, consider Firebase Custom Tokens.
              const storedPassword = await SecureStore.getItemAsync(`password_${selectedUser.uid}`);
              
              if (!storedPassword) {
                // No stored credentials, redirect to login
                await signOut(auth);
                Alert.alert(
                  "Senha Necessária",
                  `Para trocar para a conta de ${selectedUser.name}, você precisa fazer login primeiro.`,
                  [{ text: "OK", onPress: () => router.replace("/login") }]
                );
                return;
              }

              // Sign out current user
              await signOut(auth);
              
              // Sign in with the selected user's credentials
              await signInWithEmailAndPassword(auth, selectedUser.email, storedPassword);
              
              Alert.alert("Sucesso", `Conta trocada para ${selectedUser.name}`);
            } catch (error: any) {
              console.error("Erro ao trocar conta:", error);
              
              // If credentials are invalid, clear them and redirect to login
              if (error.code === 'auth/invalid-credential') {
                await SecureStore.deleteItemAsync(`password_${selectedUser.uid}`);
                Alert.alert(
                  "Credenciais Inválidas",
                  "As credenciais salvas não são mais válidas. Faça login novamente.",
                  [{ text: "OK", onPress: () => router.replace("/login") }]
                );
              } else {
                Alert.alert("Erro", "Não foi possível trocar de conta. Tente novamente.");
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenAccountsModal = () => {
    setAccountsModalVisible(true);
    fetchUsers();
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
            } catch {
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
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={48} color="#666" />
          )}
        </View>
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </View>

      {/* Informações do usuário */}
      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{user?.displayName || "Usuário"}</Text>
          <TouchableOpacity onPress={handleEditProfile} disabled={uploading}>
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
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

      {/* Botão de trocar conta */}
      <TouchableOpacity style={styles.switchAccountButton} onPress={handleOpenAccountsModal}>
        <Ionicons name="people-outline" size={24} color="#007AFF" />
        <Text style={styles.switchAccountText}>Trocar de conta</Text>
      </TouchableOpacity>

      {/* Botão de logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      {/* Modal de Contas */}
      <Modal
        visible={accountsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAccountsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione uma conta</Text>
              <TouchableOpacity onPress={() => setAccountsModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Carregando contas...</Text>
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.accountItem,
                      item.uid === user?.uid && styles.currentAccountItem
                    ]}
                    onPress={() => handleSwitchAccount(item)}
                    disabled={item.uid === user?.uid}
                  >
                    <View style={styles.accountAvatar}>
                      <Ionicons name="person" size={24} color="#666" />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{item.name || "Sem nome"}</Text>
                      <Text style={styles.accountEmail}>{item.email}</Text>
                    </View>
                    {item.uid === user?.uid && (
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhuma conta encontrada</Text>
                  </View>
                }
              />
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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
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
  switchAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  switchAccountText: {
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
    marginTop: "auto",
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  currentAccountItem: {
    backgroundColor: "#f0f8ff",
  },
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});