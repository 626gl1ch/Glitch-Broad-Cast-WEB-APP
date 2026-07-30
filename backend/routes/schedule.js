const express = require("express");
const router = express.Router();
const { supabase, requireAuth } = require("../middleware/auth");

// Schedule a specific variant for a future time
router.post("/:variantId", requireAuth, async (req, res) => {
  const { variantId } = req.params;
  const { scheduledFor } = req.body;
  if (!scheduledFor) return res.status(400).json({ error: "scheduledFor is required" });

  try {
    const { data, error } = await supabase
      .from("post_variants")
      .update({ publish_status: "scheduled", scheduled_for: scheduledFor })
      .eq("id", variantId)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quick schedule a completely new text post directly
router.post("/quick", requireAuth, async (req, res) => {
  const { content, platform, scheduledFor, targetGroupUrl, targetGroupName } = req.body;
  if (!content || !platform || !scheduledFor) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Create a dummy parent post just for relational integrity
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .insert({ title: "Quick Schedule", base_content: content, user_id: req.user.id, status: "scheduled" })
      .select()
      .single();
    if (postErr) throw postErr;

    // 2. Create the targeted variant with scheduled timestamp
    const { data: variant, error: varErr } = await supabase
      .from("post_variants")
      .insert({
        post_id: post.id,
        user_id: req.user.id,
        platform: platform,
        content: content,
        publish_status: "scheduled",
        scheduled_for: scheduledFor,
        target_group_url: targetGroupUrl,
        target_group_name: targetGroupName
      })
      .select()
      .single();
    if (varErr) throw varErr;

    res.json(variant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calendar view: everything scheduled between two dates
router.get("/calendar", requireAuth, async (req, res) => {
  const { from, to } = req.query;
  
  try {
    // We now fetch variants that have scheduled_for set
    let query = supabase
      .from("post_variants")
      .select("*, posts(base_content)")
      .eq("user_id", req.user.id)
      .not("scheduled_for", "is", null)
      .order("scheduled_for", { ascending: true });

    if (from) query = query.gte("scheduled_for", from);
    if (to) query = query.lte("scheduled_for", to);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
