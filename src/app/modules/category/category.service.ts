import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Category } from "./category.model";
import { TCategory } from "./category.interface";
import { CategorySearchableFields } from "./category.constant";

const getAllCategoryFromDB = async (query: Record<string, unknown>) => {
  const CategoryQuery = new QueryBuilder(Category.find(), query)
    .search(CategorySearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await CategoryQuery.countTotal();
  const result = await CategoryQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleCategoryFromDB = async (id: string) => {
  const result = await Category.findById(id);
  return result;
};

const updateCategoryIntoDB = async (id: string, payload: Partial<TCategory>) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  const result = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createCategoryIntoDB = async (payload: Partial<TCategory>) => {
  const result = await Category.create(payload);
  return result;
};

const deleteCategoryFromDB = async (id: string) => {
   const category = await Category.findById(id);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }
  const result = await Category.findByIdAndDelete(id);
  return result;
};


export const CategoryServices = {
  getAllCategoryFromDB,
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  createCategoryIntoDB,
  deleteCategoryFromDB
  
};
