import { Router } from "express";
import db from "../db.js";

const router = Router();

// Mock WhatsApp sending function
async function sendWhatsAppMessage(to: string, message: string) {
  console.log(`Sending WhatsApp to ${to}: ${message}`);
  return { success: true, messageId: "wa_" + Date.now() };
}

router.post("/send", async (req, res) => {
  const { to, message, hospital_id, patient_id, type } = req.body;
  try {
    const result = await sendWhatsAppMessage(to, message);
    db.prepare("INSERT INTO whatsapp_logs (hospital_id, patient_id, mobile, message, type, status) VALUES (?, ?, ?, ?, ?, ?)").run(
      hospital_id, patient_id, to, message, type, result.success ? "Sent" : "Failed"
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/logs", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const logs = db.prepare(`
    SELECT l.*, p.name as patient_name 
    FROM whatsapp_logs l 
    LEFT JOIN patients p ON l.patient_id = p.id 
    WHERE l.hospital_id = ?
    ORDER BY l.sent_at DESC
  `).all(hospitalId);
  res.json(logs);
});

export default router;
