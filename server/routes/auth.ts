import { Router } from "express";
import db from "../db.js";

const router = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT u.*, h.name as hospital_name FROM users u LEFT JOIN hospitals h ON u.hospital_id = h.id WHERE u.username = ? AND u.password = ?").get(username, password);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

export default router;
