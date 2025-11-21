import { Schema, model, Model, Types } from "mongoose";
import { TLesson, QuizQuestion } from "./lesson.interface";

const QuizQuestionSchema = new Schema<QuizQuestion>(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ["mcq", "short"], required: true },

    // MCQ fields
    options: { type: [String], default: undefined },
    correctAnswers: {
      type: [String],
      default: undefined,
     
    },

    // Short question field
    shortAnswer: { type: String, default: undefined },
  },
  {
    _id: true,
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

    index: { type: Number, default: 0 },
    lock: { type: Boolean, default: true },
    prerequisiteLesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },

    videoUrl: { type: String },
    content: { type: String },
    additionalFiles:[{type: String}],
    additionalNote: { type: String },

    // Quiz Questions
    questions: {
      type: [QuizQuestionSchema],
      default: undefined,
    },

    importedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "QuestionBank",
      },
    ],

    // ⭐ New Quiz Configuration
    quizConfig: {
      totalMarks: { type: Number }, // total quiz marks
      passMarks: { type: Number }, // minimum passing score

      // maxAttempts: { type: Number }, // how many retries allowed

      // deductionRules: {
      //   type: [
      //     {
      //       attempt: { type: Number, required: true }, // retry number: 2, 3, 4 etc.
      //       deduction: { type: Number, required: true }, // marks deducted for this attempt
      //       constantDeduction: { type: Boolean, default: false }, 
      //     },
      //   ],
      //   default: undefined,
      // },

      // constantDeductionAfterMax: {
      //   type: Number, default: 0
      // },
    },
  },
  {
    timestamps: true,
  }
);



export const Lesson: Model<TLesson> = model<TLesson>("Lesson", LessonSchema);
