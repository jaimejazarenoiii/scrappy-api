import { optionalNoteSchema } from '../../../../validations/workforce.schemas.js';

export interface TimeInRequestDto {
  note?: string;
}

export const timeInRequestShape = {
  note: optionalNoteSchema,
};

export interface TimeOutRequestDto {
  note?: string;
}

export const timeOutRequestShape = {
  note: optionalNoteSchema,
};

export interface ManageAttendanceRequestDto {
  correctionNote?: string;
  adjustedTimeInAt?: string;
  adjustedTimeOutAt?: string;
}
