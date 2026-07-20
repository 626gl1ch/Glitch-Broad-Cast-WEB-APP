const express = require("express");
const router = express.Router();
const { supabase, requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  try {
    // 1. Fetch Admin Settings as global fallback
    const { data: admins } = await supabase
      .from("profiles")
      .select("settings")
      .eq("role", "admin")
      .limit(1);

    const globalSettings = (admins && admins.length > 0) ? (admins[0].settings || {}) : {};
    
    // 2. Get User Settings
    const userSettings = req.user.profile.settings || {};

    // 3. Merge: If user's key is empty, use global
    const mergedSettings = { ...globalSettings };
    for (const key in userSettings) {
      if (userSettings[key] && userSettings[key].trim() !== "") {
        mergedSettings[key] = userSettings[key];
      }
    }

    const mergedProfile = { ...req.user.profile, settings: mergedSettings };
    res.json({ profile: mergedProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
