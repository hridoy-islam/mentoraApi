// questionBank.model.ts
import { Schema, model, Model } from "mongoose";
import { TQuestionBank } from "./questionBank.interface";

const QuestionBankSchema = new Schema<TQuestionBank>(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ["mcq", "short"], required: true },

    // MCQ fields
    options: { type: [String], default: undefined },
    correctAnswers: { type: [String], default: undefined },

    // Short question
    shortAnswer: { type: String, default: undefined },
  },
  { timestamps: true }
);

export const QuestionBank: Model<TQuestionBank> = model<TQuestionBank>(
  "QuestionBank",
  QuestionBankSchema
);
