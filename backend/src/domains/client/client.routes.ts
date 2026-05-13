import { type Request, Router } from "express";

import { requireAuth } from "../shared/auth.middleware.js";
import { validateRequest } from "../shared/request-validation.middleware.js";
import { replaceClientAssignedSchedule } from "../schedule/schedule-assignment.service.js";
import {
  replaceClientAssignedScheduleSchema,
  type ReplaceClientAssignedScheduleInput,
} from "../schedule/schedule.schema.js";
import {
  createClient,
  getClientById,
  listClients,
  softDeleteClient,
  updateClient,
} from "./client.service.js";
import {
  clientIdParamsSchema,
  createClientSchema,
  type ClientIdParams,
  type CreateClientInput,
  type UpdateClientInput,
  updateClientSchema,
} from "./client.schema.js";

type PgError = {
  code?: string;
  constraint?: string;
};

const isClientEmailConflict = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const pgError = error as PgError;
  return (
    pgError.code === "23505" && pgError.constraint === "client_email_unique"
  );
};

export const clientRouter = Router();
clientRouter.use(requireAuth);

clientRouter.get("/clients", async (_req, res, next) => {
  try {
    const clients = await listClients();
    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
});

clientRouter.get(
  "/clients/:id",
  validateRequest({ params: clientIdParamsSchema }),
  async (req: Request<ClientIdParams>, res, next) => {
    try {
      const { id } = req.params;
      const found = await getClientById(id);
      if (!found) {
        res.status(404).json({ message: "Client not found" });
        return;
      }
      res.status(200).json(found);
    } catch (error) {
      next(error);
    }
  },
);

clientRouter.post(
  "/clients",
  validateRequest({ body: createClientSchema }),
  async (
    req: Request<Record<string, never>, unknown, CreateClientInput>,
    res,
    next,
  ) => {
    try {
      const created = await createClient(req.body);
      res.status(201).json(created);
    } catch (error) {
      if (isClientEmailConflict(error)) {
        res.status(409).json({ message: "Client email already exists" });
        return;
      }
      next(error);
    }
  },
);

clientRouter.patch(
  "/clients/:id",
  validateRequest({
    params: clientIdParamsSchema,
    body: updateClientSchema,
  }),
  async (
    req: Request<ClientIdParams, unknown, UpdateClientInput>,
    res,
    next,
  ) => {
    try {
      const { id } = req.params;
      const input = req.body;
      const updated = await updateClient(id, input);
      if (!updated) {
        res.status(404).json({ message: "Client not found" });
        return;
      }
      res.status(200).json(updated);
    } catch (error) {
      if (isClientEmailConflict(error)) {
        res.status(409).json({ message: "Client email already exists" });
        return;
      }
      next(error);
    }
  },
);

clientRouter.delete(
  "/clients/:id",
  validateRequest({ params: clientIdParamsSchema }),
  async (req: Request<ClientIdParams>, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await softDeleteClient(id);
      if (!deleted) {
        res.status(404).json({ message: "Client not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

clientRouter.put(
  "/clients/:id/assigned-schedule",
  validateRequest({
    params: clientIdParamsSchema,
    body: replaceClientAssignedScheduleSchema,
  }),
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
