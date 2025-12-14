import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../src/config/firebase";

export default function Options() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salonName, setSalonName] = useState("");
  const [salonDocument, setSalonDocument] = useState("");

  useEffect(() => {
    fetchUserSalonData();
  }, []);

  const fetchUserSalonData = async () => {
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
        const salonId = userData.salonId;
        const salonNameFromUser = userData.salonName;

        if (salonId) {
          // Buscar dados do salão
          const salonDocRef = doc(db, "salons", salonId);
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
  };

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
});
