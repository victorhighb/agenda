import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { auth } from '../src/config/firebase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para o modal de recuperação de senha
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (email. trim().length === 0 || password. trim().length === 0) {
      Alert.alert('Atenção', 'Por favor, preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // SECURITY NOTE: Storing passwords in SecureStore for account switching convenience.
      // This is encrypted at the device level but has security implications.
      // For production apps, consider using Firebase Custom Tokens or OAuth refresh tokens instead.
      await SecureStore.setItemAsync(`password_${userCredential.user.uid}`, password);
      
      router.replace('/(tabs)'); 
    } catch (error: any) {
      let msg = "Ocorreu um erro ao fazer login. ";
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
      if (error.code === 'auth/user-not-found') msg = "Usuário não encontrado. ";
      if (error.code === 'auth/wrong-password') msg = "Senha incorreta. ";
      if (error.code === 'auth/invalid-credential') msg = "Credenciais inválidas.";
      
      Alert.alert('Erro no Login', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (resetEmail.trim().length === 0) {
      Alert.alert('Atenção', 'Por favor, digite seu e-mail.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail. trim());
      Alert.alert(
        'E-mail enviado! ',
        'Verifique sua caixa de entrada (e spam) para redefinir sua senha.',
        [{ text: 'OK', onPress: () => {
          setForgotModalVisible(false);
          setResetEmail('');
        }}]
      );
    } catch (error: any) {
      let msg = "Não foi possível enviar o e-mail de recuperação.";
      if (error. code === 'auth/invalid-email') msg = "E-mail inválido.";
      if (error. code === 'auth/user-not-found') msg = "Nenhuma conta encontrada com este e-mail.";
      
      Alert.alert('Erro', msg);
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotModal = () => {
    setResetEmail(email); // Preenche com o e-mail já digitado, se houver
    setForgotModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles. header}>
          <Text style={styles. appName}>Agenda</Text>
          <Text style={styles. subtitle}>Bem-vindo de volta</Text>
        </View>

        <View style={styles. form}>
          <View style={styles.inputContainer}>
            <Text style={styles. label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles. label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotButton} onPress={openForgotModal}>
            <Text style={styles. forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </View>

      {/* Modal de Recuperação de Senha */}
      <Modal
        visible={forgotModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles. modalContainer}>
            <Text style={styles.modalTitle}>Recuperar Senha</Text>
            <Text style={styles.modalDescription}>
              Digite seu e-mail e enviaremos um link para você redefinir sua senha. 
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#999"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalButton, resetLoading && { opacity: 0.7 }]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles. modalButtonText}>Enviar e-mail</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles. modalCancelButton}
              onPress={() => {
                setForgotModalVisible(false);
                setResetEmail('');
              }}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet. create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    color: '#666',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 14,
  },
});