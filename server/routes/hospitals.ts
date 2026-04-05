import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const hospitals = db.prepare("SELECT * FROM hospitals").all();
  res.json(hospitals);
});

router.post("/", (req, res) => {
  const { name, address, config } = req.body;
  const info = db.prepare("INSERT INTO hospitals (name, address, config) VALUES (?, ?, ?)").run(name, address, JSON.stringify(config));
  res.json({ id: info.lastInsertRowid });
});

export default router;
