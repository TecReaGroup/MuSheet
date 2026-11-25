import { z } from 'zod';

export const INSTRUMENTS = ['vocal', 'keyboard', 'guitar', 'bass', 'drums', 'custom'] as const;
export const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '9/8', '12/8'] as const;
export const SORT_KEYS = ['created', 'title', 'opened'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;
export const ANNOTATION_TOOLS = ['pen', 'highlighter'] as const;

export const BPM_MIN = 20;
export const BPM_MAX = 300;
export const TITLE_MAX_LENGTH = 120;
export const MAX_STROKES_PER_PAGE = 2000;
export const MAX_POINTS_PER_STROKE = 5000;

export type Instrument = (typeof INSTRUMENTS)[number];
export type TimeSignature = (typeof TIME_SIGNATURES)[number];
export type SortKey = (typeof SORT_KEYS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const titleSchema = z.string().trim().min(1).max(TITLE_MAX_LENGTH);
const composerSchema = z.string().trim().max(TITLE_MAX_LENGTH);

const instrumentFields = {
  instrument: z.enum(INSTRUMENTS),
  customLabel: z.string().trim().min(1).max(40).nullable(),
};

// A custom label exists exactly when the instrument is "custom"; the DB enforces the same rule.
function hasConsistentLabel(value: { instrument: Instrument; customLabel: string | null }) {
  return (value.instrument === 'custom') === (value.customLabel !== null);
}
const INSTRUMENT_LABEL_ISSUE = { message: 'customLabel is required only for custom instruments', path: ['customLabel'] };

// ---------- Requests ----------

export const idParamSchema = z.object({ id: z.uuid() });
export const sha256ParamSchema = z.object({ sha256: sha256Schema });

export const listQuerySchema = z.object({
  query: z.string().trim().max(TITLE_MAX_LENGTH).optional(),
  sort: z.enum(SORT_KEYS).default('created'),
  order: z.enum(SORT_ORDERS).default('desc'),
  limit: z.coerce.number().int().min(1).max(500).default(500),
});
// Written out because z.coerce inputs are typed `unknown`; this is what callers actually send.
export interface ListQuery {
  query?: string;
  sort?: SortKey;
  order?: SortOrder;
  limit?: number;
}

export const pdfUploadQuerySchema = z.object({ pageCount: z.coerce.number().int().min(1).max(5000) });

export const scoreImportRequestSchema = z.object({
  title: titleSchema,
  composer: composerSchema.default(''),
  pdfSha256: sha256Schema,
  ...instrumentFields,
}).refine(hasConsistentLabel, INSTRUMENT_LABEL_ISSUE);
export type ScoreImportRequest = z.input<typeof scoreImportRequestSchema>;

export const scoreUpdateRequestSchema = z.object({
  title: titleSchema,
  composer: composerSchema,
  bpm: z.number().int().min(BPM_MIN).max(BPM_MAX),
  timeSignature: z.enum(TIME_SIGNATURES),
}).partial();
export type ScoreUpdateRequest = z.input<typeof scoreUpdateRequestSchema>;

export const partCreateRequestSchema = z.object({
  pdfSha256: sha256Schema,
  ...instrumentFields,
}).refine(hasConsistentLabel, INSTRUMENT_LABEL_ISSUE);
export type PartCreateRequest = z.input<typeof partCreateRequestSchema>;

export const partOrderRequestSchema = z.object({ partIds: z.array(z.uuid()).min(1) });

const descriptionSchema = z.string().trim().max(500);

export const setlistCreateRequestSchema = z.object({
  name: titleSchema,
  description: descriptionSchema.default(''),
});
export type SetlistCreateRequest = z.input<typeof setlistCreateRequestSchema>;

// Built without defaults so a partial update never silently resets omitted fields.
export const setlistUpdateRequestSchema = z.object({
  name: titleSchema,
  description: descriptionSchema,
}).partial();
export type SetlistUpdateRequest = z.input<typeof setlistUpdateRequestSchema>;

export const setlistItemsRequestSchema = z.object({ scoreIds: z.array(z.uuid()).max(500) });
export const setlistAppendRequestSchema = z.object({ scoreId: z.uuid() });

export const annotationPageParamSchema = z.object({
  id: z.uuid(),
  page: z.coerce.number().int().min(1),
});

/** Points are [x, y, pressure] with x/y normalised to 0..1 of the page so strokes survive any zoom or device size. */
export const strokeSchema = z.object({
  tool: z.enum(ANNOTATION_TOOLS),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  width: z.number().positive().max(0.1),
  points: z.array(z.tuple([z.number(), z.number(), z.number()])).min(1).max(MAX_POINTS_PER_STROKE),
});
export type Stroke = z.infer<typeof strokeSchema>;
export type AnnotationTool = Stroke['tool'];

export const annotationPageRequestSchema = z.object({
  strokes: z.array(strokeSchema).max(MAX_STROKES_PER_PAGE),
});

export const clientLogRequestSchema = z.object({
  level: z.enum(['warn', 'error']),
  module: z.string().max(60),
  message: z.string().max(500),
  fields: z.record(z.string(), z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])).default({}),
});

export const loginRequestSchema = z.object({
  account: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(200),
});
export type LoginRequest = z.input<typeof loginRequestSchema>;

// ---------- Responses ----------

export interface SessionView {
  account: string;
}

export interface PdfFileView {
  sha256: string;
  pageCount: number;
  hasThumbnail: boolean;
}

export interface PartView extends PdfFileView {
  id: string;
  instrument: Instrument;
  customLabel: string | null;
}

export interface ScoreSummary {
  id: string;
  title: string;
  composer: string;
  bpm: number;
  timeSignature: TimeSignature;
  createdAt: string;
  lastOpenedAt: string | null;
  parts: PartView[];
}

export interface SetlistReference {
  id: string;
  name: string;
}

export interface ScoreDetail extends ScoreSummary {
  setlists: SetlistReference[];
}

export interface ScoreImportResponse {
  score: ScoreSummary;
  partId: string;
  joinedExistingScore: boolean;
}

export interface SetlistSummary extends SetlistReference {
  description: string;
  createdAt: string;
  lastOpenedAt: string | null;
  scoreCount: number;
}

export interface SetlistDetail extends SetlistSummary {
  scores: ScoreSummary[];
}

export interface ViewerPart {
  partId: string;
  score: ScoreSummary;
}

export interface AnnotationBook {
  /** Keyed by 1-based page number. */
  pages: Record<string, Stroke[]>;
}

export interface ApiErrorBody {
  error: string;
  message: string;
}
