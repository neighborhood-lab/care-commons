# Task 0024: Form Validation Standardization Across Web and Mobile

**Priority**: 🟡 MEDIUM
**Phase**: Phase 3 - Polish & Developer Experience
**Estimated Effort**: 6-8 hours

## Context

Forms are implemented inconsistently across the web and mobile apps. Some use Zod schemas, some use custom validation, some have different error messages for the same validation. Standardizing validation improves UX consistency and developer speed.

## Problem Statement

**Current Issues**:
- Inconsistent validation messages
- Duplicate validation logic (web vs mobile)
- Different error formats
- No centralized validation schemas
- Accessibility concerns (error announcements)

**Impact**:
- Confusing user experience
- Harder to maintain
- Bugs from inconsistent validation
- Slower development (reinventing validation)

## Task

### 1. Create Shared Validation Schemas

**File**: `packages/shared/src/validation/schemas.ts`

```typescript
import { z } from 'zod';

// Common field validators
export const validators = {
  email: z.string().email('Please enter a valid email address'),

  phone: z.string().regex(
    /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
    'Please enter a valid phone number (e.g., 555-123-4567)'
  ),

  zipCode: z.string().regex(
    /^\d{5}(-\d{4})?$/,
    'Please enter a valid ZIP code (e.g., 78701 or 78701-1234)'
  ),

  ssn: z.string().regex(
    /^\d{3}-\d{2}-\d{4}$/,
    'Please enter a valid SSN (e.g., 123-45-6789)'
  ),

  uuid: z.string().uuid('Invalid ID format'),

  date: z.string().datetime('Please enter a valid date'),

  requiredString: (fieldName: string, minLength = 1) =>
    z.string().min(minLength, `${fieldName} is required`),

  optionalString: z.string().optional(),

  positiveNumber: (fieldName: string) =>
    z.number().positive(`${fieldName} must be a positive number`),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: (passwordField: string) =>
    z.string().refine((val) => val === passwordField, {
      message: 'Passwords do not match'
    })
};

// Client schema
export const clientSchema = z.object({
  first_name: validators.requiredString('First name', 2),
  last_name: validators.requiredString('Last name', 2),
  email: validators.email.optional(),
  phone: validators.phone,
  date_of_birth: validators.date,
  ssn: validators.ssn.optional(),
  address: z.object({
    street: validators.requiredString('Street address'),
    city: validators.requiredString('City'),
    state: z.enum(['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ']),
    zip: validators.zipCode
  }),
  emergency_contact: z.object({
    name: validators.requiredString('Emergency contact name'),
    phone: validators.phone,
    relationship: validators.requiredString('Relationship')
  }),
  notes: validators.optionalString
});

// Caregiver schema
export const caregiverSchema = z.object({
  first_name: validators.requiredString('First name', 2),
  last_name: validators.requiredString('Last name', 2),
  email: validators.email,
  phone: validators.phone,
  date_of_birth: validators.date,
  ssn: validators.ssn,
  certifications: z.array(z.string()).min(1, 'At least one certification required'),
  hourly_rate: validators.positiveNumber('Hourly rate'),
  address: z.object({
    street: validators.requiredString('Street address'),
    city: validators.requiredString('City'),
    state: z.enum(['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ']),
    zip: validators.zipCode
  })
});

// Visit schema
export const visitSchema = z.object({
  client_id: validators.uuid,
  caregiver_id: validators.uuid,
  scheduled_start: validators.date,
  scheduled_end: validators.date,
  service_type: z.enum(['personal_care', 'companionship', 'skilled_nursing', 'respite']),
  notes: validators.optionalString
}).refine(
  (data) => new Date(data.scheduled_end) > new Date(data.scheduled_start),
  {
    message: 'End time must be after start time',
    path: ['scheduled_end']
  }
);

// Care plan schema
export const carePlanSchema = z.object({
  client_id: validators.uuid,
  name: validators.requiredString('Plan name', 3),
  start_date: validators.date,
  end_date: validators.date.optional(),
  goals: validators.requiredString('Care goals', 10),
  status: z.enum(['draft', 'active', 'completed', 'cancelled'])
});

// Auth schemas
export const loginSchema = z.object({
  email: validators.email,
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  email: validators.email,
  password: validators.password,
  confirm_password: z.string(),
  first_name: validators.requiredString('First name'),
  last_name: validators.requiredString('Last name'),
  phone: validators.phone
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
});
```

### 2. Create Validation Hook (Web)

**File**: `packages/web/src/hooks/useFormValidation.ts`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const useFormValidation = <T extends z.ZodType>(schema: T) => {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onChange' // Re-validate on change after first submit
  });
};

// Usage
const ClientForm = () => {
  const { register, handleSubmit, formState: { errors } } = useFormValidation(clientSchema);

  const onSubmit = (data) => {
    console.log('Valid data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('first_name')}
        label="First Name"
        error={errors.first_name?.message}
      />
    </form>
  );
};
```

### 3. Create Validation Hook (Mobile)

**File**: `packages/mobile/src/hooks/useFormValidation.ts`

```typescript
import { useState } from 'react';
import { z } from 'zod';

export const useFormValidation = <T extends z.ZodType>(schema: T) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (data: z.infer<T>): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const validateField = (name: string, value: any): string | undefined => {
    try {
      // Validate single field
      const field = schema.shape[name];
      if (field) {
        field.parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
        return undefined;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message;
        setErrors((prev) => ({ ...prev, [name]: message }));
        return message;
      }
    }
  };

  const clearErrors = () => setErrors({});

  return { errors, validate, validateField, clearErrors };
};

// Usage
const ClientForm = () => {
  const [formData, setFormData] = useState({});
  const { errors, validate, validateField } = useFormValidation(clientSchema);

  const handleBlur = (field: string, value: any) => {
    validateField(field, value);
  };

  const handleSubmit = () => {
    if (validate(formData)) {
      // Submit form
    }
  };

  return (
    <View>
      <TextInput
        placeholder="First Name"
        onChangeText={(value) => setFormData({ ...formData, first_name: value })}
        onBlur={() => handleBlur('first_name', formData.first_name)}
      />
      {errors.first_name && <Text className="text-red-600">{errors.first_name}</Text>}
    </View>
  );
};
```

### 4. Create Standardized Form Components

**Web Input Component** (`packages/web/src/components/forms/Input.tsx`):

```typescript
import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps {
  label: string;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export const Input = React.forwardRef<
  HTMLInputElement,
  InputProps & UseFormRegisterReturn
>(({ label, error, type = 'text', placeholder, required, disabled, helperText, ...register }, ref) => {
  const inputId = `input-${label.replace(/\s/g, '-').toLowerCase()}`;

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <input
        id={inputId}
        ref={ref}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-2 border rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...register}
      />

      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});
```

**Mobile Input Component** (`packages/mobile/src/components/forms/Input.tsx`):

```typescript
import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required,
  helperText,
  ...props
}) => {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">
        {label} {required && <Text className="text-red-600">*</Text>}
      </Text>

      <TextInput
        className={`
          px-4 py-3 border rounded-lg
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
        aria-label={label}
        accessibilityLabel={label}
        {...props}
      />

      {error && (
        <Text className="mt-1 text-sm text-red-600" accessibilityRole="alert">
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text className="mt-1 text-sm text-gray-500">
          {helperText}
        </Text>
      )}
    </View>
  );
};
```

### 5. Add Real-Time Validation Feedback

Show validation status as user types:

```typescript
const PasswordInput = ({ value, onChange }) => {
  const requirements = {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value)
  };

  const allMet = Object.values(requirements).every(Boolean);

  return (
    <div>
      <Input
        label="Password"
        type="password"
        value={value}
        onChange={onChange}
      />

      <div className="mt-2 space-y-1">
        <RequirementItem met={requirements.length}>
          At least 8 characters
        </RequirementItem>
        <RequirementItem met={requirements.uppercase}>
          One uppercase letter
        </RequirementItem>
        <RequirementItem met={requirements.lowercase}>
          One lowercase letter
        </RequirementItem>
        <RequirementItem met={requirements.number}>
          One number
        </RequirementItem>
      </div>
    </div>
  );
};

const RequirementItem = ({ met, children }) => (
  <div className="flex items-center text-sm">
    {met ? (
      <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2" />
    ) : (
      <XCircleIcon className="w-4 h-4 text-gray-400 mr-2" />
    )}
    <span className={met ? 'text-green-600' : 'text-gray-600'}>{children}</span>
  </div>
);
```

### 6. Add Server-Side Validation

Ensure backend uses same schemas:

```typescript
// packages/app/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Usage
router.post('/clients', validate(clientSchema), async (req, res) => {
  // req.body is guaranteed to be valid
  const client = await clientService.create(req.body);
  res.json(client);
});
```

## Acceptance Criteria

- [ ] Shared validation schemas created
- [ ] Validation hooks for web (React Hook Form + Zod)
- [ ] Validation hooks for mobile (custom + Zod)
- [ ] Standardized Input components (web + mobile)
- [ ] Real-time validation feedback
- [ ] Server-side validation middleware
- [ ] Accessible error messages
- [ ] Consistent error styling
- [ ] Helper text support
- [ ] Required field indicators
- [ ] Tests for validation schemas
- [ ] Documentation for adding new forms

## Testing Checklist

1. **Validation Rules**:
   - Test all common validators (email, phone, etc.)
   - Test complex schemas (nested objects, refinements)
2. **User Experience**:
   - Errors show on blur
   - Errors clear when fixed
   - Submit button disabled until valid
3. **Accessibility**:
   - Screen reader announces errors
   - ARIA labels present
   - Keyboard navigation works

## Definition of Done

- ✅ All forms use shared validation schemas
- ✅ Consistent validation across web and mobile
- ✅ Accessible error handling
- ✅ Server-side validation matches client-side
- ✅ Tests passing
- ✅ Documentation complete

## Dependencies

**Blocks**: None
**Depends on**: None

## Priority Justification

This is **MEDIUM** priority because:
1. Improves developer speed (reusable schemas)
2. Better UX consistency
3. Reduces bugs from validation errors
4. Not production-blocking but valuable

---

**Next Task**: 0025 - Geocoding Automation
