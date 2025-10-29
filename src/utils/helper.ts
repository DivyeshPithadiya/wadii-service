import { Types } from "mongoose";

export const oid = (id: string | Types.ObjectId) =>
  typeof id === "string" ? new Types.ObjectId(id) : id;
