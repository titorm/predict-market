// REGEX: valida formato basico de endereco de e-mail com usuario e dominio
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// REGEX: valida formato numerico de 6 digitos para codigo OTP
const OTP_REGEX = /^[0-9]{6}$/;

// REGEX: detecta sequencias comuns alfabeticas, numericas ou de teclado contendo tres ou mais caracteres
const SEQUENTIAL_PATTERNS = /(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/i;

// REGEX: detecta tres ou mais caracteres identicos consecutivos
const REPETITIVE_CHARS = /(.)\1{2,}/;

export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(
  password: string,
  options: number | PasswordValidationOptions = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
  }
): boolean {
  if (!password || typeof password !== 'string') return false;

  if (typeof options === 'number') {
    return password.length >= options;
  }

  const minLen = options.minLength ?? 8;
  const needUpper = options.requireUppercase ?? true;
  const needLower = options.requireLowercase ?? true;
  const needNumber = options.requireNumber ?? true;

  if (password.length < minLen) return false;
  if (needUpper && !/[A-Z]/.test(password)) return false;
  if (needLower && !/[a-z]/.test(password)) return false;
  if (needNumber && !/[0-9]/.test(password)) return false;

  return true;
}

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: number;
  level: PasswordStrengthLevel;
  label: 'Muito fraca' | 'Fraca' | 'Média' | 'Forte' | 'Muito forte';
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasRepetitionOrSequence: boolean;
  isValid: boolean;
}

// ALGORITHM: calcula entropia e forca da senha ponderando tamanho, diversidade de caracteres e penalidades por repeticao
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      level: 0,
      label: 'Muito fraca',
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
      hasRepetitionOrSequence: false,
      isValid: false,
    };
  }

  const length = password.length;
  const hasMinLength = length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const hasSequence = SEQUENTIAL_PATTERNS.test(password);
  const hasRepetition = REPETITIVE_CHARS.test(password);
  const hasRepetitionOrSequence = hasSequence || hasRepetition;

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  let poolSize = 0;
  if (hasLowercase) poolSize += 26;
  if (hasUppercase) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSpecialChar) poolSize += 33;

  let rawScore = 0;

  if (length < 8) {
    rawScore = length * 2.5;
  } else if (length <= 10) {
    rawScore = 25 + (length - 8) * 3;
  } else if (length <= 14) {
    rawScore = 35 + (length - 10) * 4;
  } else {
    rawScore = 55 + Math.min(20, (length - 14) * 2);
  }

  if (hasLowercase) rawScore += 8;
  if (hasUppercase) rawScore += 8;
  if (hasNumber) rawScore += 8;
  if (hasSpecialChar) rawScore += 12;

  const varietyCount = [hasLowercase, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length;
  if (varietyCount >= 3) rawScore += 6;
  if (varietyCount === 4) rawScore += 8;

  const uniqueChars = new Set(password).size;
  const diversityRatio = uniqueChars / length;
  if (diversityRatio >= 0.75) {
    rawScore += 10;
  } else if (diversityRatio <= 0.4) {
    rawScore -= 15;
  }

  if (hasSequence) rawScore -= 15;
  if (hasRepetition) rawScore -= 15;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let level: PasswordStrengthLevel = 0;
  let label: 'Muito fraca' | 'Fraca' | 'Média' | 'Forte' | 'Muito forte' = 'Muito fraca';

  if (!isValid || score < 25) {
    level = 0;
    label = 'Muito fraca';
  } else if (score < 48) {
    level = 1;
    label = 'Fraca';
  } else if (score < 70) {
    level = 2;
    label = 'Média';
  } else if (score < 88) {
    level = 3;
    label = 'Forte';
  } else {
    level = 4;
    label = 'Muito forte';
  }

  return {
    score,
    level,
    label,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    hasRepetitionOrSequence,
    isValid,
  };
}

export function isValidOtp(otp: string): boolean {
  if (!otp || typeof otp !== 'string') return false;
  return OTP_REGEX.test(otp.trim());
}
