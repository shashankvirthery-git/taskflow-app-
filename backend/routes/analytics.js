const express = require("express");
const router = express.Router();

router.get("/weekly", async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        tasksDone: 12,
        onSchedule: 85,
        streakScore: 70,
        weekly: [3, 5, 2, 6, 4, 7, 5]
      }
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;