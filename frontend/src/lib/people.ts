import type { PersonFormValues } from "@/types/people";

export const buildPersonPayload = (formValues: PersonFormValues) => ({
  firstName: formValues.firstName.trim(),
  lastName: formValues.lastName.trim(),
  email: formValues.email.trim(),
  phoneNumber: formValues.phoneNumber.trim(),
  addressLine1: formValues.addressLine1.trim(),
  addressLine2: formValues.addressLine2.trim()
    ? formValues.addressLine2.trim()
    : null,
  city: formValues.city.trim(),
  state: formValues.state.trim(),
  postalCode: formValues.postalCode.trim(),
});
