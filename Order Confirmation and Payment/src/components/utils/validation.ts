// Validation utility functions for FrontDash application

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns ValidationResult with isValid boolean and optional error message
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., user@example.com)' };
  }

  return { isValid: true };
};

/**
 * Validates phone number format (10 digits)
 * @param phone - Phone string to validate
 * @returns ValidationResult with isValid boolean and optional error message
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits' };
  }

  return { isValid: true };
};

/**
 * Validates zip code format (exactly 5 digits)
 * @param zipCode - Zip code string to validate
 * @returns ValidationResult with isValid boolean and optional error message
 */
export const validateZipCode = (zipCode: string): ValidationResult => {
  if (!zipCode || zipCode.trim() === '') {
    return { isValid: false, error: 'Zip code is required' };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = zipCode.replace(/\D/g, '');
  
  if (digitsOnly.length !== 5) {
    return { isValid: false, error: 'Zip code must be exactly 5 digits' };
  }

  return { isValid: true };
};

/**
 * Formats phone number to (XXX) XXX-XXXX format
 * @param phone - Phone string to format
 * @returns Formatted phone string
 */
export const formatPhone = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  return phone;
};

/**
 * Validates multiple fields at once
 * @param fields - Object with field names and values to validate
 * @returns Object with field names and their validation results
 */
/**
 * Validates password format (8+ characters with uppercase, lowercase, and numbers)
 * @param password - Password string to validate
 * @returns ValidationResult with isValid boolean and optional error message
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
  }

  return { isValid: true };
};

/**
 * Validates credit card number format (16 digits starting with 4, 2, 5, 3, or 6)
 * @param cardNumber - Credit card number string to validate
 * @returns ValidationResult with isValid boolean and optional error message
 */
export const validateCreditCard = (cardNumber: string): ValidationResult => {
  if (!cardNumber || cardNumber.trim() === '') {
    return { isValid: false, error: 'Credit card number is required' };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = cardNumber.replace(/\D/g, '');
  
  if (digitsOnly.length !== 16) {
    return { isValid: false, error: 'Credit card number must be exactly 16 digits' };
  }

  const firstDigit = digitsOnly[0];
  if (!['4', '2', '5', '3', '6'].includes(firstDigit)) {
    return { isValid: false, error: 'Credit card number must start with 4, 2, 5, 3, or 6' };
  }

  return { isValid: true };
};

// Simple boolean-returning validation functions for easier use
export const validateEmailSimple = (email: string): boolean => {
  return validateEmail(email).isValid;
};

export const validatePhoneNumber = (phone: string): boolean => {
  return validatePhone(phone).isValid;
};

export const validateZipCodeSimple = (zipCode: string): boolean => {
  return validateZipCode(zipCode).isValid;
};

export const validatePasswordSimple = (password: string): boolean => {
  return validatePassword(password).isValid;
};

export const validateCreditCardSimple = (cardNumber: string): boolean => {
  return validateCreditCard(cardNumber).isValid;
};

export const validateFields = (fields: { [key: string]: { value: string; type: 'email' | 'phone' | 'zipCode' } }): { [key: string]: ValidationResult } => {
  const results: { [key: string]: ValidationResult } = {};
  
  Object.entries(fields).forEach(([fieldName, { value, type }]) => {
    if (type === 'email') {
      results[fieldName] = validateEmail(value);
    } else if (type === 'phone') {
      results[fieldName] = validatePhone(value);
    } else if (type === 'zipCode') {
      results[fieldName] = validateZipCode(value);
    }
  });
  
  return results;
};