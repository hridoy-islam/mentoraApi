/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { QuizSubmissionControllers } from "./quizSubmission.controller";

const router = express.Router();
router.get(
  "/",
  QuizSubmissionControllers.getAllQuizSubmission
);
router.post(
  "/",
  auth("admin", "instructor","company","student"),
  QuizSubmissionControllers.createQuizSubmission
);
router.get(
  "/:id",
    auth("admin", "instructor","company","student"),

  QuizSubmissionControllers.getSingleQuizSubmission
);

router.patch(
  "/:id",
  auth("admin", "instructor","company","student"),

  QuizSubmissionControllers.updateQuizSubmission
);

router.delete(
  "/:id",
  auth("admin", "instructor","company","student"),

  QuizSubmissionControllers.deleteSingleQuizSubmission
);


export const QuizSubmissionRoutes = router;
