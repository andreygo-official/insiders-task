
import { Router } from "express";
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { z } from "zod";

import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

const statusSchema = z.enum([
  "todo",
  "in progress",
  "done",
]);

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(""),
  status: statusSchema.default("todo"),
});

const updateTaskSchema = createTaskSchema.partial();

function parseTaskId(value: string): number | null {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}
router.use(authenticate);

router.get(
  "/",
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status = req.query.status;

      if (
        status !== undefined &&
        !statusSchema.safeParse(status).success
      ) {
        res.status(400).json({
          message: "Invalid status filter",
        });
        return;
      }

      const tasks = await prisma.task.findMany({
        where: {
          userId: req.userId!,
          ...(typeof status === "string"
            ? { status }
            : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/tasks

router.post(
  "/",
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = createTaskSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          message: "Invalid task data",
          errors: z.flattenError(
            parsed.error
          ).fieldErrors,
        });
        return;
      }

      const task = await prisma.task.create({
        data: {
          ...parsed.data,
          userId: req.userId!,
        },
      });

      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/tasks/:id

router.put(
  "/:id",
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseTaskId(req.params.id);

      if (id === null) {
        res.status(400).json({
          message: "Invalid task ID",
        });
        return;
      }

      const parsed = updateTaskSchema.safeParse(req.body);

      if (
        !parsed.success ||
        Object.keys(parsed.data ?? {}).length === 0
      ) {
        res.status(400).json({
          message: "Invalid update data",
        });
        return;
      }

      const result = await prisma.task.updateMany({
        where: {
          id,
          userId: req.userId!,
        },
        data: parsed.data,
      });

      if (result.count === 0) {
        res.status(404).json({
          message: "Task not found",
        });
        return;
      }

      const task = await prisma.task.findFirst({
        where: {
          id,
          userId: req.userId!,
        },
      });

      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/tasks/:id

router.delete(
  "/:id",
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseTaskId(req.params.id);

      if (id === null) {
        res.status(400).json({
          message: "Invalid task ID",
        });
        return;
      }

      const result = await prisma.task.deleteMany({
        where: {
          id,
          userId: req.userId!,
        },
      });

      if (result.count === 0) {
        res.status(404).json({
          message: "Task not found",
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
