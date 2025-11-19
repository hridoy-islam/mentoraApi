/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { LessonControllers } from "./lesson.controller";

const router = express.Router();
router.get(
  "/",
  LessonControllers.getAllLesson
);
router.post(
  "/",
  auth("admin", "instructor"),
  LessonControllers.createLesson
);
router.get(
  "/:id",
  LessonControllers.getSingleLesson
);

router.patch(
  "/:id",
  auth("admin", "instructor"),

  LessonControllers.updateLesson
);


export const LessonRoutes = router;
