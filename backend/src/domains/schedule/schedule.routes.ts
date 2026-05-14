import { type Request, Router } from "express";

import { getClientById } from "../client/client.service.js";
import { getEmployeeById } from "../employee/employee.service.js";
import { requireAuth } from "../shared/auth.middleware.js";
import {
  validateQueryOrRespond,
  validateRequest,
} from "../shared/request-validation.middleware.js";
import { replaceClientAssignedSchedule } from "./schedule-assignment.service.js";
import {
  getClientAssignedScheduleWithEmployees,
  getEmployeeAssignedScheduleWithClients,
  getEmployeesAvailableForEachDay,
} from "./schedule-read.service.js";
import {
  replaceClientAssignedScheduleSchema,
  type ReplaceClientAssignedScheduleInput,
  type WeekOfQueryInput,
  weekOfQuerySchema,
} from "./schedule.schema.js";
import { validateUpcomingPacificMondayWeekOfBody } from "./schedule-validation.middleware.js";
import {
  clientIdParamsSchema,
  type ClientIdParams,
} from "../client/client.schema.js";
import {
  employeeIdParamsSchema,
  type EmployeeIdParams,
} from "../employee/employee.schema.js";

export const scheduleRouter = Router();
scheduleRouter.use(requireAuth);

scheduleRouter.get(
  "/clients/:id/available-employees-by-day",
  validateRequest({ params: clientIdParamsSchema }),
  async (req: Request<ClientIdParams>, res, next) => {
    try {
      const found = await getClientById(req.params.id);
      if (!found) {
        res.status(404).json({ message: "Client not found" });
        return;
      }

      const availableEmployeesByDay = await getEmployeesAvailableForEachDay();
      res.status(200).json({ availableEmployeesByDay });
    } catch (error) {
      next(error);
    }
  },
);

scheduleRouter.get(
  "/clients/:id/assigned-schedule",
  validateRequest({ params: clientIdParamsSchema }),
  async (
    req: Request<ClientIdParams, unknown, unknown, WeekOfQueryInput>,
    res,
    next,
  ) => {
    try {
      const query = validateQueryOrRespond(res, req.query, weekOfQuerySchema);
      if (!query) {
        return;
      }

      const found = await getClientById(req.params.id);
      if (!found) {
        res.status(404).json({ message: "Client not found" });
        return;
      }

      const schedule = await getClientAssignedScheduleWithEmployees(
        req.params.id,
        query.weekOf,
      );
      res.status(200).json({ weekOf: query.weekOf, schedule });
    } catch (error) {
      next(error);
    }
  },
);

scheduleRouter.put(
  "/clients/:id/assigned-schedule",
  validateRequest({
    params: clientIdParamsSchema,
    body: replaceClientAssignedScheduleSchema,
  }),
  validateUpcomingPacificMondayWeekOfBody,
  async (
    req: Request<ClientIdParams, unknown, ReplaceClientAssignedScheduleInput>,
    res,
    next,
  ) => {
    try {
      const { id } = req.params;
      const result = await replaceClientAssignedSchedule(id, req.body);

      if (!result.ok) {
        if (result.code === "CLIENT_NOT_FOUND") {
          res.status(404).json({ message: "Client not found" });
          return;
        }
        res.status(404).json({
          message: "One or more employees were not found",
          employeeIds: result.employeeIds,
        });
        return;
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  },
);

scheduleRouter.get(
  "/employees/:id/assigned-schedule",
  validateRequest({ params: employeeIdParamsSchema }),
  async (
    req: Request<EmployeeIdParams, unknown, unknown, WeekOfQueryInput>,
    res,
    next,
  ) => {
    try {
      const query = validateQueryOrRespond(res, req.query, weekOfQuerySchema);
      if (!query) {
        return;
      }

      const found = await getEmployeeById(req.params.id);
      if (!found) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }

      const schedule = await getEmployeeAssignedScheduleWithClients(
        req.params.id,
        query.weekOf,
      );
      res.status(200).json({ weekOf: query.weekOf, schedule });
    } catch (error) {
      next(error);
    }
  },
);
