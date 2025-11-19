export const USER_ROLE = {
  student: "student",
  admin: "admin",
 
  instructor: "instructor",
  company: "company"
} as const;

export const UserStatus = ["block", "active"];

export const UserSearchableFields = ["email", "name", "role"];
