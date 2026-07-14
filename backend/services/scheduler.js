const cron = require("node-cron");
const { supabase } = require("../middleware/auth");
const meta = require("./meta");
const linkedin = require("./linkedin");

/**
 * Runs every minute. Publishes any scheduled post whose time has arrived,
 * for platforms with official APIs (Page, Instagram, LinkedIn).
 * Facebook Group variants are skipped here — they always go through the
 * assisted posting queue instead, since that step needs a human click.
 */
function startScheduler() {
  cron.schedule("* * * * *", async () => {
    const now = new Date().toISOString();

    const { data: duePosts, error } = await supabase
      .from("posts")
      .select("*, post_variants(*)")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (error || !duePosts?.length) return;

    for (const post of duePosts) {
      for (const variant of post.post_variants) {
        if (variant.platform === "facebook_group") continue;
        if (variant.publish_status !== "pending") continue;

        try {
          const fullText = [variant.content, (variant.hashtags || []).join(" ")]
            .filter(Boolean)
            .join("\n\n");

          let result;
          if (variant.platform === "facebook_page") {
            result = await meta.postToFacebookPage({ message: fullText });
          } else if (variant.platform === "instagram") {
            result = await meta.postToInstagram({ caption: fullText });
          } else if (variant.platform === "linkedin") {
            result = await linkedin.postToLinkedIn({ text: fullText });
          }

          await supabase
            .from("post_variants")
            .update({
              publish_status: "posted",
              platform_post_id: result?.platform_post_id,
              posted_at: new Date().toISOString(),
            })
            .eq("id", variant.id);
        } catch (err) {
          await supabase
            .from("post_variants")
            .update({ publish_status: "failed", error_message: err.message })
            .eq("id", variant.id);
        }
      }

      await supabase.from("posts").update({ status: "published" }).eq("id", post.id);
    }
  });

  console.log("[scheduler] running — checking for due posts every minute");
}

module.exports = { startScheduler };
