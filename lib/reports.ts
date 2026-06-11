import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const BandsSchema = z.object({
  TR: z.number(),
  CC: z.number(),
  LR: z.number(),
  GRA: z.number(),
  overall: z.number(),
});

const SectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string(),
});

export const ReportRowSchema = z.object({
  id: z.string(),
  mode: z.enum(['guided', 'unguided']),
  topic: z.string(),
  essay: z.string(),
  word_count: z.number(),
  band_overall: z.number().nullable(),
  bands: BandsSchema.nullable(),
  feedback: z.unknown(),
  sections: z.array(SectionSchema).nullable(),
  created_at: z.string(),
});

export const ReportSummarySchema = ReportRowSchema.omit({
  essay: true,
  feedback: true,
  sections: true,
});

export type ReportRow = z.infer<typeof ReportRowSchema>;
export type ReportSummary = z.infer<typeof ReportSummarySchema>;
export type ReportBands = z.infer<typeof BandsSchema>;

export interface SaveReportInput {
  mode: 'guided' | 'unguided';
  topic: string;
  essay: string;
  wordCount: number;
  bands: ReportBands | null;
  feedback: unknown;
  sections?: Array<{ id: string; label: string; text: string }>;
}

export async function saveReport(
  input: SaveReportInput,
  existingId?: string | null
): Promise<{ id: string } | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const row = {
    user_id: user.id,
    mode: input.mode,
    topic: input.topic,
    essay: input.essay,
    word_count: input.wordCount,
    band_overall: input.bands?.overall ?? null,
    bands: input.bands,
    feedback: input.feedback,
    sections: input.sections ?? null,
  };

  if (existingId) {
    const { error } = await supabase.from('reports').update(row).eq('id', existingId);
    if (error) throw new Error(error.message);
    return { id: existingId };
  }

  const { data, error } = await supabase
    .from('reports')
    .insert(row)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { id: (data as { id: string }).id };
}
