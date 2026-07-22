const axios = require("axios");

const API = "https://api.linkedin.com/v2";

/**
 * Post text (+ optional single image) to your own LinkedIn profile
 * using the official UGC Posts API. Requires an approved LinkedIn app
 * with the w_member_social scope.
 */
async function postToLinkedIn(req, { text, imageAssetUrn }) {
  const token = req.headers['x-linkedin-token'] || process.env.LINKEDIN_ACCESS_TOKEN;
  const authorUrn = req.headers['x-linkedin-urn'] || process.env.LINKEDIN_PERSON_URN; // e.g. "urn:li:person:XXXXXXX"

  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: imageAssetUrn ? "IMAGE" : "NONE",
        ...(imageAssetUrn && {
          media: [
            {
              status: "READY",
              media: imageAssetUrn,
            },
          ],
        }),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const { data } = await axios.post(`${API}/ugcPosts`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    timeout: 15000,
  });

  return { platform_post_id: data.id };
}

module.exports = { postToLinkedIn };
