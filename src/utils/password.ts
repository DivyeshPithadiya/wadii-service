import bcrypt from "bcryptjs";
import EnvironmentConfig from "../config/env";

const envConfig = EnvironmentConfig.getInstance().config;

export class PasswordUtils {
  /**
   * Hash password using bcrypt
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, envConfig.BCRYPT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  public static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
