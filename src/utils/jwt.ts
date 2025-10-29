import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { IJWTPayload } from "../types";
import EnvironmentConfig from "../config/env";

const envConfig = EnvironmentConfig.getInstance().config;

function isJWTPayload(p: unknown): p is IJWTPayload {
  return typeof p === "object" && p !== null && "userId" in (p as any);
}

export class JWTUtils {
  /**
   * Generate JWT token for user
   */
  public static generateToken(
    payload: Omit<IJWTPayload, "iat" | "exp">
  ): string {
    const secret: Secret = envConfig.JWT_SECRET as Secret; // ensure string -> Secret
    const options: SignOptions = {
      expiresIn: "7d",
    };
    return jwt.sign(payload, secret, options);
  }

  /**
   * Verify and decode JWT token
   */
  public static verifyToken(token: string): IJWTPayload {
    const secret: Secret = envConfig.JWT_SECRET as Secret;
    const decoded = jwt.verify(token, secret);
    if (!isJWTPayload(decoded)) throw new Error("Invalid token payload");
    return decoded;
  }

  /**
   * Decode token without verification (for expired tokens)
   */
  public static decodeToken(token: string): IJWTPayload | null {
    const decoded = jwt.decode(token);
    return isJWTPayload(decoded) ? decoded : null;
  }
}
