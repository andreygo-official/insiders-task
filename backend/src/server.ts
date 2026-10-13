
import "dotenv/config";

import express from "express";
import cors from "cors";
import taskRoutes from "./routes/task.routes";

import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { Prisma } from "./generated/prisma/client";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth.routes";

const app = express();

const PORT = Number(process.env.PORT) || 5001;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5174",
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// We will add taskRoutes in the next step.

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    res.status(409).json({
      message: "Resource already exists",
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "body" in error
  ) {
    res.status(400).json({
      message: "Invalid JSON",
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error",
  });
});

async function start() {
  try {
    await prisma.$connect();

    app.listen(PORT, () => {
      console.log(
        `API running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server initialization failed:",
      error
    );
    process.exit(1);
  }
}

start();
