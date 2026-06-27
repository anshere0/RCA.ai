import axios from "axios";

const api = axios.create({
  baseURL: "https://rca-ai.onrender.com",
});

export default api;

export type IncidentPayload = {
  alertText: string;
  serviceName?: string;
  severity?: "P0" | "P1" | "P2" | "P3";
  repoOwner?: string;
  repoName?: string;
  logFile?: File;
};

export async function createIncident(payload: IncidentPayload): Promise<string> {
  const form = new FormData();
  form.append("alertText", payload.alertText);
  if (payload.serviceName) form.append("serviceName", payload.serviceName);
  if (payload.severity) form.append("severity", payload.severity);
  if (payload.repoOwner) form.append("repoOwner", payload.repoOwner);
  if (payload.repoName) form.append("repoName", payload.repoName);
  if (payload.logFile) form.append("logFile", payload.logFile);
  const res = await api.post("/api/incidents", form);
  return res.data.incidentId;
}

export async function pollReport(incidentId: string): Promise<any> {
  const res = await api.get(`/api/incidents/${incidentId}/report`);
  return res.data;
}

export async function listIncidents(): Promise<any[]> {
  const res = await api.get("/api/incidents");
  return res.data;
}
