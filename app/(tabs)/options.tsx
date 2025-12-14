import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../src/config/firebase";

interface Professional {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string | null;
}

export default function Options() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salonName, setSalonName] = useState("");
  const [salonDocument, setSalonDocument] = useState("");
  const [salonId, setSalonId] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const fetchProfessionals = useCallback(async (userSalonId: string) => {
    try {
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("salonId", "==", userSalonId));
      const querySnapshot = await getDocs(q);
      
      const professionalsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          name: data.name || "Sem nome",
          email: data.email || "",
          phone: data.phone || "",
          photoURL: data.photoURL || null,
        };
      });
      
      setProfessionals(professionalsList);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      Alert.alert("Erro", "Não foi possível carregar os profissionais");
    }
  }, []);

  const fetchUserSalonData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Erro", "Usuário não autenticado");
        setLoading(false);
        return;
      }

      // Buscar dados do usuário no Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userSalonId = userData.salonId;
        const salonNameFromUser = userData.salonName;

        if (userSalonId) {
          setSalonId(userSalonId);
          
          // Buscar dados do salão
          const salonDocRef = doc(db, "salons", userSalonId);
          const salonDocSnap = await getDoc(salonDocRef);

          if (salonDocSnap.exists()) {
            const salonData = salonDocSnap.data();
            setSalonName(salonData.name || salonNameFromUser || "");
            setSalonDocument(salonData.document || "");
          } else {
            // Se o salão não existe, use os dados do usuário
            setSalonName(salonNameFromUser || "");
            setSalonDocument("");
          }
          
          // Buscar profissionais do salão
          fetchProfessionals(userSalonId);
        } else {
          setSalonName(salonNameFromUser || "");
          setSalonDocument("");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do salão:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do salão");
    } finally {
      setLoading(false);
    }
  }, [fetchProfessionals]);

  useEffect(() => {
    fetchUserSalonData();
  }, [fetchUserSalonData]);

  const handleRegisterProfessional = () => {
    if (!salonName || !salonDocument) {
      Alert.alert(
        "Atenção",
        "Não foi possível obter os dados completos do salão. Certifique-se de que o salão foi cadastrado corretamente."
      );
      return;
    }

    router.push({
      pathname: "/register_professional",
      params: {
        salonName: salonName,
        salonDocument: salonDocument,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const canRegisterProfessional = !!salonName && !!salonDocument;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            !canRegisterProfessional && styles.optionButtonDisabled
          ]}
          onPress={handleRegisterProfessional}
          disabled={!canRegisterProfessional}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="person-add-outline" size={28} color="#000" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.optionTitle}>Cadastrar Profissional</Text>
            <Text style={styles.optionDescription}>
              {canRegisterProfessional
                ? "Adicione novos profissionais ao seu salão"
                : "Dados do salão incompletos"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        {/* Lista de Profissionais */}
        {salonId && (
          <View style={styles.professionalsSection}>
            <Text style={styles.sectionTitle}>Profissionais do Salão</Text>
            {professionals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Nenhum profissional cadastrado</Text>
              </View>
            ) : (
              <FlatList
                data={professionals}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.professionalItem}>
                    <View style={styles.professionalAvatar}>
                      {item.photoURL ? (
                        <Image
                          source={{ uri: item.photoURL }}
                          style={styles.professionalAvatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={24} color="#666" />
                      )}
                    </View>
                    <View style={styles.professionalInfo}>
                      <Text style={styles.professionalName}>{item.name}</Text>
                      {!!item.email && (
                        <Text style={styles.professionalEmail}>{item.email}</Text>
                      )}
                      {!!item.phone && (
                        <Text style={styles.professionalPhone}>{item.phone}</Text>
                      )}
                    </View>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  content: {
    padding: 16,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
  },
  professionalsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  professionalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  professionalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  professionalAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  professionalEmail: {
    fontSize: 14,
    color: "#666",
  },
  professionalPhone: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
});
