/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { QuestionBankControllers } from "./questionBank.controller";

const router = express.Router();
router.get(
  "/",
  QuestionBankControllers.getAllQuestionBank
);
router.post(
  "/",
  auth("admin", "instructor"),
  QuestionBankControllers.createQuestionBank
);
router.get(
  "/:id",
  QuestionBankControllers.getSingleQuestionBank
);

router.patch(
  "/:id",
  auth("admin", "instructor"),

  QuestionBankControllers.updateQuestionBank
);


export const QuestionBankRoutes = router;
