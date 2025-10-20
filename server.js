// server.js (핵심만 발췌: 라우팅 순서/로그)
import express from "express";
import fs from "fs";
import path from "path";
import url from "url";
import "dotenv/config";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json({ limit: "20mb" }));

// 요청 로거
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "public");
const TEMPLATES_DIR = path.join(__dirname, "templates");

// 정적 서빙
app.use(express.static(PUBLIC_DIR));
app.use("/templates", express.static(TEMPLATES_DIR));

// API: 템플릿 목록
app.get("/api/templates", (req, res) => {
  fs.readdir(TEMPLATES_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: String(err) });
    const allow = new Set([".png", ".jpg", ".jpeg"]);
    const list = files
      .filter(f => allow.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map(f => ({ name: f, url: `/templates/${encodeURIComponent(f)}` }));
    res.json(list);
  });
});

// API: 이메일 전송 (중요: 반드시 뷰 라우트보다 위에)
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, text, filename, imageBase64 } = req.body;
    if (!to || !imageBase64) return res.status(400).json({ error: "to / imageBase64 필요" });

    const m = imageBase64.match(/^data:image\/png;base64,(.+)$/);
    if (!m) return res.status(400).json({ error: "PNG dataURL 형식 아님" });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: subject || "합성 이미지 전송",
      text: text || "신문 템플릿 + 웹캠 합성 이미지를 첨부합니다.",
      attachments: [{ filename: filename || `부산일보_${Date.now()}.png`, content: Buffer.from(m[1], "base64"), contentType: "image/png" }],
    });

    res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// 뷰 라우트
app.get("/viewer", (_, res) => res.sendFile(path.join(PUBLIC_DIR, "viewer.html")));
app.get("/",       (_, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));
app.get("/favicon.ico", (_, res) => res.status(204).end());

// ★ 절대 이 아래에만 와일드카드를 둡니다 (필요할 때만)
// app.get("*", (_, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
