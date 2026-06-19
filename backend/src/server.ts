import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import incidentRoutes from "./routes/incidents.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("RCA Copilot Backend Running 🚀");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/incidents", incidentRoutes);

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`RCA Copilot backend running on port ${PORT}`);
});