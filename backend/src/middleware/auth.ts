
import type {
    Request,
    Response,
    NextFunction,
  } from "express";
  
  import jwt from "jsonwebtoken";
  
  declare global {
    namespace Express {
      interface Request {
        userId?: number;
      }
    }
  }
  
  export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const authorization = req.headers.authorization;
  
    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }
  
    const token = authorization.slice(7);
  
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      );
  
      if (
        typeof decoded === "string" ||
        typeof decoded.userId !== "number"
      ) {
        res.status(401).json({
          message: "Invalid token",
        });
        return;
      }
  
      req.userId = decoded.userId;
      next();
    } catch {
      res.status(401).json({
        message: "Invalid or expired token",
      });
    }
  }
  