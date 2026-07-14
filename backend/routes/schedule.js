const express = require("express");
const router = express.Router();
const { supabase, requireAuth } = require("../middleware/auth");

// Schedule a post for a future time
// Schedule a post for a future time
router.post("/:postId", requireAuth, async (req, res) => {
  const { postId } = req.params;
  const { scheduledFor } = req.body;
  if (!scheduledFor) return res.status(400).json({ error: "scheduledFor is required" });

  const { data, error } = await supabase
    .from("posts")
    .update({ status: "scheduled", scheduled_for: scheduledFor })
    .eq("id", postId)
    .eq("user_id", req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Calendar view: everything scheduled between two dates
// Calendar view: everything scheduled between two dates
router.get("/calendar", requireAuth, async (req, res) => {
  const { from, to } = req.query;
  let query = supabase
    .from("posts")
    .select("*, post_variants(*)")
    .eq("user_id", req.user.id)
    .eq("status", "scheduled")
    .order("scheduled_for", { ascending: true });

  if (from) query = query.gte("scheduled_for", from);
  if (to) query = query.lte("scheduled_for", to);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
