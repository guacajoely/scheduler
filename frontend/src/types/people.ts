export type EntityKind = "clients" | "employees";

export type PersonEntity = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  createdAt: string;
  updatedAt: string;
};

export type PersonFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

export type PaginatedPeopleResponse = {
  items: PersonEntity[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const emptyPersonForm: PersonFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
};
