import { z } from 'zod';

export const FindingSchema = z.object({
  evidenceQuote: z.string().min(1),
  issue: z.string().min(1),
  suggestion: z.string().min(1),
  severity: z.enum(['minor', 'major']),
  rubricCriterion: z.enum(['TR', 'CC', 'LR', 'GRA']),
});

const BandScoreSchema = z.number().min(0).max(9).multipleOf(0.5);

export const StageFeedbackSchema = z.object({
  rating: z.enum(['strong', 'okay', 'needs_improvement']),
  summary: z.string(),
  findings: z.array(FindingSchema),
  rewriteExample: z.string().optional(),
  // synthesis-only fields — absent on all other stages
  bands: z.object({
    TR: BandScoreSchema,
    CC: BandScoreSchema,
    LR: BandScoreSchema,
    GRA: BandScoreSchema,
    overall: BandScoreSchema,
  }).optional(),
  topImprovements: z.array(z.string()).optional(),
  meta: z.object({
    wordCount: z.number().int().nonnegative(),
    targetWordCount: z.object({
      min: z.number().int(),
      max: z.number().int(),
    }).optional(),
  }),
});

export const HookFeedbackSchema = StageFeedbackSchema.extend({
  hook_type_detected: z.enum([
    'statistic', 'claim', 'question', 'definition', 'scenario', 'generic', 'none'
  ]),
});

export const FullEssayFeedbackSchema = z.object({
  bands: z.object({
    TR: BandScoreSchema,
    CC: BandScoreSchema,
    LR: BandScoreSchema,
    GRA: BandScoreSchema,
    overall: BandScoreSchema,
  }),
  paragraphFeedback: z.array(z.object({
    paragraph: z.string().min(1),
    findings: z.array(FindingSchema),
  })),
  topImprovements: z.array(z.string().min(1)),
});
