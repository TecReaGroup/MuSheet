import { z } from 'zod';

export const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '9/8', '12/8'] as const;
export const SORT_KEYS = ['created', 'title', 'opened'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;
export const ANNOTATION_TOOLS = ['pen', 'highlighter'] as const;
// `personal` is the caller's private library; `team` is shared by every account.
export const SPACES = ['personal', 'team'] as const;
export const AVATAR_PRESETS = ['note', 'piano', 'guitar', 'drum', 'mic', 'headphones', 'disc', 'wave'] as const;

export const BPM_MIN = 20;
export const BPM_MAX = 300;
export const TITLE_MAX_LENGTH = 120;
export const MAX_STROKES_PER_PAGE = 2000;
export const MAX_POINTS_PER_STROKE = 5000;
export const ACCOUNT_MAX_LENGTH = 40;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;
export const AVATAR_IMAGE_MAX_BYTES = 1024 * 1024;
export const PART_NAME_MAX_LENGTH = 40;
export const PART_NAME_LIST_MAX_SIZE = 100;

export type TimeSignature = (typeof TIME_SIGNATURES)[number];
export type SortKey = (typeof SORT_KEYS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];
export type AvatarPreset = (typeof AVATAR_PRESETS)[number];
export type Space = (typeof SPACES)[number];

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const titleSchema = z.string().trim().min(1).max(TITLE_MAX_LENGTH);
const composerSchema = z.string().trim().max(TITLE_MAX_LENGTH);

const partNameSchema = z.string().trim().min(1).max(PART_NAME_MAX_LENGTH);

// ---------- Requests ----------

export const idParamSchema = z.object({ id: z.uuid() });
export const sha256ParamSchema = z.object({ sha256: sha256Schema });

export const listQuerySchema = z.object({
  space: z.enum(SPACES).default('personal'),
  query: z.string().trim().max(TITLE_MAX_LENGTH).optional(),
  sort: z.enum(SORT_KEYS).default('created'),
  order: z.enum(SORT_ORDERS).default('desc'),
  limit: z.coerce.number().int().min(1).max(500).default(500),
});
// Written out because z.coerce inputs are typed `unknown`; this is what callers actually send.
export interface ListQuery {
  space?: Space;
  query?: string;
  sort?: SortKey;
  order?: SortOrder;
  limit?: number;
}

export const pdfUploadQuerySchema = z.object({ pageCount: z.coerce.number().int().min(1).max(5000) });

export const scoreImportRequestSchema = z.object({
  space: z.enum(SPACES),
  title: titleSchema,
  composer: composerSchema.default(''),
  pdfSha256: sha256Schema,
  partName: partNameSchema,
});
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
  partName: partNameSchema,
});
export type PartCreateRequest = z.input<typeof partCreateRequestSchema>;

export const partOrderRequestSchema = z.object({ partIds: z.array(z.uuid()).min(1) });

// The shared part name list is replaced as a whole; names are unique ignoring case so the picker never shows look-alikes.
export const partNameListRequestSchema = z.object({
  names: z.array(partNameSchema).min(1).max(PART_NAME_LIST_MAX_SIZE)
    .refine(names => new Set(names.map(name => name.toLowerCase())).size === names.length, 'Part names must be unique'),
});
export type PartNameListRequest = z.input<typeof partNameListRequestSchema>;

const descriptionSchema = z.string().trim().max(500);

export const setlistCreateRequestSchema = z.object({
  space: z.enum(SPACES),
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

/** Copies personal scores into the team library; the copies share PDF files but nothing else. */
export const teamCopyRequestSchema = z.object({ scoreIds: z.array(z.uuid()).min(1).max(200) });
export type TeamCopyRequest = z.input<typeof teamCopyRequestSchema>;

/** Copies personal setlists into Team together with their scores, which are copied once even if shared between setlists. */
export const teamSetlistCopyRequestSchema = z.object({ setlistIds: z.array(z.uuid()).min(1).max(100) });
export type TeamSetlistCopyRequest = z.input<typeof teamSetlistCopyRequestSchema>;

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

// ASCII letters, digits, dot, dash and underscore keep account names typeable on any login keyboard.
const accountNameSchema = z.string().trim().min(1).max(ACCOUNT_MAX_LENGTH).regex(/^[A-Za-z0-9._-]+$/);
const newPasswordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);

export const accountRenameRequestSchema = z.object({ account: accountNameSchema });
export type AccountRenameRequest = z.input<typeof accountRenameRequestSchema>;

export const passwordChangeRequestSchema = z.object({
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  newPassword: newPasswordSchema,
});
export type PasswordChangeRequest = z.input<typeof passwordChangeRequestSchema>;

export const avatarPresetRequestSchema = z.object({ preset: z.enum(AVATAR_PRESETS) });
export type AvatarPresetRequest = z.input<typeof avatarPresetRequestSchema>;

export const userCreateRequestSchema = z.object({ account: accountNameSchema, password: newPasswordSchema });
export type UserCreateRequest = z.input<typeof userCreateRequestSchema>;

export const userPasswordResetRequestSchema = z.object({ password: newPasswordSchema });
export type UserPasswordResetRequest = z.input<typeof userPasswordResetRequestSchema>;

export const userIdParamSchema = z.object({ userId: z.uuid() });

// ---------- Responses ----------

/** `letter` is the default: the first character of the account name. */
export type AvatarView =
  | { kind: 'letter' }
  | { kind: 'preset'; preset: AvatarPreset }
  | { kind: 'image'; url: string };

export interface UserView {
  id: string;
  account: string;
  avatar: AvatarView;
}

export interface SessionView extends UserView {
  /** Root's credentials live in .env, so it cannot rename itself or change its password here. */
  isRoot: boolean;
}

export interface ManagedUserView extends UserView {
  createdAt: string;
}

/** Whole-server totals for root; personal counts sum every member's library. */
export interface LibraryStatView {
  userCount: number;
  score: Record<Space, number>;
  setlist: Record<Space, number>;
  partCount: number;
  annotatedPageCount: number;
  pdfFileCount: number;
  pdfByteSize: number;
}

export interface PdfFileView {
  sha256: string;
  pageCount: number;
  hasThumbnail: boolean;
}

export interface PartView extends PdfFileView {
  id: string;
  name: string;
}

export interface ScoreSummary {
  id: string;
  space: Space;
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
  space: Space;
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
