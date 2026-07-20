const express = require("express");
const router = express.Router();
const { supabase, requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, (req, res) => {
  res.json({ profile: req.user.profile });
});

router.patch("/settings", requireAuth, async (req, res) => {
  const { settings } = req.body;
  if (!settings) {
    return res.status(400).json({ error: "Missing settings payload" });
  }

  // Ensure we merge with existing settings
  const existingSettings = req.user.profile.settings || {};
  const updatedSettings = { ...existingSettings, ...settings };

  const { data, error } = await supabase
    .from("profiles")
    .update({ settings: updatedSettings })
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ profile: data });
});

router.post("/feedback", requireAuth, async (req, res) => {
  const { type, message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const { error } = await supabase
    .from("feedback")
    .insert({
      user_id: req.user.id,
      type: type || "general",
      message: message,
      status: "new"
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

module.exports = router;
