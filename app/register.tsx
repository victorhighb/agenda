import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Register() {
  const router = useRouter();
  const [salonName, setSalonName] = useState('');
  const [salonDocument, setSalonDocument] = useState(''); // Estado para CPF/CNPJ do Salão

  // Aplica a máscara de Documento enquanto digita
  const handleDocumentChange = (text: string) => {
    setSalonDocument(formatCpfCnpj(text));
  };

  const handleNext = async () => {
    // Validação básica de campos vazios
    if (salonName.trim().length === 0 || salonDocument.trim().length === 0) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    // Validação específica de CPF/CNPJ
    if (!validateCpfCnpj(salonDocument)) {
      Alert.alert('Atenção', 'CPF ou CNPJ inválido.');
      return;
    }

    // Navega para a próxima tela passando os dados do salão
    router.push({
      pathname: '/register_professional',
      params: {
        salonName: salonName,
        salonDocument: salonDocument,
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.appName}>Agenda</Text>
          <Text style={styles.subtitle}>Cadastre seu Salão</Text>
        </View>

        <View style={styles.form}>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome do Estabelecimento</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Salão Le Belle"
              placeholderTextColor="#999"
              value={salonName}
              onChangeText={setSalonName}
            />
          </View>

          {/* Campo CPF/CNPJ do Salão */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CNPJ/CPF Estabelecimento</Text>
            <TextInput
              style={styles.input}
              placeholder="00.000.000/0000-00"
              placeholderTextColor="#999"
              value={salonDocument}
              onChangeText={handleDocumentChange}
              keyboardType="numeric"
              maxLength={18}
            />
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>OK</Text>
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

      </ScrollView>
    </SafeAreaView>
  );
}

// --- FUNÇÕES DE MÁSCARA E VALIDAÇÃO ---

function formatCpfCnpj(value: string) {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
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
  if (cleanVal.length === 11) return validateCPF(cleanVal);
  if (cleanVal.length === 14) return validateCNPJ(cleanVal);
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
  return true; 
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 16,
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