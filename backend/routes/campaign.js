const express = require("express");
const router = express.Router();
const gemini = require("../services/gemini");
const { supabase, requireAuth } = require("../middleware/auth");

// Create Campaign & Schedule Posts
router.post("/", requireAuth, async (req, res) => {
  const { name, description, platforms, tone, scheduleType, variantsPerCycle } = req.body;
  const userId = req.user.id;
  
  if (!name || !description || !platforms?.length) {
    return res.status(400).json({ error: "name, description, and platforms[] are required" });
  }

  try {
    // 1. Create Campaign
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .insert({ 
        user_id: userId, 
        name, 
        description, 
        platforms, 
        tone, 
        schedule_type: scheduleType, 
        variants_per_cycle: variantsPerCycle 
      })
      .select()
      .single();
    if (campErr) throw campErr;

    // 2. Generate variants via Gemini
    const { variants } = await gemini.generateCampaignVariants(req, description, platforms, tone, variantsPerCycle);

    // 3. Create a parent post to anchor the variants
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .insert({ 
        user_id: userId, 
        campaign_id: campaign.id,
        title: `Campaign Post: ${name}`, 
        base_content: "Generated from Campaign Document",
        status: 'scheduled'
      })
      .select()
      .single();
    if (postErr) throw postErr;

    // 4. Save the generated variants
    const rows = variants.map((v) => ({
      post_id: post.id,
      user_id: userId,
      platform: v.platform,
      content: v.content,
      hashtags: v.hashtags || [],
      publish_status: 'pending' // will be picked up by scheduler based on scheduleType
    }));

    const { data: savedVariants, error: varErr } = await supabase
      .from("post_variants")
      .insert(rows)
      .select();
    if (varErr) throw varErr;

    res.json({ campaign, post, variants: savedVariants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Campaigns
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*, posts(*, post_variants(*))")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(campaigns);
});

// Generate Video Ideas
router.post("/video-ideas", requireAuth, async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: "description is required" });
  try {
    const ideas = await gemini.generateVideoIdeas(req, description);
    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Hooks
router.post("/hooks", requireAuth, async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "topic is required" });
  try {
    const hooks = await gemini.generateHooks(req, topic);
    res.json(hooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
