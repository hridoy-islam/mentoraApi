/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { CourseLicenseControllers } from "./courseLicense.controller";

const router = express.Router();
router.get(
  "/",
  CourseLicenseControllers.getAllCourseLicense
);
router.post(
  "/",
  auth("admin", "instructor"),
  CourseLicenseControllers.createCourseLicense
);
router.get(
  "/:id",
  CourseLicenseControllers.getSingleCourseLicense
);

router.patch(
  "/:id",
  auth("admin", "instructor"),

  CourseLicenseControllers.updateCourseLicense
);


export const CourseLicenseRoutes = router;
