export type EntityKind = "clients" | "employees";

export const dayOfWeekOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const;

export type DayOfWeek = (typeof dayOfWeekOptions)[number]["value"];

export type EmployeeRequestedSchedule = DayOfWeek[];

export type ClientRequestedScheduleEntry = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

export type ClientRequestedSchedule = ClientRequestedScheduleEntry[];

export type PersonSummary = {
  id: string;
  firstName: string;
  lastName: string;
};

export type ClientRequestedScheduleRow = {
  id: string;
  dayOfWeek: DayOfWeek | "";
  startTime: string;
  endTime: string;
};

export type ClientAssignedScheduleEntry = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  employeeId: string;
  employeeName: string;
};

export type EmployeeAssignedScheduleEntry = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  clientId: string;
  clientName: string;
};

export type ClientAssignedScheduleResponse = {
  weekOf: string;
  schedule: ClientAssignedScheduleEntry[];
};

export type EmployeeAssignedScheduleResponse = {
  weekOf: string;
  schedule: EmployeeAssignedScheduleEntry[];
};

export type EmployeesAvailableByDayResponse = {
  availableEmployeesByDay: Record<DayOfWeek, PersonSummary[]>;
};

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
  requestedSchedule?: EmployeeRequestedSchedule | ClientRequestedSchedule;
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
