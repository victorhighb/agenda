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
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { signOut, signInWithEmailAndPassword, updateProfile, User } from "firebase/auth";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"; // Adicionei updateDoc e doc
// REMOVIDO: imports do firebase/storage (ref, uploadBytes, etc)

import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

// Importando auth e db (storage não precisa mais aqui para upload)
import { auth, db } from "../../src/config/firebase";

// IMPORTAR O SERVIÇO QUE CRIAMOS
import { uploadToCloudinary } from "../../src/services/cloudinary"; // Ajuste o caminho se necessário

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  const [avatarUrl, setAvatarUrl] = useState(auth.currentUser?.photoURL);
  // ... outros states (accountsModalVisible, users, loading, etc) ...
  const [accountsModalVisible, setAccountsModalVisible] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser: User | null) => {
      setUser(currentUser);
      setAvatarUrl(currentUser?.photoURL);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // --- Função de Escolher Imagem (IGUAL) ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "Precisamos de acesso à galeria.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  // --- NOVA Função de Upload com Cloudinary ---
  const handleImageUpload = async (uri: string) => {
    setUploadingImage(true);
    
    try {
      if (!user) return;

      // 1. Enviar para o Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(uri);

      if (!cloudinaryUrl) {
        throw new Error("Falha ao obter URL do Cloudinary");
      }

      // --- AQUI A MÁGICA DO ÍCONE ---
      // Se você quiser adicionar o ícone via URL transformation, faria algo assim:
      // const finalUrl = cloudinaryUrl.replace("/upload/", "/upload/l_icon_vip,w_50,g_south_east/");
      // Por enquanto, vamos usar a URL normal:
      const finalUrl = cloudinaryUrl;

      // 2. Atualizar Auth do Firebase (Profile do usuário)
      await updateProfile(user, {
        photoURL: finalUrl,
      });

      // 3. Atualizar documento no Firestore (Opcional, mas recomendado para manter sync)
      // Se você salva dados do usuário no Firestore, atualize lá também
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          photoURL: finalUrl
        });
      } catch (firestoreError) {
        console.log("Erro ao atualizar firestore (não crítico):", firestoreError);
      }

      setAvatarUrl(finalUrl);
      Alert.alert("Sucesso", "Foto de perfil atualizada!");

    } catch (error: any) {
      console.error("Erro detalhado:", error);
      Alert.alert("Erro no Upload", "Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ... O RESTO DO CÓDIGO CONTINUA IGUAL ...
  // (fetchUsers, handleSwitchAccount, handleLogout, return, styles...)
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          name: data.name,
          email: data.email,
          photoURL: data.photoURL || null, // agora trazemos a foto se existir
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

  const handleSwitchAccount = async (selectedUser: any) => {
    if (selectedUser.uid === user?.uid) return;

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
              const storedPassword = await SecureStore.getItemAsync(`password_${selectedUser.uid}`);
              if (!storedPassword) {
                await signOut(auth);
                Alert.alert(
                  "Senha Necessária",
                  `Para trocar para a conta de ${selectedUser.name}, você precisa fazer login primeiro.`,
                  [{ text: "OK", onPress: () => router.replace("/login") }]
                );
                return;
              }
              await signOut(auth);
              await signInWithEmailAndPassword(auth, selectedUser.email, storedPassword);
              Alert.alert("Sucesso", `Conta trocada para ${selectedUser.name}`);
            } catch (error: any) {
              console.error("Erro ao trocar conta:", error);
              if (error.code === 'auth/invalid-credential') {
                await SecureStore.deleteItemAsync(`password_${selectedUser.uid}`);
                Alert.alert("Erro", "Credenciais inválidas.");
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
      "Tem certeza que deseja sair?",
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
              Alert.alert("Erro", "Não foi possível sair.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Avatar Container */}
      <View style={styles.avatarContainer}>
        {uploadingImage ? (
           <View style={[styles.avatar, { backgroundColor: '#f0f0f0' }]}>
             <ActivityIndicator color="#007AFF" />
           </View>
        ) : (
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={48} color="#666" />
              </View>
            )}
            <View style={styles.editIconOverlay}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Informações do usuário */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user?.displayName || "Usuário"}</Text>
          <TouchableOpacity onPress={pickImage} style={styles.editNameButton}>
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.email}>{user?.email || "email@exemplo.com"}</Text>
      </View>

      {/* Cards de informações */}
      <View style={styles.cardsContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="person-outline" size={24} color="#000" />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Nome</Text>
            <Text style={styles.infoCardValue}>{user?.displayName || "Não informado"}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="mail-outline" size={24} color="#000" />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>E-mail</Text>
            <Text style={styles.infoCardValue}>{user?.email || "Não informado"}</Text>
          </View>
        </View>
      </View>

      {/* Botões */}
      <TouchableOpacity style={styles.switchAccountButton} onPress={handleOpenAccountsModal}>
        <Ionicons name="people-outline" size={24} color="#007AFF" />
        <Text style={styles.switchAccountText}>Trocar de conta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      {/* Modal */}
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
                    {/* Mostrar imagem circular quando existir photoURL */}
                    <View style={styles.accountAvatar}>
                      {item.photoURL ? (
                        <Image
                          source={{ uri: item.photoURL }}
                          style={styles.accountAvatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={24} color="#666" />
                      )}
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
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f5f5f5'
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  editNameButton: {
    padding: 4,
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
    overflow: "hidden",
  },
  // Estilo da imagem (circular) usado dentro do avatar menor
  accountAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
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