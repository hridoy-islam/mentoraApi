import express from "express";
import { sendContractEmailControllers } from "./sendContractEmail.controller";

const router = express.Router();

router.post(
  "/",
  sendContractEmailControllers.sendContactForm
);

export const ContractRoutes = router;
