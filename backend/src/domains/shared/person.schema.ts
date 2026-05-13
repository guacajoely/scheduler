import { z } from "zod";

export const requiredTrimmedString = (fieldLabel: string, maxLength = 255) =>
  z
    .string()
    .trim()
    .min(1, { message: `${fieldLabel} is required` })
    .max(maxLength, {
      message: `${fieldLabel} must be at most ${maxLength} characters`,
    });

export const optionalTrimmedString = (fieldLabel: string, maxLength = 255) =>
  z.union([requiredTrimmedString(fieldLabel, maxLength), z.null()]).optional();

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(7)
  .max(25)
  .regex(/^[0-9()+\-\s.]+$/, {
    message: "Phone number can only include digits and + ( ) - . spaces",
  });

export const usPostalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}(?:-\d{4})?$/, {
    message: "Postal code must be a valid US ZIP code (12345 or 12345-6789)",
  });

export const basePersonSchema = z.object({
  firstName: requiredTrimmedString("First name", 100),
  lastName: requiredTrimmedString("Last name", 100),
  email: requiredTrimmedString("Email", 254).toLowerCase().pipe(z.email()),
  phoneNumber: phoneNumberSchema,
  addressLine1: requiredTrimmedString("Address line 1", 200),
  addressLine2: optionalTrimmedString("Address line 2", 200),
  city: requiredTrimmedString("City", 120),
  state: requiredTrimmedString("State", 2)
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, {
      message: "State must be a 2-letter uppercase code",
    }),
  postalCode: usPostalCodeSchema,
});
