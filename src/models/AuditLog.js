import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  request: { type: String, required: true },
  status: { type: String, enum: ["completed", "blocked", "failed"], required: true },
  safety: { type: String, enum: ["safe", "blocked"], required: true },
  retrievedMaterials: [{ type: String }],
  inputTokens: { type: Number, default: 0 },
  outputTokens: { type: Number, default: 0 },
  estimatedCostUsd: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  error: { type: String, default: null }
}, { timestamps: true });

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("AuditLog", auditLogSchema);
