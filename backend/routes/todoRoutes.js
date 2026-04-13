const express = require("express");
const router  = express.Router();
const Todo    = require("../models/Todo");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// GET all todos for logged-in user
router.get("/", async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user._id }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: todos.length, data: todos });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create todo
router.post("/", async (req, res) => {
  try {
    const { title, priority, category, dueDate } = req.body;
    const todo = await Todo.create({ title, priority, category, dueDate: dueDate || null, user: req.user._id });
    res.status(201).json({ success: true, data: todo });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// PUT update todo
router.put("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!todo) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: todo });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// DELETE todo
router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!todo) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST add subtask
router.post("/:id/subtasks", async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) return res.status(404).json({ success: false, message: "Not found" });
    todo.subtasks.push({ title: req.body.title });
    await todo.save();
    res.json({ success: true, data: todo });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// PUT toggle subtask
router.put("/:id/subtasks/:sid", async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) return res.status(404).json({ success: false, message: "Not found" });
    const sub = todo.subtasks.id(req.params.sid);
    if (!sub) return res.status(404).json({ success: false, message: "Subtask not found" });
    sub.completed = !sub.completed;
    await todo.save();
    res.json({ success: true, data: todo });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// GET analytics
router.get("/analytics/weekly", async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0,0,0,0));
      const end   = new Date(d.setHours(23,59,59,999));
      const count = await Todo.countDocuments({ user: req.user._id, completed: true, updatedAt: { $gte: start, $lte: end } });
      days.push({ day: start.toLocaleDateString("en-IN",{weekday:"short"}), count });
    }
    res.json({ success: true, data: days });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
