import { Schema, model, Model, Types } from "mongoose";
import { TLesson, QuizQuestion } from "./lesson.interface";

const QuizQuestionSchema = new Schema<QuizQuestion>(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ["mcq", "short"], required: true },

    // MCQ fields
    options: { type: [String], default: undefined },
    correctAnswer: { type: Number, default: undefined },

    // Short question field
    shortAnswer: { type: String, default: undefined },
  }
);

const LessonSchema = new Schema<TLesson>(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["video", "doc", "quiz"], required: true },
    duration: { type: String },

    // Video
    videoUrl: { type: String },

    // Document
    content: { type: String },

    // Quiz
    questions: {
      type: [QuizQuestionSchema],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

export const Lesson: Model<TLesson> = model<TLesson>("Lesson", LessonSchema);
