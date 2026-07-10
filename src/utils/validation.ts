import { z } from 'zod';

// ==================== ENUMS (Zod) ====================
export const RelationshipTypeEnum = z.enum([
  'father',
  'mother',
  'son',
  'daughter',
  'spouse',
  'sibling',
  'grandfather',
  'grandmother',
  'grandson',
  'granddaughter',
  'uncle',
  'aunt',
  'nephew',
  'niece',
  'cousin'
] as const);

export const EventTypeEnum = z.enum([
  'birth',
  'death',
  'marriage',
  'divorce',
  'adoption',
  'immigration',
  'other'
] as const);

export const DocumentTypeEnum = z.enum([
  'birth_certificate',
  'death_certificate',
  'marriage_certificate',
  'photo',
  'letter',
  'other'
] as const);

export const SourceReliabilityEnum = z.enum(['high', 'medium', 'low'] as const);

export const NotificationTipoEnum = z.enum(['info', 'sucesso', 'aviso', 'erro'] as const);

// ==================== USER SCHEMAS ====================
export const userRegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

// ==================== PERSON SCHEMAS ====================
export const personSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  birthPlace: z.string().optional(),
  deathPlace: z.string().optional(),
  occupation: z.string().optional(),
  notes: z.string().optional(),
});

export const personCreateSchema = personSchema.extend({
  familyId: z.string().min(1, 'Família é obrigatória'),
});

// ==================== FAMILY SCHEMAS ====================
export const familySchema = z.object({
  name: z.string().min(1, 'Nome da família é obrigatório'),
  description: z.string().optional(),
});

export const familyCreateSchema = familySchema.extend({
  ownerId: z.string().min(1, 'Proprietário é obrigatório'),
});

// ==================== RELATIONSHIP SCHEMA ====================
export const relationshipSchema = z.object({
  familyId: z.string().min(1, 'Família é obrigatória'),
  fromPersonId: z.string().min(1, 'Pessoa de origem é obrigatória'),
  toPersonId: z.string().min(1, 'Pessoa de destino é obrigatória'),
  type: RelationshipTypeEnum,
}).refine(
  data => data.fromPersonId !== data.toPersonId,
  { message: 'Uma pessoa não pode se relacionar consigo mesma', path: ['toPersonId'] }
);

// ==================== EVENT SCHEMA ====================
export const eventSchema = z.object({
  familyId: z.string().min(1, 'Família é obrigatória'),
  personId: z.string().optional(),
  type: EventTypeEnum,
  date: z.string().optional().refine(
    val => !val || !isNaN(Date.parse(val)),
    { message: 'Data inválida' }
  ),
  place: z.string().optional(),
  description: z.string().optional(),
  sources: z.array(z.string()).optional(), // IDs de fontes
}).refine(
  data => !(data.type === 'birth' && !data.personId),
  { message: 'Evento de nascimento deve estar ligado a uma pessoa', path: ['personId'] }
);

// ==================== DOCUMENT SCHEMA ====================
export const documentSchema = z.object({
  familyId: z.string().min(1, 'Família é obrigatória'),
  personId: z.string().optional(),
  type: DocumentTypeEnum,
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  fileData: z.string().optional(), // Base64
});

// ==================== SOURCE SCHEMA ====================
export const sourceSchema = z.object({
  familyId: z.string().min(1, 'Família é obrigatória'),
  personId: z.string().optional(),
  documentId: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  author: z.string().optional(),
  publication: z.string().optional(),
  repository: z.string().optional(),
  citation: z.string().optional(),
  reliability: SourceReliabilityEnum.optional(),
  transcribedText: z.string().optional(),
});

// ==================== NOTIFICATION SCHEMA ====================
export const notificationSchema = z.object({
  userId: z.string().optional(),
  tipo: NotificationTipoEnum,
  titulo: z.string().min(1, 'Título é obrigatório'),
  mensagem: z.string().min(1, 'Mensagem é obrigatória'),
  lida: z.boolean().default(false),
  criadaEm: z.string().default(() => new Date().toISOString()),
  linkDestino: z.string().optional(),
});

// ==================== TRANSCRIPTION SCHEMAS (mantidos) ====================
export const transcriptionResultSchema = z.object({
  transcricao: z.string().min(1, 'O resultado da transcrição não pode ser vazio'),
  confidence: z.number().min(0).max(1).optional(),
  language: z.string().optional(),
});

export const transcriptionRequestSchema = z.object({
  imageData: z.string().min(1, 'Imagem é obrigatória'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']).optional(),
  instruction: z.string().optional(),
    provider: z.enum(['groq', 'mistral', 'openrouter', 'nvidia']).optional(),
});

// ==================== TYPE INFERENCE ====================
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type PersonInput = z.infer<typeof personSchema>;
export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type FamilyInput = z.infer<typeof familySchema>;
export type FamilyCreateInput = z.infer<typeof familyCreateSchema>;
export type RelationshipInput = z.infer<typeof relationshipSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type SourceInput = z.infer<typeof sourceSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type TranscriptionResult = z.infer<typeof transcriptionResultSchema>;
export type TranscriptionRequest = z.infer<typeof transcriptionRequestSchema>;

// ==================== VALIDATION HELPERS ====================
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return { success: false, errors };
}

export function validateField(
  _schema: z.ZodSchema<unknown>,
  _fieldName: string,
  _value: unknown
): string | null {
  return null;
}
