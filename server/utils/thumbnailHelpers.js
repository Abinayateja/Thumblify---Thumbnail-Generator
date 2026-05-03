const Groq = require("groq-sdk");
const { getCachedPrompt, setCachedPrompt } = require("./promptCache");

const SUPPORTED_REFERENCE_IMAGE_HOSTS = new Set([
  "image.pollinations.ai",
  "pollinations.ai"
]);

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const ratioMap = {
  "16:9": {
    label: "YouTube thumbnail wide composition",
    width: 1280,
    height: 720
  },
  "1:1": {
    label: "square composition",
    width: 1080,
    height: 1080
  },
  "9:16": {
    label: "vertical short video composition",
    width: 900,
    height: 1600
  }
};

const sanitizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const compactPrompt = (value) => {
  const cleaned = sanitizeText(value)
    .replace(/^["']+|["']+$/g, "")
    .replace(/\.\s+/g, ", ")
    .replace(/\s*,\s*/g, ", ");

  if (!cleaned) {
    return "";
  }

  const words = cleaned.split(" ").filter(Boolean).slice(0, 48);
  return words.join(" ").slice(0, 320).trim().replace(/[.,;:!?]+$/g, "");
};

const joinColors = (colors) => (
  colors && colors.length ? colors.join(", ") : "high contrast red, yellow, black"
);

const createPromptTemplate = (payload) => {
  const colors = joinColors(payload.colors);
  const style = payload.style || "Bold";
  const aspectConfig = ratioMap[payload.aspectRatio] || ratioMap["16:9"];
  const title = sanitizeText(payload.title);
  const extraPrompt = sanitizeText(payload.extraPrompt);
  const changeRequest = sanitizeText(payload.changeRequest);
  const modeInstruction = payload.mode === "recreate"
    ? "Recreate the thumbnail as a cleaner, stronger, more clickable version while preserving the core idea."
    : "Generate a fresh thumbnail concept that feels instantly understandable and clickable.";
  const sourceInstruction = payload.sourceImage
    ? "A reference image will be supplied separately. Match its core subject when useful, but improve composition, lighting, clarity, and thumbnail readability."
    : "";

  return [
    `Write one production-ready image prompt for a ${aspectConfig.label}.`,
    `Topic: ${title}.`,
    `Visual style: ${style}.`,
    `Color direction: ${colors}.`,
    modeInstruction,
    sourceInstruction,
    extraPrompt ? `Extra creative direction: ${extraPrompt}.` : "",
    changeRequest ? `Requested changes: ${changeRequest}.` : "",
    "Make the image obviously related to the topic, with one dominant focal subject, strong emotion when relevant, bold contrast, clean subject separation, dramatic lighting, sharp details, and clear empty space for headline text.",
    "Avoid clutter, tiny background subjects, unreadable text inside the image, extra fingers, warped faces, muddy colors, low detail, and confusing composition.",
    "Return only the final image prompt."
  ].filter(Boolean).join(" ");
};

const createFallbackPrompt = (payload) => {
  const aspectConfig = ratioMap[payload.aspectRatio] || ratioMap["16:9"];
  const direction = [
    sanitizeText(payload.title),
    `${payload.style || "Bold"} YouTube thumbnail`,
    joinColors(payload.colors),
    aspectConfig.label,
    "one main subject",
    "strong emotional expression",
    "high contrast",
    "dramatic cinematic lighting",
    "sharp details",
    "clean background separation",
    "negative space for headline text",
    sanitizeText(payload.extraPrompt),
    payload.mode === "recreate" ? sanitizeText(payload.changeRequest) : ""
  ].filter(Boolean);

  return compactPrompt(direction.join(", "));
};

const normalizeSourceImageUrl = (value) => {
  const sourceImage = sanitizeText(value);

  if (!sourceImage) {
    return "";
  }

  try {
    const parsedUrl = new URL(sourceImage);

    if (parsedUrl.pathname.endsWith("/thumbnails/proxy")) {
      const proxiedUrl = parsedUrl.searchParams.get("url");

      if (!proxiedUrl) {
        return "";
      }

      const originalUrl = new URL(proxiedUrl);
      return ["http:", "https:"].includes(originalUrl.protocol) ? originalUrl.toString() : "";
    }

    return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl.toString() : "";
  } catch (error) {
    return "";
  }
};

const canUseSourceImageForGeneration = (value) => {
  const normalizedUrl = normalizeSourceImageUrl(value);

  if (!normalizedUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    return SUPPORTED_REFERENCE_IMAGE_HOSTS.has(parsedUrl.hostname);
  } catch (error) {
    return false;
  }
};

const optimizePrompt = async (payload) => {
  const cached = getCachedPrompt(payload);
  if (cached) {
    return cached;
  }

  const fallback = createFallbackPrompt(payload);

  if (!groqClient) {
    return setCachedPrompt(payload, fallback);
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: "You write compact, highly visual prompts for thumbnail image generation models. Output only one prompt, no quotes, no full sentences paragraph, maximum 45 words."
        },
        {
          role: "user",
          content: createPromptTemplate(payload)
        }
      ]
    });

    const prompt = compactPrompt(completion.choices?.[0]?.message?.content);
    return setCachedPrompt(payload, prompt || fallback);
  } catch (error) {
    return setCachedPrompt(payload, fallback);
  }
};

const buildImageUrl = (prompt, aspectRatio, options = {}) => {
  const aspectConfig = ratioMap[aspectRatio] || ratioMap["16:9"];
  const seed = `${prompt}-${aspectRatio}-${options.mode || "generate"}`;
  const query = new URLSearchParams({
    width: String(aspectConfig.width),
    height: String(aspectConfig.height),
    seed,
    model: options.sourceImage ? "kontext" : "flux",
    enhance: "true",
    nologo: "true",
    private: "true",
    safe: "false",
    negative: "blurry, low detail, extra limbs, distorted face, unreadable text, cluttered composition, washed out colors"
  });

  if (options.sourceImage) {
    query.set("image", options.sourceImage);
  }

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${query.toString()}`;
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const warmImageUrl = async (imageUrl, attempts = 3) => {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          Accept: "image/*"
        }
      });

      if (response.ok) {
        await response.arrayBuffer();
        return imageUrl;
      }
    } catch (error) {
      // Ignore transient upstream failures and retry below.
    }

    await sleep(700 * (index + 1));
  }

  return imageUrl;
};

module.exports = {
  optimizePrompt,
  buildImageUrl,
  normalizeSourceImageUrl,
  canUseSourceImageForGeneration,
  warmImageUrl
};