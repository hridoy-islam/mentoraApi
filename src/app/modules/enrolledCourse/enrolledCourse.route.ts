/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { EnrolledCourseControllers } from "./enrolledCourse.controller";

const router = express.Router();
router.get(
  "/",
  EnrolledCourseControllers.getAllEnrolledCourse
);
router.post(
  "/",
  auth("admin", "instructor"),
  EnrolledCourseControllers.createEnrolledCourse
);
router.get(
  "/:id",
  EnrolledCourseControllers.getSingleEnrolledCourse
);

router.patch(
  "/:id",
  auth("admin", "instructor"),

  EnrolledCourseControllers.updateEnrolledCourse
);


export const EnrolledCourseRoutes = router;
