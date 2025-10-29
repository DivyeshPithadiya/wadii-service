import { Schema, model, Types } from "mongoose";

export interface IService {
  name: string;
  description?: string;
  iconUrl?: string;
  venueId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true },
    description: { type: String },
    iconUrl: { type: String },
    venueId: { type: Schema.Types.ObjectId, ref: "Venue", required: true },
  },
  { timestamps: true }
);

export const Service = model<IService>("Service", serviceSchema);
