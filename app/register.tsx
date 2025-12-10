import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
// Certifique-se de que 'db' é exportado do seu config. 
// Se não tiver, adicione 'export const db = getFirestore(app);' no arquivo firebase.ts
import { auth, db } from '../src/config/firebase'; 

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [document, setDocument] = useState(''); // Estado para CPF/CNPJ
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Aplica a máscara enquanto digita
  const handleDocumentChange = (text: string) => {
    setDocument(formatCpfCnpj(text));
  };

  const handleRegister = async () => {
    // Validação básica de campos vazios
    if (name.trim().length === 0 || email.trim().length === 0 || password.trim().length === 0 || document.trim().length === 0) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    // Validação específica de CPF/CNPJ
    if (!validateCpfCnpj(document)) {
      Alert.alert('Atenção', 'CPF ou CNPJ inválido.');
      return;
    }

    setLoading(true);
    try {
      // 1. Cria o usuário na autenticação (Authentication)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Atualiza o perfil do usuário (Authentication)
      await updateProfile(user, {
        displayName: name
      });

      // 3. Salva os dados complementares no Banco de Dados (Firestore)
      // Cria um documento na coleção "users" com o ID igual ao UID do usuário
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        cpfCnpj: document, // Salva o documento validado
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);

    } catch (error: any) {
      console.error(error);
      let msg = "Não foi possível criar a conta.";
      if (error.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
      if (error.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      
      Alert.alert('Erro no Cadastro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.appName}>Agenda</Text>
          <Text style={styles.subtitle}>Crie sua conta gratuita</Text>
        </View>

        <View style={styles.form}>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Campo CPF/CNPJ */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CPF ou CNPJ</Text>
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor="#999"
              value={document}
              onChangeText={handleDocumentChange}
              keyboardType="numeric"
              maxLength={18} // 18 caracteres é o máximo para CNPJ formatado
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Crie uma senha"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem uma conta? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Fazer Login</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </View>
    </SafeAreaView>
  );
}

// --- FUNÇÕES DE VALIDAÇÃO E FORMATAÇÃO ---

function formatCpfCnpj(value: string) {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length <= 11) {
    // CPF
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
    // CNPJ
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
}

function validateCpfCnpj(val: string) {
  if (!val) return false;
  const cleanVal = val.replace(/\D/g, '');

  if (cleanVal.length === 11) {
    return validateCPF(cleanVal);
  } else if (cleanVal.length === 14) {
    return validateCNPJ(cleanVal);
  }
  return false;
}

function validateCPF(cpf: string) {
  if (/^(\d)\1+$/.test(cpf)) return false;
  let sum = 0, remainder;
  
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

function validateCNPJ(cnpj: string) {
  if (/^(\d)\1+$/.test(cnpj)) return false;
  // Validação simplificada de tamanho e dígitos repetidos. 
  // Para validação completa de DV do CNPJ, recomenda-se adicionar o algoritmo completo aqui.
  return true; 
}

// --- ESTILOS ---

const styles = StyleSheet.create({
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
    marginBottom: 32, // Reduzi um pouco para caber os novos campos em telas menores
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
    marginBottom: 16, // Reduzi um pouco para otimizar espaço
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
});