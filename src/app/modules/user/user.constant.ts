export const USER_ROLE = {
  user: "user",
  admin: "admin",
  staff: "staff",
  verifier: "verifier",
  signatory: "signatory",
  collegeAdmin: "collegeAdmin",
  campusAdmin: "campusAdmin"
} as const;

export const UserStatus = ["block", "active"];

export const UserSearchableFields = ["email", "name", "role"];
