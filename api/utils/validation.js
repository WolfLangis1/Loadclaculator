/**
 * Enhanced input validation utilities for API security
 */

// Common validation patterns
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[\d\s\-\(\)\.]{10,20}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
  safeName: /^[a-zA-Z0-9\s\-_.]{1,100}$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/
};

// Security patterns to reject
const dangerousPatterns = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:.*base64/gi,
  /eval\s*\(/gi,
  /exec\s*\(/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /\.\.\/\.\./g, // Path traversal
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi
];

/**
 * Validation schema builder
 */
class ValidationSchema {
  constructor() {
    this.rules = {};
  }

  // String validation
  string(field, options = {}) {
    this.rules[field] = {
      type: 'string',
      required: options.required !== false,
      minLength: options.minLength || 0,
      maxLength: options.maxLength || 1000,
      pattern: options.pattern || null,
      sanitize: options.sanitize !== false,
      allowEmpty: options.allowEmpty === true
    };
    return this;
  }

  // Email validation
  email(field, required = true) {
    this.rules[field] = {
      type: 'email',
      required,
      pattern: patterns.email,
      maxLength: 254,
      sanitize: true
    };
    return this;
  }

  // Number validation
  number(field, options = {}) {
    this.rules[field] = {
      type: 'number',
      required: options.required !== false,
      min: options.min || Number.MIN_SAFE_INTEGER,
      max: options.max || Number.MAX_SAFE_INTEGER,
      integer: options.integer === true
    };
    return this;
  }

  // Boolean validation
  boolean(field, required = false) {
    this.rules[field] = {
      type: 'boolean',
      required
    };
    return this;
  }

  // UUID validation
  uuid(field, required = true) {
    this.rules[field] = {
      type: 'uuid',
      required,
      pattern: patterns.uuid
    };
    return this;
  }

  // Array validation
  array(field, options = {}) {
    this.rules[field] = {
      type: 'array',
      required: options.required !== false,
      minLength: options.minLength || 0,
      maxLength: options.maxLength || 100,
      itemType: options.itemType || 'string'
    };
    return this;
  }

  // Object validation
  object(field, schema = null, required = false) {
    this.rules[field] = {
      type: 'object',
      required,
      schema
    };
    return this;
  }

  // Custom validation
  custom(field, validator, required = false) {
    this.rules[field] = {
      type: 'custom',
      required,
      validator
    };
    return this;
  }

  // Validate data against schema
  validate(data) {
    const errors = [];
    const sanitized = {};

    // Check for required fields
    for (const [field, rule] of Object.entries(this.rules)) {
      if (rule.required && (data[field] === undefined || data[field] === null)) {
        errors.push(`Field '${field}' is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (data[field] === undefined || data[field] === null) {
        continue;
      }

      const value = data[field];
      const result = this.validateField(field, value, rule);
      
      if (!result.valid) {
        errors.push(...result.errors);
      } else {
        sanitized[field] = result.value;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: sanitized
    };
  }

  // Validate individual field
  validateField(field, value, rule) {
    const errors = [];
    let sanitizedValue = value;

    try {
      switch (rule.type) {
        case 'string':
          const stringResult = this.validateString(field, value, rule);
          if (!stringResult.valid) {
            errors.push(...stringResult.errors);
          } else {
            sanitizedValue = stringResult.value;
          }
          break;

        case 'email':
          const emailResult = this.validateEmail(field, value, rule);
          if (!emailResult.valid) {
            errors.push(...emailResult.errors);
          } else {
            sanitizedValue = emailResult.value;
          }
          break;

        case 'number':
          const numberResult = this.validateNumber(field, value, rule);
          if (!numberResult.valid) {
            errors.push(...numberResult.errors);
          } else {
            sanitizedValue = numberResult.value;
          }
          break;

        case 'boolean':
          const boolResult = this.validateBoolean(field, value, rule);
          if (!boolResult.valid) {
            errors.push(...boolResult.errors);
          } else {
            sanitizedValue = boolResult.value;
          }
          break;

        case 'uuid':
          const uuidResult = this.validateUUID(field, value, rule);
          if (!uuidResult.valid) {
            errors.push(...uuidResult.errors);
          } else {
            sanitizedValue = uuidResult.value;
          }
          break;

        case 'array':
          const arrayResult = this.validateArray(field, value, rule);
          if (!arrayResult.valid) {
            errors.push(...arrayResult.errors);
          } else {
            sanitizedValue = arrayResult.value;
          }
          break;

        case 'object':
          const objectResult = this.validateObject(field, value, rule);
          if (!objectResult.valid) {
            errors.push(...objectResult.errors);
          } else {
            sanitizedValue = objectResult.value;
          }
          break;

        case 'custom':
          const customResult = rule.validator(value);
          if (!customResult.valid) {
            errors.push(...(customResult.errors || [`Invalid value for field '${field}'`]));
          } else {
            sanitizedValue = customResult.value || value;
          }
          break;

        default:
          errors.push(`Unknown validation type: ${rule.type}`);
      }
    } catch (error) {
      errors.push(`Validation error for field '${field}': ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      value: sanitizedValue
    };
  }

  // String validation implementation
  validateString(field, value, rule) {
    const errors = [];
    
    if (typeof value !== 'string') {
      value = String(value);
    }

    // Check for dangerous patterns
    if (rule.sanitize !== false) {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          errors.push(`Field '${field}' contains potentially dangerous content`);
          break;
        }
      }
    }

    // Trim whitespace
    value = value.trim();

    // Check empty string
    if (!rule.allowEmpty && value.length === 0) {
      errors.push(`Field '${field}' cannot be empty`);
    }

    // Length validation
    if (value.length < rule.minLength) {
      errors.push(`Field '${field}' must be at least ${rule.minLength} characters`);
    }
    if (value.length > rule.maxLength) {
      errors.push(`Field '${field}' must be no more than ${rule.maxLength} characters`);
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`Field '${field}' has invalid format`);
    }

    return {
      valid: errors.length === 0,
      errors,
      value: rule.sanitize !== false ? this.sanitizeString(value) : value
    };
  }

  // Email validation implementation
  validateEmail(field, value, rule) {
    const stringResult = this.validateString(field, value, rule);
    if (!stringResult.valid) {
      return stringResult;
    }

    const email = stringResult.value.toLowerCase();
    
    if (!patterns.email.test(email)) {
      return {
        valid: false,
        errors: [`Field '${field}' must be a valid email address`],
        value: email
      };
    }

    return {
      valid: true,
      errors: [],
      value: email
    };
  }

  // Number validation implementation
  validateNumber(field, value, rule) {
    const errors = [];
    
    if (typeof value === 'string') {
      value = parseFloat(value);
    }

    if (isNaN(value) || typeof value !== 'number') {
      errors.push(`Field '${field}' must be a valid number`);
      return { valid: false, errors, value: null };
    }

    if (rule.integer && !Number.isInteger(value)) {
      errors.push(`Field '${field}' must be an integer`);
    }

    if (value < rule.min) {
      errors.push(`Field '${field}' must be at least ${rule.min}`);
    }

    if (value > rule.max) {
      errors.push(`Field '${field}' must be no more than ${rule.max}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      value
    };
  }

  // Boolean validation implementation
  validateBoolean(field, value, rule) {
    if (typeof value === 'string') {
      value = value.toLowerCase();
      if (value === 'true' || value === '1') {
        value = true;
      } else if (value === 'false' || value === '0') {
        value = false;
      } else {
        return {
          valid: false,
          errors: [`Field '${field}' must be a boolean value`],
          value: null
        };
      }
    }

    if (typeof value !== 'boolean') {
      return {
        valid: false,
        errors: [`Field '${field}' must be a boolean value`],
        value: null
      };
    }

    return {
      valid: true,
      errors: [],
      value
    };
  }

  // UUID validation implementation
  validateUUID(field, value, rule) {
    const stringResult = this.validateString(field, value, { ...rule, sanitize: false });
    if (!stringResult.valid) {
      return stringResult;
    }

    if (!patterns.uuid.test(stringResult.value)) {
      return {
        valid: false,
        errors: [`Field '${field}' must be a valid UUID`],
        value: stringResult.value
      };
    }

    return {
      valid: true,
      errors: [],
      value: stringResult.value.toLowerCase()
    };
  }

  // Array validation implementation
  validateArray(field, value, rule) {
    const errors = [];

    if (!Array.isArray(value)) {
      errors.push(`Field '${field}' must be an array`);
      return { valid: false, errors, value: null };
    }

    if (value.length < rule.minLength) {
      errors.push(`Field '${field}' must have at least ${rule.minLength} items`);
    }

    if (value.length > rule.maxLength) {
      errors.push(`Field '${field}' must have no more than ${rule.maxLength} items`);
    }

    // Validate each item based on itemType
    const sanitizedArray = [];
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      
      if (rule.itemType === 'string') {
        const itemResult = this.validateString(`${field}[${i}]`, item, { maxLength: 100, sanitize: true });
        if (!itemResult.valid) {
          errors.push(...itemResult.errors);
        } else {
          sanitizedArray.push(itemResult.value);
        }
      } else {
        sanitizedArray.push(item);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      value: sanitizedArray
    };
  }

  // Object validation implementation
  validateObject(field, value, rule) {
    const errors = [];

    if (typeof value !== 'object' || value === null) {
      errors.push(`Field '${field}' must be an object`);
      return { valid: false, errors, value: null };
    }

    if (rule.schema) {
      const result = rule.schema.validate(value);
      if (!result.valid) {
        errors.push(...result.errors.map(err => `${field}.${err}`));
      }
      return {
        valid: errors.length === 0,
        errors,
        value: result.data
      };
    }

    return {
      valid: true,
      errors: [],
      value
    };
  }

  // String sanitization
  sanitizeString(str) {
    return str
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
      .trim();
  }
}

// Common validation schemas for the application
export const schemas = {
  // User data validation
  userProfile: new ValidationSchema()
    .string('name', { required: true, maxLength: 100 })
    .email('email', true)
    .string('phone', { required: false, maxLength: 20, pattern: patterns.phone })
    .string('company', { required: false, maxLength: 100 }),

  // Project validation
  project: new ValidationSchema()
    .string('name', { required: true, maxLength: 200 })
    .string('description', { required: false, maxLength: 1000 })
    .string('address', { required: false, maxLength: 500 })
    .string('status', { required: false, maxLength: 50 })
    .array('tags', { required: false, maxLength: 20, itemType: 'string' }),

  // CRM customer validation
  customer: new ValidationSchema()
    .string('name', { required: true, maxLength: 100 })
    .email('email', false)
    .string('phone', { required: false, maxLength: 20, pattern: patterns.phone })
    .string('company', { required: false, maxLength: 100 })
    .string('source', { required: false, maxLength: 50 })
    .array('tags', { required: false, maxLength: 10, itemType: 'string' }),

  // API key validation
  apiKey: new ValidationSchema()
    .string('key', { required: true, minLength: 10, maxLength: 200 })
    .string('service', { required: true, maxLength: 50 }),

  // Search filters
  searchFilters: new ValidationSchema()
    .string('search', { required: false, maxLength: 100 })
    .array('tags', { required: false, maxLength: 20, itemType: 'string' })
    .string('createdAfter', { required: false, maxLength: 20 })
    .string('createdBefore', { required: false, maxLength: 20 })
};

// Helper function to create validation middleware
export const validateRequestBody = (schema) => (req, res, next) => {
  const result = schema.validate(req.body);
  
  if (!result.valid) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: result.errors
    });
  }

  // Replace req.body with sanitized data
  req.body = result.data;
  next();
};

// Helper function to validate query parameters
export const validateQueryParams = (schema) => (req, res, next) => {
  const result = schema.validate(req.query);
  
  if (!result.valid) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid query parameters',
      details: result.errors
    });
  }

  // Replace req.query with sanitized data
  req.query = result.data;
  next();
};

export { ValidationSchema };
export default ValidationSchema;