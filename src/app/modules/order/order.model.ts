import { Schema, model, Model, Types } from "mongoose";
import { TOrder } from "./order.interface";

const OrderSchema = new Schema<TOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        subTotal: { type: Number, required: true },
      },
    ],
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    transactionId: { type: String },
    role: { type: String, enum: ["student", "company"], required: true },
  },
  { timestamps: true }
);

export const Order: Model<TOrder> = model<TOrder>("Order", OrderSchema);
