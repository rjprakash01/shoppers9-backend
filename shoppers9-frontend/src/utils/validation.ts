import * as yup from 'yup';

// Common validation patterns
export const validationPatterns = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  postalCode: /^[1-9][0-9]{5}$/,
  panCard: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
};

// Common validation messages
export const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  password: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
  passwordConfirm: 'Passwords do not match',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`,
  postalCode: 'Please enter a valid postal code',
  panCard: 'Please enter a valid PAN card number',
  gst: 'Please enter a valid GST number'
};

// Auth validation schemas
export const authValidationSchemas = {
  login: yup.object({
    email: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.email, validationMessages.email),
    password: yup
      .string()
      .required(validationMessages.required)
      .min(6, validationMessages.minLength(6))
  }),

  register: yup.object({
    name: yup
      .string()
      .required(validationMessages.required)
      .min(2, validationMessages.minLength(2))
      .max(50, validationMessages.maxLength(50)),
    email: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.email, validationMessages.email),
    phone: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.phone, validationMessages.phone),
    password: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.password, validationMessages.password),
    confirmPassword: yup
      .string()
      .required(validationMessages.required)
      .oneOf([yup.ref('password')], validationMessages.passwordConfirm)
  }),

  forgotPassword: yup.object({
    email: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.email, validationMessages.email)
  }),

  resetPassword: yup.object({
    password: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.password, validationMessages.password),
    confirmPassword: yup
      .string()
      .required(validationMessages.required)
      .oneOf([yup.ref('password')], validationMessages.passwordConfirm)
  })
};

// Profile validation schemas
export const profileValidationSchemas = {
  updateProfile: yup.object({
    name: yup
      .string()
      .required(validationMessages.required)
      .min(2, validationMessages.minLength(2))
      .max(50, validationMessages.maxLength(50)),
    email: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.email, validationMessages.email),
    phone: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.phone, validationMessages.phone),
    dateOfBirth: yup
      .date()
      .nullable()
      .max(new Date(), 'Date of birth cannot be in the future')
  }),

  changePassword: yup.object({
    currentPassword: yup
      .string()
      .required(validationMessages.required),
    newPassword: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.password, validationMessages.password),
    confirmPassword: yup
      .string()
      .required(validationMessages.required)
      .oneOf([yup.ref('newPassword')], validationMessages.passwordConfirm)
  })
};

// Address validation schema
export const addressValidationSchema = yup.object({
  name: yup
    .string()
    .required(validationMessages.required)
    .min(2, validationMessages.minLength(2)),
  phone: yup
    .string()
    .required(validationMessages.required)
    .matches(validationPatterns.phone, validationMessages.phone),
  addressLine1: yup
    .string()
    .required(validationMessages.required)
    .min(5, validationMessages.minLength(5)),
  addressLine2: yup
    .string()
    .optional(),
  city: yup
    .string()
    .required(validationMessages.required)
    .min(2, validationMessages.minLength(2)),
  state: yup
    .string()
    .required(validationMessages.required),
  postalCode: yup
    .string()
    .required(validationMessages.required)
    .matches(validationPatterns.postalCode, validationMessages.postalCode),
  country: yup
    .string()
    .required(validationMessages.required)
    .default('India'),
  isDefault: yup
    .boolean()
    .default(false)
});

// Checkout validation schema
export const checkoutValidationSchema = yup.object({
  shippingAddress: addressValidationSchema,
  billingAddress: addressValidationSchema.optional(),
  useSameAddress: yup.boolean().default(true),
  paymentMethod: yup
    .string()
    .required(validationMessages.required)
    .oneOf(['card', 'upi', 'netbanking', 'cod'], 'Please select a valid payment method'),
  cardDetails: yup.object({
    cardNumber: yup
      .string()
      .when('$paymentMethod', {
        is: 'card',
        then: (schema) => schema.required(validationMessages.required).min(16, 'Card number must be 16 digits'),
        otherwise: (schema) => schema.optional()
      }),
    expiryDate: yup
      .string()
      .when('$paymentMethod', {
        is: 'card',
        then: (schema) => schema.required(validationMessages.required),
        otherwise: (schema) => schema.optional()
      }),
    cvv: yup
      .string()
      .when('$paymentMethod', {
        is: 'card',
        then: (schema) => schema.required(validationMessages.required).min(3, 'CVV must be 3 digits'),
        otherwise: (schema) => schema.optional()
      }),
    cardholderName: yup
      .string()
      .when('$paymentMethod', {
        is: 'card',
        then: (schema) => schema.required(validationMessages.required),
        otherwise: (schema) => schema.optional()
      })
  }).optional()
});

// Contact/Support validation schema
export const contactValidationSchema = yup.object({
  name: yup
    .string()
    .required(validationMessages.required)
    .min(2, validationMessages.minLength(2)),
  email: yup
    .string()
    .required(validationMessages.required)
    .matches(validationPatterns.email, validationMessages.email),
  phone: yup
    .string()
    .optional()
    .matches(validationPatterns.phone, validationMessages.phone),
  subject: yup
    .string()
    .required(validationMessages.required)
    .min(5, validationMessages.minLength(5)),
  message: yup
    .string()
    .required(validationMessages.required)
    .min(10, validationMessages.minLength(10))
    .max(1000, validationMessages.maxLength(1000)),
  category: yup
    .string()
    .required(validationMessages.required)
    .oneOf(['general', 'order', 'product', 'payment', 'technical'], 'Please select a valid category')
});

// Product review validation schema
export const reviewValidationSchema = yup.object({
  rating: yup
    .number()
    .required(validationMessages.required)
    .min(1, 'Please provide a rating')
    .max(5, 'Rating cannot be more than 5'),
  title: yup
    .string()
    .required(validationMessages.required)
    .min(5, validationMessages.minLength(5))
    .max(100, validationMessages.maxLength(100)),
  comment: yup
    .string()
    .required(validationMessages.required)
    .min(10, validationMessages.minLength(10))
    .max(500, validationMessages.maxLength(500))
});

// Newsletter subscription validation
export const newsletterValidationSchema = yup.object({
  email: yup
    .string()
    .required(validationMessages.required)
    .matches(validationPatterns.email, validationMessages.email)
});

// Search validation schema
export const searchValidationSchema = yup.object({
  query: yup
    .string()
    .required('Please enter a search term')
    .min(2, 'Search term must be at least 2 characters')
    .max(100, 'Search term cannot exceed 100 characters')
});

// Utility function to get validation schema by name
export const getValidationSchema = (schemaName: string) => {
  const schemas: Record<string, yup.AnySchema> = {
    // Auth schemas
    'auth.login': authValidationSchemas.login,
    'auth.register': authValidationSchemas.register,
    'auth.forgotPassword': authValidationSchemas.forgotPassword,
    'auth.resetPassword': authValidationSchemas.resetPassword,
    
    // Profile schemas
    'profile.update': profileValidationSchemas.updateProfile,
    'profile.changePassword': profileValidationSchemas.changePassword,
    
    // Other schemas
    'address': addressValidationSchema,
    'checkout': checkoutValidationSchema,
    'contact': contactValidationSchema,
    'review': reviewValidationSchema,
    'newsletter': newsletterValidationSchema,
    'search': searchValidationSchema
  };

  return schemas[schemaName];
};