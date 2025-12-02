import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.router";

import { NotificationsRoutes } from "../modules/notification/notification.route";
import { UploadDocumentRoutes } from "../modules/documents/documents.route";
import { CourseRoutes } from "../modules/course/course.route";
import { CourseModuleRoutes } from "../modules/courseModule/courseModule.route";
import { LessonRoutes } from "../modules/lesson/lesson.route";
import { CategoryRoutes } from "../modules/category/category.route";
import { QuestionBankRoutes } from "../modules/questionBank/questionBank.route";
import { EnrolledCourseRoutes } from "../modules/enrolledCourse/enrolledCourse.route";
import { OrderRoutes } from "../modules/order/order.route";
import { CourseLicenseRoutes } from "../modules/courseLicense/courseLicense.route";


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
    path: "/enrolled-courses",
    route: EnrolledCourseRoutes,
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
   {
    path: "/questions",
    route: QuestionBankRoutes,
  },
  {
    path: "/order",
    route: OrderRoutes,
  },
  {
    path: "/course-license",
    route: CourseLicenseRoutes,
  },

 
 
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
