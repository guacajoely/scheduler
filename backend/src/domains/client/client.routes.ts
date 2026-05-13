import { Router } from "express";

import { requireAuth } from "../shared/auth.middleware.js";
import { validateRequest } from "../shared/request-validation.middleware.js";
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
  async (req, res, next) => {
    try {
      const { id } = req.params as ClientIdParams;
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
  async (req, res, next) => {
    try {
      const created = await createClient(req.body as CreateClientInput);
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
  async (req, res, next) => {
    try {
      const { id } = req.params as ClientIdParams;
      const input = req.body as UpdateClientInput;
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
  async (req, res, next) => {
    try {
      const { id } = req.params as ClientIdParams;
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
