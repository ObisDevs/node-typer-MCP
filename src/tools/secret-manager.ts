import { createHash, randomBytes } from 'crypto';

export interface ManageSecretsParams {
  action: 'store' | 'retrieve' | 'mask' | 'generate';
  key: string;
  value?: string;
  type?: 'api_key' | 'token' | 'password' | 'certificate';
  mask_pattern?: string;
}

export interface SecretResult {
  action: string;
  key: string;
  value?: string;
  masked?: string;
  type: string;
  generated?: boolean;
  timestamp: string;
}

// In-memory secret store (in production, use encrypted storage)
const secretStore = new Map<string, { value: string; type: string; timestamp: string }>();

export function manageSecrets(params: ManageSecretsParams): SecretResult {
  const { action, key, value, type = 'api_key', mask_pattern } = params;
  const timestamp = new Date().toISOString();
  
  switch (action) {
    case 'store':
      return storeSecret(key, value!, type, timestamp);
    case 'retrieve':
      return retrieveSecret(key, timestamp);
    case 'mask':
      return maskSecret(key, mask_pattern, timestamp);
    case 'generate':
      return generateSecret(key, type, timestamp);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function storeSecret(key: string, value: string, type: string, timestamp: string): SecretResult {
  if (!value) {
    throw new Error('Value is required for store action');
  }
  
  // Encrypt the value (simple base64 encoding for demo - use proper encryption in production)
  const encrypted = Buffer.from(value).toString('base64');
  
  secretStore.set(key, {
    value: encrypted,
    type,
    timestamp
  });
  
  return {
    action: 'store',
    key,
    type,
    timestamp,
    masked: maskValue(value, getDefaultMaskPattern(type))
  };
}

function retrieveSecret(key: string, timestamp: string): SecretResult {
  const stored = secretStore.get(key);
  
  if (!stored) {
    throw new Error(`Secret '${key}' not found`);
  }
  
  // Decrypt the value
  const decrypted = Buffer.from(stored.value, 'base64').toString('utf8');
  
  return {
    action: 'retrieve',
    key,
    value: decrypted,
    type: stored.type,
    timestamp
  };
}

function maskSecret(key: string, maskPattern: string | undefined, timestamp: string): SecretResult {
  const stored = secretStore.get(key);
  
  if (!stored) {
    throw new Error(`Secret '${key}' not found`);
  }
  
  const decrypted = Buffer.from(stored.value, 'base64').toString('utf8');
  const pattern = maskPattern || getDefaultMaskPattern(stored.type);
  const masked = maskValue(decrypted, pattern);
  
  return {
    action: 'mask',
    key,
    masked,
    type: stored.type,
    timestamp
  };
}

function generateSecret(key: string, type: string, timestamp: string): SecretResult {
  let generated: string;
  
  switch (type) {
    case 'api_key':
      generated = `ak_${randomBytes(16).toString('hex')}`;
      break;
    case 'token':
      generated = randomBytes(32).toString('base64url');
      break;
    case 'password':
      generated = generatePassword();
      break;
    case 'certificate':
      generated = `-----BEGIN CERTIFICATE-----\n${randomBytes(64).toString('base64')}\n-----END CERTIFICATE-----`;
      break;
    default:
      generated = randomBytes(16).toString('hex');
  }
  
  // Store the generated secret
  const encrypted = Buffer.from(generated).toString('base64');
  secretStore.set(key, {
    value: encrypted,
    type,
    timestamp
  });
  
  return {
    action: 'generate',
    key,
    value: generated,
    type,
    generated: true,
    timestamp
  };
}

function maskValue(value: string, pattern: string): string {
  const length = value.length;
  
  switch (pattern) {
    case 'start':
      return length > 4 ? `${value.slice(0, 4)}${'*'.repeat(length - 4)}` : '*'.repeat(length);
    case 'end':
      return length > 4 ? `${'*'.repeat(length - 4)}${value.slice(-4)}` : '*'.repeat(length);
    case 'middle':
      if (length <= 6) return '*'.repeat(length);
      return `${value.slice(0, 3)}${'*'.repeat(length - 6)}${value.slice(-3)}`;
    case 'email':
      const emailParts = value.split('@');
      if (emailParts.length === 2) {
        const [local, domain] = emailParts;
        const maskedLocal = local.length > 2 ? `${local[0]}${'*'.repeat(local.length - 2)}${local.slice(-1)}` : '*'.repeat(local.length);
        return `${maskedLocal}@${domain}`;
      }
      return '*'.repeat(length);
    case 'full':
      return '*'.repeat(length);
    default:
      return '*'.repeat(Math.max(1, length - 4)) + value.slice(-4);
  }
}

function getDefaultMaskPattern(type: string): string {
  switch (type) {
    case 'api_key':
      return 'start';
    case 'token':
      return 'middle';
    case 'password':
      return 'full';
    case 'certificate':
      return 'middle';
    default:
      return 'end';
  }
}

function generatePassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Utility functions for secret validation
export function validateSecretStrength(value: string, type: string): { valid: boolean; score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;
  
  if (type === 'password') {
    if (value.length >= 8) score += 20;
    else feedback.push('Password should be at least 8 characters long');
    
    if (/[a-z]/.test(value)) score += 20;
    else feedback.push('Password should contain lowercase letters');
    
    if (/[A-Z]/.test(value)) score += 20;
    else feedback.push('Password should contain uppercase letters');
    
    if (/\d/.test(value)) score += 20;
    else feedback.push('Password should contain numbers');
    
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(value)) score += 20;
    else feedback.push('Password should contain special characters');
  } else if (type === 'api_key') {
    if (value.length >= 32) score += 50;
    else feedback.push('API key should be at least 32 characters long');
    
    if (/^[a-zA-Z0-9_-]+$/.test(value)) score += 50;
    else feedback.push('API key should only contain alphanumeric characters, underscores, and hyphens');
  } else {
    score = value.length >= 16 ? 100 : 50;
  }
  
  return {
    valid: score >= 80,
    score,
    feedback
  };
}