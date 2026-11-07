import { isValidDateOnly, localDateKey } from '../utils/dateOnly.js';

export const allowedSlots = [
  'Before Breakfast',
  'After Breakfast',
  'Before Lunch',
  'After Lunch',
  'Before Dinner',
  'After Dinner',
  'Bedtime',
];

export function validateReadingInput(data) {
  const errors = [];
  const { date, time, slot, glucoseValue, notes } = data;

  if (!date) errors.push('Date is required');
  if (!time) errors.push('Time is required');
  if (!slot) errors.push('Slot is required');
  if (glucoseValue === undefined || glucoseValue === null) errors.push('Glucose value is required');

  if (date) {
    if (!isValidDateOnly(date)) errors.push('Invalid date format');
    else if (date > localDateKey()) errors.push('Future dates are not allowed');
  }

  if (time) {
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) errors.push('Invalid time format (HH:mm)');
  }

  if (slot && !allowedSlots.includes(slot)) errors.push('Invalid slot value');

  if (glucoseValue !== undefined && glucoseValue !== null) {
    if (typeof glucoseValue !== 'number' || !Number.isFinite(glucoseValue)) errors.push('Glucose value must be a number');
    else if (glucoseValue <= 0 || glucoseValue > 600) errors.push('Glucose value must be between 1 and 600');
    else if (!Number.isInteger(glucoseValue)) errors.push('Glucose value must be a whole number');
  }

  if (notes !== undefined && notes !== null && (typeof notes !== 'string' || notes.length > 500)) {
    errors.push('Notes must be 500 characters or fewer');
  }

  return errors;
}


