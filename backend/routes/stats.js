const express = require("express");
const router = express.Router();
const { supabase, requireAuth } = require("../middleware/auth");

// Get high-level stats for the Dashboard
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [
      { count: publishedCount, error: publishedErr },
      { count: scheduledCount, error: scheduledErr },
      { count: queuedCount, error: queuedErr }
    ] = await Promise.all([
      supabase.from("post_variants").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("publish_status", "posted"),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "scheduled"),
      supabase.from("assisted_posting_queue").select("*", { count: "exact", head: true }).eq("user_id", userId).in("status", ["queued", "in_progress"])
    ]);

    if (publishedErr) throw publishedErr;
    if (scheduledErr) throw scheduledErr;
    if (queuedErr) throw queuedErr;

    res.json({
      totalPublished: publishedCount || 0,
      totalScheduled: scheduledCount || 0,
      totalGroupQueued: queuedCount || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a unified activity log from multiple tables
router.get("/activity", requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const { data: variants, error: vErr } = await supabase
      .from("post_variants")
      .select("id, platform, publish_status, content, created_at, posted_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    const { data: queues, error: qErr } = await supabase
      .from("assisted_posting_queue")
      .select("id, status, group_url, created_at, updated_at, post_variants(content)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (vErr) throw vErr;
    if (qErr) throw qErr;

    const activity = [];

    // Map variants to activity
    variants.forEach(v => {
      if (v.publish_status === "posted") {
        activity.push({
          id: `act-v-post-${v.id}`,
          type: "publish",
          platform: v.platform,
          text: `Published: "${v.content.substring(0, 50)}..."`,
          time: v.posted_at || v.created_at
        });
      }
    });

    // Map group queue to activity
    queues.forEach(q => {
      activity.push({
        id: `act-q-${q.id}`,
        type: q.status === "done" ? "publish" : "schedule",
        platform: "facebook_group",
        text: `Group ${q.status}: "${(q.post_variants?.content || "").substring(0, 40)}..."`,
        time: q.updated_at || q.created_at
      });
    });

    // Sort descending by time
    activity.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(activity.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
