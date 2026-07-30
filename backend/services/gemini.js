const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const AI_POLICY = `
CRITICAL SAFETY & PROHIBITED USE POLICY:
Do not engage in dangerous or illegal activities, or otherwise violate applicable law or regulations. This includes generating or distributing content that:
Relates to child sexual abuse or exploitation. Facilitates violent extremism or terrorism. Facilitates non-consensual intimate imagery. Facilitates self-harm. Facilitates illegal activities or violations of law. Violates the rights of others, including privacy and intellectual property rights. Tracks or monitors people without their consent. Makes automated decisions that have a material detrimental impact on individual rights without human supervision in high-risk domains.
Do not compromise the security of others' or Google's services. This includes generating or distributing content that facilitates: Spam, phishing, or malware. Abuse of, harm to, interference with, or disruption to Google's or others' infrastructure or services. Circumvention of abuse protections or safety filters.
Do not engage in sexually explicit, violent, hateful, or harmful activities. This includes generating or distributing content that facilitates: Hatred or hate speech. Harassment, bullying, intimidation, abuse, or the insulting of others. Violence or the incitement of violence. Sexually explicit content.
Do not engage in misinformation, misrepresentation, or misleading activities. This includes: Frauds, scams, or other deceptive actions. Impersonating an individual (living or dead) without explicit disclosure, in order to deceive. Facilitating misleading claims of expertise or capability in sensitive areas. Facilitating misleading claims related to governmental or democratic processes or harmful health practices, in order to deceive. Misrepresenting the provenance of generated content by claiming it was created solely by a human, in order to deceive.
`;

async function dispatchAiCall(req, systemInstruction, prompt) {
  const settings = req?.user?.profile?.settings || {};
  const provider = settings.ACTIVE_AI_PROVIDER || "gemini";
  
  if (provider === "gemini") {
    const apiKey = settings.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API Key. Please add it in Settings.");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: settings.GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash" });
    const fullPrompt = systemInstruction + "\n\n" + AI_POLICY + "\n\nUser Request: " + prompt;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  }

  if (provider === "claude") {
    const apiKey = settings.CLAUDE_API_KEY;
    if (!apiKey) throw new Error("Missing Claude API Key. Please add it in Settings.");
    const res = await axios.post("https://api.anthropic.com/v1/messages", {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8192,
      system: systemInstruction + "\n\n" + AI_POLICY,
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      }
    });
    return res.data.content[0].text;
  }

  if (provider === "deepseek") {
    const apiKey = settings.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("Missing DeepSeek API Key. Please add it in Settings.");
    const res = await axios.post("https://api.deepseek.com/chat/completions", {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemInstruction + "\n\n" + AI_POLICY },
        { role: "user", content: prompt }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    return res.data.choices[0].message.content;
  }

  throw new Error("No valid AI provider configured.");
}

async function dispatchAiChat(req, systemInstruction, history, message) {
  const settings = req?.user?.profile?.settings || {};
  const provider = settings.ACTIVE_AI_PROVIDER || "gemini";
  
  if (provider === "gemini") {
    const apiKey = settings.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API Key.");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: settings.GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash", systemInstruction: systemInstruction + "\n\n" + AI_POLICY });
    const chatSession = model.startChat({
      history: history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    });
    const result = await chatSession.sendMessage(message);
    return result.response.text();
  }

  if (provider === "claude") {
    const apiKey = settings.CLAUDE_API_KEY;
    if (!apiKey) throw new Error("Missing Claude API Key.");
    const messages = history.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    messages.push({ role: "user", content: message });
    
    const res = await axios.post("https://api.anthropic.com/v1/messages", {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: systemInstruction + "\n\n" + AI_POLICY,
      messages
    }, {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" }
    });
    return res.data.content[0].text;
  }

  if (provider === "deepseek") {
    const apiKey = settings.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("Missing DeepSeek API Key.");
    const messages = [{ role: "system", content: systemInstruction + "\n\n" + AI_POLICY }];
    history.forEach(m => messages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    messages.push({ role: "user", content: message });
    
    const res = await axios.post("https://api.deepseek.com/chat/completions", {
      model: "deepseek-chat",
      messages
    }, {
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
    });
    return res.data.choices[0].message.content;
  }

  throw new Error("No valid AI provider configured.");
}

async function chat(req, history, message) {
  return await dispatchAiChat(
    req,
    "You are the in-app assistant for Glitch Broadcast, a social media command center for Glitch EnterPrice (a solo dev/trader brand). Be direct, concise, and practical. Help with content ideas, captions, scheduling strategy, and general social media questions.",
    history,
    message
  );
}

async function generateVariants(req, baseContent, platforms, brandVoiceNotes = "") {
  const system = "You write social media posts for Glitch EnterPrice, a Nigeria-based solo developer / algo-trading brand. Voice: direct, confident, technically credible, no fluff, no fake hype. " + (brandVoiceNotes ? `Extra brand notes: ${brandVoiceNotes}` : "");
  
  const platformRules = {
    facebook_page: "Facebook Page: conversational, 2-4 short paragraphs, can include a light call to action.",
    facebook_group: "Facebook Group: warm and community-toned, avoid anything that reads like an ad, ask a genuine question if natural.",
    instagram: "Instagram: punchy, short lines, tasteful emoji, end with 5-8 relevant hashtags on their own line.",
    linkedin: "LinkedIn: professional but human, can be longer-form, structured with line breaks, no emoji spam, 3-5 hashtags max.",
  };

  const requested = platforms.map((p) => `- ${p}: ${platformRules[p] || "General best practice for this platform."}`).join("\n");
  
  const prompt = `Raw idea / source content:\n"""\n${baseContent}\n"""\n\nRewrite this into the following platform variants. Return STRICT JSON only, no markdown fences, no commentary, matching this shape exactly:\n\n{\n  "variants": [\n    { "platform": "facebook_page", "content": "...", "hashtags": ["..."] }\n  ]\n}\n\nPlatforms to generate:\n${requested}`;
  
  const text = await dispatchAiCall(req, system, prompt);
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (err) {
    throw new Error("AI failed to generate valid structured data. Please try again or simplify the prompt.");
  }
}

// Keep image alt text generation tied to Gemini for safety/simplicity as other APIs handle images differently
async function generateAltText(req, base64Data, mimeType) {
  const apiKey = req?.user?.profile?.settings?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API Key for image processing.");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: "You write concise, accurate accessibility alt text for images." });
  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    { text: "Write a one-sentence accessibility alt text for this image. No preamble." },
  ]);
  return result.response.text().trim();
}

async function suggestBestTime(req, engagementSummary) {
  const text = await dispatchAiCall(
    req,
    "You analyze social media engagement patterns and give a short, direct recommendation.",
    `Given this engagement summary: ${JSON.stringify(engagementSummary)}, recommend the single best day and time window to post next, in one sentence.`
  );
  return text.trim();
}

async function generateCampaignVariants(req, massiveText, platforms, tone, variantsPerCycle) {
  const system = `You are an elite AI social media strategist. Tone: ${tone}. Generate highly optimized, trending posts for a campaign.`;
  
  const platformRules = {
    facebook_page: "Facebook Page: conversational, high-engagement hooks.",
    facebook_group: "Facebook Group: community-focused, no ads vibe.",
    instagram: "Instagram: punchy, visual framing, 5-8 hashtags.",
    linkedin: "LinkedIn: professional, thought leadership, 3-5 hashtags.",
  };

  const requested = platforms.map((p) => `- ${p}: ${platformRules[p] || "General best practice."}`).join("\n");

  // Removed chunking entirely! The full text is sent to the LLM directly to handle up to 1M+ words natively.
  const prompt = `Based on this product description:\n"""\n${massiveText}\n"""\n\nGenerate ${variantsPerCycle} unique post variants for EACH of the requested platforms.\nReturn STRICT JSON only, matching this shape exactly:\n\n{\n  "variants": [\n    { "platform": "facebook_page", "content": "...", "hashtags": ["..."] }\n  ]\n}\n\nPlatforms to generate for:\n${requested}`;

  const text = await dispatchAiCall(req, system, prompt);
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (err) {
    throw new Error("Failed to generate campaign variants. Try reducing the number of variants per cycle.");
  }
}

async function generateVideoIdeas(req, massiveText) {
  const system = "You are a viral short-form video producer.";
  const prompt = `Based on this product:\n"""\n${massiveText}\n"""\nGenerate 5 viral short-form video ideas (TikTok, Shorts, Reels). Return STRICT JSON only:\n[\n  {\n    "platform_fit": "TikTok/Reels",\n    "hook": "3-second opening hook script",\n    "outline": "Main talking points",\n    "hashtags": ["..."]\n  }\n]`;
  
  const text = await dispatchAiCall(req, system, prompt);
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    return [];
  }
}

async function generateHooks(req, topic) {
  const system = "You are a top-tier copywriter.";
  const prompt = `Generate 10 viral opening hooks for the topic: "${topic}". Return STRICT JSON only:\n[\n  { "hook": "...", "estimated_engagement": "High/Medium/Low" }\n]`;
  
  const text = await dispatchAiCall(req, system, prompt);
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch(e) {
    return [];
  }
}

module.exports = { chat, generateVariants, generateAltText, suggestBestTime, generateCampaignVariants, generateVideoIdeas, generateHooks };
