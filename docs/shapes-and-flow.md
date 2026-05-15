# Shapes and Flow

This document explains the main domain/data shapes and the current scheduling workflow.

## People Model: Shared Core Fields
Both **clients** and **employees** are treated as "people" with the same base profile fields:
- first/last name
- email
- phone
- address (line1/line2, city, state, postalCode)

In the frontend, this is reflected by shared form state (`PersonFormValues`) and one shared page component:

- `frontend/src/features/people/person-form-page.tsx`

The page switches behavior based on `entityKind` (`clients` vs `employees`), but the base form is reused.

## Requested Schedule: Client vs Employee
The biggest model difference is `requestedSchedule`.

## Employee Requested Schedule
- Shape: `DayOfWeek[]`
- availability by day only
- Example: `["monday", "wednesday", "friday"]`
- UI: checkbox picker

## Client Requested Schedule
- Shape: array of day + start + end entries
- Type: `ClientRequestedScheduleEntry[]`
- Example:
  - `{ dayOfWeek: "monday", startTime: "09:00", endTime: "15:00" }`
- UI: row editor with day and times
- Current Validation:
  - no duplicate day rows
  - start and end required together
  - end must be after start

## Assigned Schedule: What Gets Produced

Requested schedules become **assigned schedules** when employees are matched to each client's requested time blocks.
- Client assigned entry includes:
  - day, start, end, `employeeId`, `employeeName`
- Employee assigned entry includes:
  - day, start, end, `clientId`, `clientName`

These are mirrored views of the same assignment outcome from each side.

## Current Assignment Flow

This is the current functional flow in the app.

1. A client has a requested schedule (days + time windows).
2. The assigner screen loads:
   - client's requested blocks
   - available employees grouped by day
   - existing assignments for the selected week
3. User selects employee per requested block.
4. Frontend sends `PUT /api/clients/:id/assigned-schedule` with:
   - `weekOf`
   - array of assigned rows (day/start/end/employeeId)
5. Backend validates:
   - request schema
   - `weekOf` must be upcoming Pacific Monday
   - client exists and employees exist
6. Backend writes client schedule and synchronizes impacted employee schedules for that week.
7. Details pages show assigned schedules for both current and next week.

Relevant backend routes are centralized in:

- `backend/src/domains/schedule/schedule.routes.ts`

## In Summary
- Shared person form keeps CRUD code simpler
- Separate requested-schedule shapes reflect only real difference:
  - employee availability is just days
  - client demand has time blocks
- Assignment flow combines them for a weekly staffing plan.
