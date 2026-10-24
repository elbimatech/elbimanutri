/**
 * Utilitários para formatação e cálculos clínicos de pacientes
 */

export function formatTimeInput(value: string): string {
  if (!value) return '';
  const clean = value.trim();
  
  // Se já tiver formato HH:MM
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(clean)) {
    const [h, m] = clean.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }

  // Apenas dígitos
  const digits = clean.replace(/\D/g, '');
  if (!digits) return value;

  // Regras especificadas no Prompt 4:
  // ex: 6 → "06:00", 630 → "06:30", 23 → "23:00", 2230 → "22:30"
  if (digits.length === 1 || digits.length === 2) {
    let num = parseInt(digits, 10);
    if (num > 23) num = 23;
    return `${String(num).padStart(2, '0')}:00`;
  }

  if (digits.length === 3) {
    let h = parseInt(digits.slice(0, 1), 10);
    let m = parseInt(digits.slice(1), 10);
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  if (digits.length >= 4) {
    let h = parseInt(digits.slice(0, 2), 10);
    let m = parseInt(digits.slice(2, 4), 10);
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return value;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Converte com segurança qualquer formato de data (Date, string ISO, timestamp) para YYYY-MM-DD
 */
export function toISODateString(dateInput: unknown): string {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    return dateInput.toISOString().split('T')[0];
  }
  if (typeof dateInput === 'string') {
    return dateInput.split('T')[0];
  }
  try {
    return String(dateInput).split('T')[0];
  } catch {
    return '';
  }
}

export function calculateAge(dateInput: string | Date | null | undefined): number | null {
  if (!dateInput) return null;
  const isoStr = toISODateString(dateInput);
  const parts = isoStr.split('-');
  if (parts.length !== 3) return null;
  
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  
  const birth = new Date(birthYear, birthMonth, birthDay);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export interface IMCResult {
  imc: number;
  classificacao: string;
  badgeColor: string;
  textColor: string;
}

export function calculateIMC(pesoKg: number | null | undefined, alturaCm: number | null | undefined): IMCResult | null {
  if (!pesoKg || !alturaCm || pesoKg <= 0 || alturaCm <= 0) return null;
  
  // Converte cm para metros se for > 3, ou mantém se já estiver em metros
  const alturaM = alturaCm > 3 ? alturaCm / 100 : alturaCm;
  const imc = Number((pesoKg / (alturaM * alturaM)).toFixed(1));

  let classificacao = 'Peso ideal (Eutrofia)';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  let textColor = 'text-emerald-700';

  if (imc < 18.5) {
    classificacao = 'Abaixo do peso';
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
    textColor = 'text-blue-700';
  } else if (imc < 25) {
    classificacao = 'Peso ideal (Eutrofia)';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    textColor = 'text-emerald-700';
  } else if (imc < 30) {
    classificacao = 'Sobrepeso';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    textColor = 'text-amber-700';
  } else if (imc < 35) {
    classificacao = 'Obesidade Grau I';
    badgeColor = 'bg-orange-100 text-orange-800 border-orange-200';
    textColor = 'text-orange-700';
  } else if (imc < 40) {
    classificacao = 'Obesidade Grau II';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
    textColor = 'text-rose-700';
  } else {
    classificacao = 'Obesidade Grau III';
    badgeColor = 'bg-red-100 text-red-800 border-red-200';
    textColor = 'text-red-700';
  }

  return { imc, classificacao, badgeColor, textColor };
}
