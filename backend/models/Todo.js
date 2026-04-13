const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
});

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String, required: [true, "Title is required"],
      trim: true, maxlength: [200, "Title cannot exceed 200 characters"],
    },
    completed: { type: Boolean, default: false },
    priority:  { type: String, enum: ["low", "medium", "high"], default: "medium" },
    category:  { type: String, enum: ["work", "personal", "study", "health", "other"], default: "other" },
    dueDate:   { type: Date, default: null },
    subtasks:  [subtaskSchema],
    order:     { type: Number, default: 0 },
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Todo", todoSchema);
