import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Order } from "./order.model";
import { TOrder } from "./order.interface";
import { OrderSearchableFields } from "./order.constant";
import { CourseLicense } from "../courseLicense/courseLicense.model";
import { EnrolledCourse } from "../enrolledCourse/enrolledCourse.model";

const getAllOrderFromDB = async (query: Record<string, unknown>) => {
  const OrderQuery = new QueryBuilder(Order.find().populate("instructorId","name").populate("categoryId","name"), query)
    .search(OrderSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await OrderQuery.countTotal();
  const result = await OrderQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleOrderFromDB = async (id: string) => {
  const result = await Order.findById(id).populate("instructorId");
  return result;
};

const updateOrderIntoDB = async (id: string, payload: Partial<TOrder>) => {
  const order = await Order.findById(id).populate("instructorId","name").populate("categoryId","name");
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  const result = await Order.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createOrderIntoDB = async (payload: Partial<TOrder>) => {
  const order = await Order.create(payload);

  const { buyerId, role, items } = payload;

  if (role === "student") {
    for (const item of items || []) {
      await EnrolledCourse.create({
        studentId: buyerId,          
        courseId: item.courseId,     
        purchasedBy: buyerId,        
        status: "active",            
        progress: 0,                 
        startDate: new Date(),       
      });
    }
  }

  // 4️⃣ If buyer is a COMPANY => create CourseLicense item-wise
  if (role === "company") {
    for (const item of items || []) {
      await CourseLicense.create({
        companyId: payload.buyerId,
      courseId: item.courseId,
      orderId: order._id,
      totalSeats: item.quantity, 
      usedSeats: 0,
      isActive: true,
      });
    }
  }

  return order;
};





export const OrderServices = {
  getAllOrderFromDB,
  getSingleOrderFromDB,
  updateOrderIntoDB,
  createOrderIntoDB
  
};
