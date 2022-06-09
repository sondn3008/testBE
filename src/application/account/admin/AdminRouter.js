import express from "express";
import AdminService from "../../../domain/account/admin/AdminService";

const router = express.Router();

router.post("/register", async (req, res) => {
  const data = req.body;
  const result = await AdminService.createAnAdmin(data);

  res.status(result.statusCode).json(result);
});

export default router;
