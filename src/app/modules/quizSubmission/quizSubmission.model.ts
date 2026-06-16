import { Schema, model, Model } from "mongoose";
import { TQuizSubmission, TAnswerRecord } from "./quizSubmission.interface";

const AnswerRecordSchema = new Schema<TAnswerRecord>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    providedAnswer: {
      type: [String],
      required: true,
    },
    correctAnswers: {
      type: [String],
    },
    isCorrect: {
      type: Boolean,
     
    },
    marksAwarded: {
      type: Number,
     
      default: 0,
    },
  }
 
);

const QuizSubmissionSchema = new Schema<TQuizSubmission>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 0,
    },
    answers: [AnswerRecordSchema],
    seenQuestions: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    totalScore: {
      type: Number,
      required: true,
    },
    isPassed: {
      type: Boolean,
      required: true,
    },
    startedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Ensure a student doesn't submit the exact same attempt number twice for the same quiz
QuizSubmissionSchema.index({ studentId: 1, lessonId: 1, attemptNumber: 1 }, { unique: true });

export const QuizSubmission: Model<TQuizSubmission> = model<TQuizSubmission>(
  "QuizSubmission",
  QuizSubmissionSchema
);