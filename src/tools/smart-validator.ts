export interface ValidateDataParams {
  data: any;
  schema: any;
  strict?: boolean;
  custom_rules?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  summary: string;
}

export interface ValidationError {
  path: string;
  message: string;
  expected: string;
  actual: string;
}

export function validateData(params: ValidateDataParams): ValidationResult {
  const { data, schema, strict = false, custom_rules = [] } = params;
  
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  // Validate against schema
  validateAgainstSchema(data, schema, '', errors, strict);
  
  // Apply custom rules
  custom_rules.forEach(rule => {
    const customErrors = applyCustomRule(data, rule);
    errors.push(...customErrors);
  });
  
  // Generate warnings for non-strict mode
  if (!strict) {
    generateWarnings(data, schema, warnings);
  }
  
  const valid = errors.length === 0;
  const summary = `Validation ${valid ? 'passed' : 'failed'}: ${errors.length} errors, ${warnings.length} warnings`;
  
  return { valid, errors, warnings, summary };
}

function validateAgainstSchema(data: any, schema: any, path: string, errors: ValidationError[], strict: boolean): void {
  if (!schema) return;
  
  // Type validation
  if (schema.type) {
    const actualType = getType(data);
    if (actualType !== schema.type) {
      errors.push({
        path: path || 'root',
        message: `Type mismatch`,
        expected: schema.type,
        actual: actualType
      });
      return;
    }
  }
  
  // Required fields validation
  if (schema.required && Array.isArray(schema.required)) {
    schema.required.forEach((field: string) => {
      if (data === null || data === undefined || !(field in data)) {
        errors.push({
          path: `${path}.${field}`,
          message: `Required field missing`,
          expected: 'present',
          actual: 'missing'
        });
      }
    });
  }
  
  // Properties validation
  if (schema.properties && typeof data === 'object' && data !== null) {
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      if (key in data) {
        validateAgainstSchema(data[key], propSchema, `${path}.${key}`, errors, strict);
      }
    });
    
    // Additional properties check in strict mode
    if (strict && schema.additionalProperties === false) {
      Object.keys(data).forEach(key => {
        if (!(key in schema.properties)) {
          errors.push({
            path: `${path}.${key}`,
            message: `Additional property not allowed`,
            expected: 'not present',
            actual: 'present'
          });
        }
      });
    }
  }
  
  // Array validation
  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.items) {
      data.forEach((item, index) => {
        validateAgainstSchema(item, schema.items, `${path}[${index}]`, errors, strict);
      });
    }
    
    if (schema.minItems && data.length < schema.minItems) {
      errors.push({
        path,
        message: `Array too short`,
        expected: `at least ${schema.minItems} items`,
        actual: `${data.length} items`
      });
    }
    
    if (schema.maxItems && data.length > schema.maxItems) {
      errors.push({
        path,
        message: `Array too long`,
        expected: `at most ${schema.maxItems} items`,
        actual: `${data.length} items`
      });
    }
  }
  
  // String validation
  if (schema.type === 'string' && typeof data === 'string') {
    if (schema.minLength && data.length < schema.minLength) {
      errors.push({
        path,
        message: `String too short`,
        expected: `at least ${schema.minLength} characters`,
        actual: `${data.length} characters`
      });
    }
    
    if (schema.maxLength && data.length > schema.maxLength) {
      errors.push({
        path,
        message: `String too long`,
        expected: `at most ${schema.maxLength} characters`,
        actual: `${data.length} characters`
      });
    }
    
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(data)) {
        errors.push({
          path,
          message: `String doesn't match pattern`,
          expected: schema.pattern,
          actual: data
        });
      }
    }
  }
  
  // Number validation
  if (schema.type === 'number' && typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        path,
        message: `Number too small`,
        expected: `>= ${schema.minimum}`,
        actual: String(data)
      });
    }
    
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        path,
        message: `Number too large`,
        expected: `<= ${schema.maximum}`,
        actual: String(data)
      });
    }
  }
  
  // Enum validation
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push({
      path,
      message: `Value not in allowed list`,
      expected: schema.enum.join(', '),
      actual: String(data)
    });
  }
}

function applyCustomRule(data: any, rule: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  try {
    // Simple custom rule evaluation
    if (rule.includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof data === 'string' && !emailRegex.test(data)) {
        errors.push({
          path: 'root',
          message: 'Invalid email format',
          expected: 'valid email',
          actual: data
        });
      }
    }
    
    if (rule.includes('phone')) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (typeof data === 'string' && !phoneRegex.test(data)) {
        errors.push({
          path: 'root',
          message: 'Invalid phone format',
          expected: 'valid phone number',
          actual: data
        });
      }
    }
    
    if (rule.includes('url')) {
      try {
        new URL(data);
      } catch {
        errors.push({
          path: 'root',
          message: 'Invalid URL format',
          expected: 'valid URL',
          actual: String(data)
        });
      }
    }
    
    if (rule.includes('date')) {
      const date = new Date(data);
      if (isNaN(date.getTime())) {
        errors.push({
          path: 'root',
          message: 'Invalid date format',
          expected: 'valid date',
          actual: String(data)
        });
      }
    }
  } catch (error) {
    // Ignore rule evaluation errors
  }
  
  return errors;
}

function generateWarnings(data: any, schema: any, warnings: string[]): void {
  if (typeof data === 'object' && data !== null && schema.properties) {
    Object.keys(data).forEach(key => {
      if (!(key in schema.properties)) {
        warnings.push(`Unexpected property '${key}' found`);
      }
    });
  }
  
  if (Array.isArray(data) && data.length === 0) {
    warnings.push('Empty array detected');
  }
  
  if (typeof data === 'string' && data.trim() === '') {
    warnings.push('Empty string detected');
  }
}

function getType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}