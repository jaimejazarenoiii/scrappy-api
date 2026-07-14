import { z } from 'zod';

export const completeTripSchema = z.object({
  note: z.string().max(500).optional(),
  endingOdometer: z.number().nonnegative().optional(),
});

export type CompleteTripRequestDto = z.infer<typeof completeTripSchema>;
