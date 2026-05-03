const promptCache = new Map();

const buildCacheKey = (payload) => {
  return JSON.stringify({
    version: 2,
    title: payload.title,
    style: payload.style,
    colors: payload.colors,
    aspectRatio: payload.aspectRatio,
    extraPrompt: payload.extraPrompt,
    sourceImage: payload.sourceImage,
    mode: payload.mode,
    changeRequest: payload.changeRequest
  });
};

const getCachedPrompt = (payload) => {
  const key = buildCacheKey(payload);
  return promptCache.get(key);
};

const setCachedPrompt = (payload, prompt) => {
  const key = buildCacheKey(payload);
  promptCache.set(key, prompt);
  return prompt;
};

module.exports = {
  getCachedPrompt,
  setCachedPrompt
};