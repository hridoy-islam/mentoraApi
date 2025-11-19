import { Schema, model, Model, Types } from "mongoose";
import { TCategory } from "./category.interface";

const CategorySchema = new Schema<TCategory>(
  {
    name: { type: String },

    status: { type: String, enum: ["block", "active"], default: "active" },
  },
  {
    timestamps: true,
  }
);

export const Category: Model<TCategory> = model<TCategory>("Category", CategorySchema);
