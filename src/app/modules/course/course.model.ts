import { Schema, model, Model, Types } from "mongoose";
import { TCourse } from "./course.interface";

const CourseSchema = new Schema<TCourse>(
  {
    title: { type: String,  },
    slug:{type:String},
    description: { type: String,  },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category",  },
    image: { type: String,  },
    instructorId: { type: Schema.Types.ObjectId, ref: "User",  },
    price: { type: Number,},
    originalPrice: { type: Number },
    rating: { type: Number },
    reviews: { type: Number },
    students: { type: Number },
    duration: { type: Number },
    totalLessons: { type: Number },
    resources: { type: Number },
    learningPoints: [{ type: String }],
    requirements: [{ type: String }],
    status: { type: String, enum: ["block", "active"], default: "active" },
  },
  {
    timestamps: true,
  }
);

export const Course: Model<TCourse> = model<TCourse>("Course", CourseSchema);
