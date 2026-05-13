import { type Request, Router } from "express";

import { requireAuth } from "../shared/auth.middleware.js";
import { paginationQuerySchema } from "../shared/pagination.schema.js";
import {
  validateQueryOrRespond,
  validateRequest,
} from "../shared/request-validation.middleware.js";
import {
  createEmployee,
  getEmployeeById,
  listEmployees,
  softDeleteEmployee,
  updateEmployee,
} from "./employee.service.js";
import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  type EmployeeIdParams,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
  updateEmployeeSchema,
} from "./employee.schema.js";

type PgError = {
  code?: string;
  constraint?: string;
};

const isEmployeeEmailConflict = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const pgError = error as PgError;
  return (
    pgError.code === "23505" && pgError.constraint === "employee_email_unique"
  );
};

export const employeeRouter = Router();
employeeRouter.use(requireAuth);

employeeRouter.get("/employees", async (req, res, next) => {
  try {
    const query = validateQueryOrRespond(res, req.query, paginationQuerySchema);
    if (!query) {
      return;
    }

    const employees = await listEmployees(query);
    res.status(200).json(employees);
  } catch (error) {
    next(error);
  }
});

employeeRouter.get(
  "/employees/:id",
  validateRequest({ params: employeeIdParamsSchema }),
  async (req: Request<EmployeeIdParams>, res, next) => {
    try {
      const { id } = req.params;
      const found = await getEmployeeById(id);
      if (!found) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }
      res.status(200).json(found);
    } catch (error) {
      next(error);
    }
  },
);

employeeRouter.post(
  "/employees",
  validateRequest({ body: createEmployeeSchema }),
  async (
    req: Request<Record<string, never>, unknown, CreateEmployeeInput>,
    res,
    next,
  ) => {
    try {
      const created = await createEmployee(req.body);
      res.status(201).json(created);
    } catch (error) {
      if (isEmployeeEmailConflict(error)) {
        res.status(409).json({ message: "Employee email already exists" });
        return;
      }
      next(error);
    }
  },
);

employeeRouter.patch(
  "/employees/:id",
  validateRequest({
    params: employeeIdParamsSchema,
    body: updateEmployeeSchema,
  }),
  async (
    req: Request<EmployeeIdParams, unknown, UpdateEmployeeInput>,
    res,
    next,
  ) => {
    try {
      const { id } = req.params;
      const input = req.body;

      const updated = await updateEmployee(id, input);
      if (!updated) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }

      res.status(200).json(updated);
    } catch (error) {
      if (isEmployeeEmailConflict(error)) {
        res.status(409).json({ message: "Employee email already exists" });
        return;
      }
      next(error);
    }
  },
);

employeeRouter.delete(
  "/employees/:id",
  validateRequest({ params: employeeIdParamsSchema }),
  async (req: Request<EmployeeIdParams>, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await softDeleteEmployee(id);
      if (!deleted) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
