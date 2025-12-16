/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";
import { USER_ROLE } from "./user.constant";
import e from "express";

export interface BrowserInfo {
  name?: string;
  version?: string;
}

export interface OSInfo {
  name?: string;
  version?: string;
}

export interface DeviceInfo {
  model?: string;
  type?: string;
  vendor?: string;
}

export interface CPUInfo {
  architecture?: string;
}

export interface UserAgentInfo {
  browser?: BrowserInfo;
  os?: OSInfo;
  device?: DeviceInfo;
  cpu?: CPUInfo;
  ipAddress: string;
  macAddress: string;
  timestamp?: Date;
}

export interface TUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: string;
  status: "block" | "active";
  isDeleted: boolean;
  authorized: boolean;

  image?: string;
  phone?: string;
  googleUid?: string;
  otp?: string;
  refreshToken?: string;
  otpExpiry?: Date;
  isUsed: boolean;
  isValided: boolean;
  isCompleted: boolean;
  userAgentInfo: UserAgentInfo[];
  expertise?: string;
  // Personal Info
  title?: string;
  firstName?: string;
  lastName?: string;
  otherName?: string;
  initial?: string;
  dateOfBirth?: Date;
  nationality?: string;
  organizationId?: Types.ObjectId;
  country?: string;
  city?: string;
  zipCode?: string;
  state?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserModel extends Model<TUser> {
  //instance methods for checking if the user exist
  isUserExists(email: string): Promise<TUser>;
  //instance methods for checking if passwords are matched
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
}

export type TUserRole = keyof typeof USER_ROLE;
