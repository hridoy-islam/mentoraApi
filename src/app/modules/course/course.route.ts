/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { CourseControllers } from "./course.controller";

const router = express.Router();
router.get(
  "/",
  CourseControllers.getAllCourse
);
router.post(
  "/",
  auth("admin", "instructor"),
  CourseControllers.createCourse
);
router.get(
  "/:id",
  CourseControllers.getSingleCourse
);

router.patch(
  "/:id",
  auth("admin", "instructor"),

  CourseControllers.updateCourse
);


export const CourseRoutes = router;
