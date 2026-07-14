import { z } from 'zod';

export const startTripSchema = z.object({
  note: z.string().max(500).optional(),
  startingOdometer: z.number().nonnegative().optional(),
});

export type StartTripRequestDto = z.infer<typeof startTripSchema>;
