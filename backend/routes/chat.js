const express = require("express");
const router = express.Router();
const gemini = require("../services/gemini");
const { supabase, requireAuth } = require("../middleware/auth");

// GET last 50 messages
router.get("/", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new message, get the assistant's reply
router.post("/", requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  try {
    const { data: history } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: true })
      .limit(20);

    const reply = await gemini.chat(req, history || [], message);

    await supabase.from("chat_messages").insert([
      { role: "user", content: message, user_id: req.user.id },
      { role: "assistant", content: reply, user_id: req.user.id },
    ]);

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
