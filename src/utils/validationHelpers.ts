import { z } from 'zod';
import { ValidationResult } from '../types';

/**
 * Converte um ZodError no formato esperado por ValidationResult.
 */
export function zodToValidationResult<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { isValid: true, data: result.data } as ValidationResult<T>;
  }
  const errors: Record<string, string> = {};
  result.error.errors.forEach(err => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return { isValid: false, errors } as ValidationResult<T>;
}

/**
 * Refinamento: garante que a data de início seja anterior à data de fim.
 * Aceita strings ISO ou objetos Date.
 */
export function dateBefore<Ref extends string | Date>(ref: Ref) {
  return (value: string | Date) => {
    const other = typeof ref === 'string' ? new Date(ref) : ref;
    const valueDate = typeof value === 'string' ? new Date(value) : value;
    return valueDate < other;
  };
}

/**
 * Cria um esquema Zod a partir de um enum TypeScript (string union).
 */
export function zodEnum<T extends readonly string[]>(values: T) {
  // @ts-ignore - Zod aceita union de literais
  return z.enum(values);
}