/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { CategoryControllers } from "./category.controller";

const router = express.Router();
router.get(
  "/",
  CategoryControllers.getAllCategory
);
router.post(
  "/",
  auth("admin", "instructor"),
  CategoryControllers.createCategory
);
router.get(
  "/:id",
  CategoryControllers.getSingleCategory
);

router.patch(
  "/:id",
  auth("admin", "instructor"),

  CategoryControllers.updateCategory
);

router.delete(
  "/:id",
  auth("admin", "instructor"),

  CategoryControllers.deleteSingleCategory
);


export const CategoryRoutes = router;
