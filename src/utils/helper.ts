import { Types } from "mongoose";

export const oid = (id: string | Types.ObjectId) =>
  typeof id === "string" ? new Types.ObjectId(id) : id;

export function parseNumberParam(
  value: string | undefined,
  fallback: number
): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
