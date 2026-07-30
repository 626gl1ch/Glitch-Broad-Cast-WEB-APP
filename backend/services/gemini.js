const { GoogleGenerativeAI } = require("@google/generative-ai");

const AI_POLICY = `
CRITICAL SAFETY & PROHIBITED USE POLICY:
Do not engage in dangerous or illegal activities, or otherwise violate applicable law or regulations. This includes generating or distributing content that:
Relates to child sexual abuse or exploitation. Facilitates violent extremism or terrorism. Facilitates non-consensual intimate imagery. Facilitates self-harm. Facilitates illegal activities or violations of law. Violates the rights of others, including privacy and intellectual property rights. Tracks or monitors people without their consent. Makes automated decisions that have a material detrimental impact on individual rights without human supervision in high-risk domains.
Do not compromise the security of others' or Google's services. This includes generating or distributing content that facilitates: Spam, phishing, or malware. Abuse of, harm to, interference with, or disruption to Google's or others' infrastructure or services. Circumvention of abuse protections or safety filters.
Do not engage in sexually explicit, violent, hateful, or harmful activities. This includes generating or distributing content that facilitates: Hatred or hate speech. Harassment, bullying, intimidation, abuse, or the insulting of others. Violence or the incitement of violence. Sexually explicit content.
Do not engage in misinformation, misrepresentation, or misleading activities. This includes: Frauds, scams, or other deceptive actions. Impersonating an individual (living or dead) without explicit disclosure, in order to deceive. Facilitating misleading claims of expertise or capability in sensitive areas. Facilitating misleading claims related to governmental or democratic processes or harmful health practices, in order to deceive. Misrepresenting the provenance of generated content by claiming it was created solely by a human, in order to deceive.
`;

function getModel(systemInstruction, req) {
  const apiKey = req?.user?.profile?.settings?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please add it in the Settings page.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const MODEL = req?.user?.profile?.settings?.GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";

  return genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: systemInstruction + "\n\n" + AI_POLICY,
  });
}

/**
 * Free-form chat with the assistant. Keeps the last N turns as history.
 */
async function chat(req, history, message) {
  const model = getModel(
    "You are the in-app assistant for Glitch Broadcast, a social media " +
      "command center for Glitch EnterPrice (a solo dev/trader brand). " +
      "Be direct, concise, and practical. Help with content ideas, captions, " +
      "scheduling strategy, and general social media questions.",
    req
  );

  const chatSession = model.startChat({
    history: history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  const result = await chatSession.sendMessage(message);
  return result.response.text();
}

/**
 * Turn one raw idea into platform-specific variants.
 * platforms: array like ["facebook_page", "instagram", "linkedin", "facebook_group"]
 */
async function generateVariants(req, baseContent, platforms, brandVoiceNotes = "") {
  const model = getModel(
    "You write social media posts for Glitch EnterPrice, a Nigeria-based " +
      "solo developer / algo-trading brand. Voice: direct, confident, " +
      "technically credible, no fluff, no fake hype. " +
      (brandVoiceNotes ? `Extra brand notes: ${brandVoiceNotes}` : ""),
    req
  );

  const platformRules = {
    facebook_page:
      "Facebook Page: conversational, 2-4 short paragraphs, can include a light call to action.",
    facebook_group:
      "Facebook Group: warm and community-toned, avoid anything that reads like an ad, ask a genuine question if natural.",
    instagram:
      "Instagram: punchy, short lines, tasteful emoji, end with 5-8 relevant hashtags on their own line.",
    linkedin:
      "LinkedIn: professional but human, can be longer-form, structured with line breaks, no emoji spam, 3-5 hashtags max.",
  };

  const requested = platforms
    .map((p) => `- ${p}: ${platformRules[p] || "General best practice for this platform."}`)
    .join("\n");

  const prompt = `
Raw idea / source content:
"""
${baseContent}
"""

Rewrite this into the following platform variants. Return STRICT JSON only,
no markdown fences, no commentary, matching this shape exactly:

{
  "variants": [
    { "platform": "facebook_page", "content": "...", "hashtags": ["..."] }
  ]
}

Platforms to generate:
${requested}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (err) {
    throw new Error("Gemini AI failed to generate valid structured data. Please try again or simplify the prompt.");
  }
}

/**
 * Generate alt text for an uploaded image (image passed as base64).
 */
async function generateAltText(req, base64Data, mimeType) {
  const model = getModel("You write concise, accurate accessibility alt text for images.", req);
  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    { text: "Write a one-sentence accessibility alt text for this image. No preamble." },
  ]);
  return result.response.text().trim();
}

/**
 * Suggest the best posting time based on simple historical stats.
 */
async function suggestBestTime(req, engagementSummary) {
  const model = getModel(
    "You analyze social media engagement patterns and give a short, direct recommendation.",
    req
  );
  const result = await model.generateContent(
    `Given this engagement summary: ${JSON.stringify(engagementSummary)}, ` +
      `recommend the single best day and time window to post next, in one sentence.`
  );
  return result.response.text().trim();
}

/**
 * Helper to chunk massive strings and summarize them to avoid token limits.
 */
async function summarizeMassiveText(req, massiveText) {
  const CHUNK_SIZE = 15000;
  if (massiveText.length <= CHUNK_SIZE) return massiveText;

  let combinedSummary = "";
  for (let i = 0; i < massiveText.length; i += CHUNK_SIZE) {
    const chunk = massiveText.slice(i, i + CHUNK_SIZE);
    const model = getModel("You are a technical summarizer. Extract key product features, value propositions, and tone from the text.", req);
    const result = await model.generateContent(`Summarize the following product documentation chunk:\n\n${chunk}`);
    combinedSummary += result.response.text() + "\n\n";
  }
  return combinedSummary;
}

async function generateCampaignVariants(req, massiveText, platforms, tone, variantsPerCycle) {
  const summary = await summarizeMassiveText(req, massiveText);
  
  const model = getModel(
    `You are an elite AI social media strategist. Tone: ${tone}. Generate highly optimized, trending posts for a campaign.`,
    req
  );

  const platformRules = {
    facebook_page: "Facebook Page: conversational, high-engagement hooks.",
    facebook_group: "Facebook Group: community-focused, no ads vibe.",
    instagram: "Instagram: punchy, visual framing, 5-8 hashtags.",
    linkedin: "LinkedIn: professional, thought leadership, 3-5 hashtags.",
  };

  const requested = platforms.map((p) => `- ${p}: ${platformRules[p] || "General best practice."}`).join("\n");

  const prompt = `
Based on this product description:
"""
${summary}
"""

Generate ${variantsPerCycle} unique post variants for EACH of the requested platforms.
Return STRICT JSON only, matching this shape exactly:

{
  "variants": [
    { "platform": "facebook_page", "content": "...", "hashtags": ["..."] }
  ]
}

Platforms to generate for:
${requested}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (err) {
    throw new Error("Failed to generate campaign variants. Try reducing the number of variants per cycle.");
  }
}

async function generateVideoIdeas(req, massiveText) {
  const summary = await summarizeMassiveText(req, massiveText);
  const model = getModel("You are a viral short-form video producer.", req);
  
  const prompt = `
Based on this product:
"""
${summary}
"""
Generate 5 viral short-form video ideas (TikTok, Shorts, Reels). Return STRICT JSON only:
[
  {
    "platform_fit": "TikTok/Reels",
    "hook": "3-second opening hook script",
    "outline": "Main talking points",
    "hashtags": ["..."]
  }
]
`;
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/```json|```/g, "");
  return JSON.parse(text);
}

async function generateHooks(req, topic) {
  const model = getModel("You are a top-tier copywriter.", req);
  const prompt = `Generate 10 viral opening hooks for the topic: "${topic}". Return STRICT JSON only:
[
  { "hook": "...", "estimated_engagement": "High/Medium/Low" }
]
`;
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/```json|```/g, "");
  return JSON.parse(text);
}

module.exports = { chat, generateVariants, generateAltText, suggestBestTime, generateCampaignVariants, generateVideoIdeas, generateHooks };
