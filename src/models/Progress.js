import mongoose from "mongoose";

const categoryProgressSchema = new mongoose.Schema({
  completed: { type: Boolean, default: false },
  correct: { type: Number, default: 0 },
  attempted: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  lastPlayedAt: { type: Date, default: null }
}, { _id: false });

const progressSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, index: true },
  totalXp: { type: Number, default: 0 },
  categories: {
    arithmetic: { type: categoryProgressSchema, default: () => ({}) },
    comparison: { type: categoryProgressSchema, default: () => ({}) },
    logical: { type: categoryProgressSchema, default: () => ({}) },
    assignment: { type: categoryProgressSchema, default: () => ({}) },
    ternary: { type: categoryProgressSchema, default: () => ({}) }
  }
}, { timestamps: true });

export default mongoose.model("Progress", progressSchema);
