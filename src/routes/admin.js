import express from "express";
import {
  adminLogin,
  adminLogout,
  allChats,
  allMessages,
  allUsers,
  getDashboard,
  isAdmin,
} from "../controllers/admin.js";
import { adminLoginValidator, handleValidator } from "../utils/validator.js";
import { adminOnly } from "../middlewares/authenticate.js";

const adminRoutes = express.Router();

adminRoutes.post("/verify", adminLoginValidator(), handleValidator, adminLogin);
adminRoutes.put("/logout", adminLogout);

//only admin can access this route
adminRoutes.use(adminOnly);
adminRoutes.get("/", isAdmin);
adminRoutes.get("/users", allUsers);
adminRoutes.get("/chats", allChats);
adminRoutes.get("/messages", allMessages);

adminRoutes.get("/stats", getDashboard);

export default adminRoutes;
