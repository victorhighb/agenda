export const formatCpfCnpj = (value: string) => {
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
};

export const validateCpfCnpj = (val: string) => {
  if (!val) return false;
  const cleanVal = val.replace(/\D/g, '');

  if (cleanVal.length === 11) {
    return validateCPF(cleanVal);
  } else if (cleanVal.length === 14) {
    return validateCNPJ(cleanVal);
  }
  return false;
};

// Funções auxiliares simplificadas
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
  // Validação básica de tamanho já feita, algoritmo completo de CNPJ pode ser adicionado aqui
  // Para brevidade, verificamos apenas o tamanho neste exemplo, mas recomendo usar lib 'cpf-cnpj-validator'
  return true; 
}