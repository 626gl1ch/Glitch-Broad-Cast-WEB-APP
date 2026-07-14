const express = require("express");
const router = express.Router();
const { supabase, requireAuth } = require("../middleware/auth");
const gemini = require("../services/gemini");

// List content vault items, optionally filtered by folder
router.get("/", requireAuth, async (req, res) => {
  const { folder } = req.query;
  let query = supabase.from("content_items").select("*").eq("user_id", req.user.id).order("created_at", { ascending: false });
  if (folder) query = query.eq("folder", folder);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Upload a file to Supabase Storage and register it in content_items
router.post("/upload", requireAuth, async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const file = req.files.file;
  const folder = req.body.folder || "general";
  const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  try {
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b) => b.name === "content-vault")) {
      await supabase.storage.createBucket("content-vault", { public: true });
    }
    const { error: uploadErr } = await supabase.storage
      .from("content-vault")
      .upload(path, file.data, { contentType: file.mimetype });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("content-vault").getPublicUrl(path);

    let altText = null;
    if (file.mimetype.startsWith("image/")) {
      try {
        altText = await gemini.generateAltText(req, file.data.toString("base64"), file.mimetype);
      } catch (_) {
        // alt text generation is best-effort, don't block the upload on it
      }
    }

    const { data: item, error: dbErr } = await supabase
      .from("content_items")
      .insert({
        user_id: req.user.id,
        name: file.name,
        folder,
        file_url: urlData.publicUrl,
        file_type: file.mimetype.startsWith("image/") ? "image" : "document",
        notes: altText,
      })
      .select()
      .single();
    if (dbErr) throw dbErr;

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { error } = await supabase.from("content_items").delete().eq("id", req.params.id).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
