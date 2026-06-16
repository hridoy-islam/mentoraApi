import { Schema, model, Model, Types } from "mongoose";
import { TLesson, QuizQuestion } from "./lesson.interface";

const QuizQuestionSchema = new Schema<QuizQuestion>(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ["mcq", "short"], required: true },

   
    options: { type: [String], default: undefined },
    correctAnswers: {
      type: [String],
      default: undefined,
   
    },

    
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

      
    },
  },
  {
    timestamps: true,
  }
);



export const Lesson: Model<TLesson> = model<TLesson>("Lesson", LessonSchema);
