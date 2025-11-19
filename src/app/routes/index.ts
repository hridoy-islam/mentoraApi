import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.router";

import { NotificationsRoutes } from "../modules/notification/notification.route";
import { UploadDocumentRoutes } from "../modules/documents/documents.route";
import { CourseRoutes } from "../modules/course/course.route";
import { CourseModuleRoutes } from "../modules/courseModule/courseModule.route";
import { LessonRoutes } from "../modules/lesson/lesson.route";
import { CategoryRoutes } from "../modules/category/category.route";


const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },

  {
    path: "/notifications",
    route: NotificationsRoutes,
  },
  {
    path: "/documents",
    route: UploadDocumentRoutes,
  },
  {
    path: "/courses",
    route: CourseRoutes,
  },
  {
    path: "/category",
    route: CategoryRoutes,
  },

  {
    path: "/course-modules",
    route: CourseModuleRoutes,
  },
  {
    path: "/course-lesson",
    route: LessonRoutes,
  },

 
 
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
