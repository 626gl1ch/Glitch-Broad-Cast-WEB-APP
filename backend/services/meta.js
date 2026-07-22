const axios = require("axios");

const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * Post text (+ optional single image URL) to your own Facebook Page.
 * This uses the official Graph API — works only for Pages you manage,
 * NOT for Groups (Meta restricts Group posting via API).
 */
async function postToFacebookPage(req, { message, imageUrl }) {
  const pageId = req.headers['x-meta-page-id'] || process.env.META_PAGE_ID;
  const token = req.headers['x-meta-page-token'] || process.env.META_PAGE_ACCESS_TOKEN;

  if (imageUrl) {
    const { data } = await axios.post(`${GRAPH}/${pageId}/photos`, {
      url: imageUrl,
      caption: message,
      access_token: token,
    }, { timeout: 15000 });
    return { platform_post_id: data.post_id || data.id };
  }

  const { data } = await axios.post(`${GRAPH}/${pageId}/feed`, {
    message,
    access_token: token,
  }, { timeout: 15000 });
  return { platform_post_id: data.id };
}

/**
 * Post to an Instagram Business account connected to your Page.
 * Instagram Graph API requires a two-step publish: create a media
 * container, then publish it.
 */
async function postToInstagram(req, { caption, imageUrl, locationId }) {
  const igUserId = req.headers['x-meta-ig-id'] || process.env.META_IG_BUSINESS_ACCOUNT_ID;
  const token = req.headers['x-meta-page-token'] || process.env.META_PAGE_ACCESS_TOKEN;

  const containerRes = await axios.post(`${GRAPH}/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    location_id: locationId || undefined,
    access_token: token,
  }, { timeout: 15000 });

  const creationId = containerRes.data.id;

  const publishRes = await axios.post(`${GRAPH}/${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: token,
  }, { timeout: 15000 });

  return { platform_post_id: publishRes.data.id };
}

/**
 * Search for an Instagram location ID by name (used for location tagging).
 */
async function searchInstagramLocation(req, query) {
  const token = req.headers['x-meta-page-token'] || process.env.META_PAGE_ACCESS_TOKEN;
  const { data } = await axios.get(`${GRAPH}/search`, {
    params: { type: "place", q: query, access_token: token },
    timeout: 15000
  });
  return data.data || [];
}

module.exports = { postToFacebookPage, postToInstagram, searchInstagramLocation };
