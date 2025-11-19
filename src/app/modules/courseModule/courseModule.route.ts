/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { CourseModuleControllers } from "./courseModule.controller";

const router = express.Router();
router.get(
  "/",
  CourseModuleControllers.getAllCourseModule
);
router.post(
  "/",
  auth("admin", "instructor"),
  CourseModuleControllers.createCourseModule
);
router.get(
  "/:id",
  CourseModuleControllers.getSingleCourseModule
);

router.patch(
  "/:id",
  auth("admin", "instructor"),

  CourseModuleControllers.updateCourseModule
);


router.delete(
  "/:id",
  auth("admin", "instructor"),

  CourseModuleControllers.deleteSingleCourseModule
);


export const CourseModuleRoutes = router;
