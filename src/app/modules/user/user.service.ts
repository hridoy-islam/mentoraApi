import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { UserSearchableFields } from "./user.constant";
import { TUser } from "./user.interface";
import { User } from "./user.model";
import AppError from "../../errors/AppError";
import bcrypt from "bcrypt";
import config from "../../config";

const getAllUserFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find(), query)
    .search(UserSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleUserFromDB = async (id: string) => {
  const result = await User.findById(id);
  return result;
};

export const updateUserIntoDB = async (
  id: string, 
  payload: Partial<TUser> & { oldPassword?: string; newPassword?: string }
) => {
  // 1. Fetch user and explicitly include the password field for verification
  const user = await User.findById(id).select('+password');
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // 2. If both oldPassword and newPassword are provided, verify and update
  if (payload.oldPassword && payload.newPassword) {
    // Compare provided oldPassword with the hashed password in the DB
    const isPasswordMatch = await bcrypt.compare(payload.oldPassword, user.password);
    if (!isPasswordMatch) {
      throw new AppError(httpStatus.BAD_REQUEST, "Current password does not match.");
    }

    // Hash the new password and assign it to the core password field
    payload.password = await bcrypt.hash(
      payload.newPassword,
      Number(config.bcrypt_salt_rounds)
    );

    // Remove the auxiliary fields so they aren't saved to the DB collection unexpectedly
    delete payload.oldPassword;
    delete payload.newPassword;
  } 
  // Fallback: If only a direct 'password' field is passed from another route
  else if (payload.password) {
    payload.password = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_rounds)
    );
  }

  // 3. Update the document with the cleaned payload
  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


export const UserServices = {
  getAllUserFromDB,
  getSingleUserFromDB,
  updateUserIntoDB,
  
};
