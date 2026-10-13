
import { Router } from "express";
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { prisma } from "../lib/prisma";

const router = Router();

const registerSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

function createToken(userId: number): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: "24h" }
  );
}

router.post(
  "/register",
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = registerSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          message: "Invalid email or password",
          errors: z.flattenError(
            parsed.error
          ).fieldErrors,
        });
        return;
      }

      const email = parsed.data.email
        .trim()
        .toLowerCase();

      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        res.status(409).json({
          message: "Email is already registered",
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(
        parsed.data.password,
        12
      );

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
        },
      });

      res.status(201).json({
        token: createToken(user.id),
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = loginSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          message: "Invalid login credentials",
        });
        return;
      }

      const email = parsed.data.email
        .trim()
        .toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          message: "Invalid email or password",
        });
        return;
      }

      const passwordIsValid = await bcrypt.compare(
        parsed.data.password,
        user.password
      );

      if (!passwordIsValid) {
        res.status(401).json({
          message: "Invalid email or password",
        });
        return;
      }

      res.json({
        token: createToken(user.id),
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
