/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export interface TCategory {
  name: string;
  status: "block" | "active";
}
