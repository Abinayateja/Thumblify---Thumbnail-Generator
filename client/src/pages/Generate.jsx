import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { aspectRatios, palettes, styles } from "../utils/constants";
import { resolveThumbnailUrl } from "../utils/thumbnailUrls";

const defaultGenerateState = {
  title: "",
  aspectRatio: "16:9",
  style: "Bold",
  colors: palettes[0],
  prompt: "",
  sourceImage: ""
};

const defaultRecreateState = {
  title: "",
  aspectRatio: "16:9",
  style: "Cinematic",
  colors: palettes[1],
  sourceImage: "",
  changeRequest: ""
};

const Generate = ({ setToast }) => {
  const { updateCredits } = useAuth();
  const [activeTab, setActiveTab] = useState("generate");
  const [generateForm, setGenerateForm] = useState(defaultGenerateState);
  const [recreateForm, setRecreateForm] = useState(defaultRecreateState);
  const [preview, setPreview] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [previewRetryCount, setPreviewRetryCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!preview?.imageUrl) {
      setPreviewSrc("");
      setPreviewRetryCount(0);
      return;
    }

    setPreviewSrc(resolveThumbnailUrl(preview.imageUrl));
    setPreviewRetryCount(0);
  }, [preview]);

  useEffect(() => {
    if (!preview?.imageUrl || previewRetryCount === 0 || previewRetryCount > 3) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      const url = new URL(resolveThumbnailUrl(preview.imageUrl));
      url.searchParams.set("retry", `${Date.now()}`);
      setPreviewSrc(url.toString());
    }, 1200 * previewRetryCount);

    return () => clearTimeout(timeoutId);
  }, [preview, previewRetryCount]);

  const handleColorSelect = (tab, palette) => {
    if (tab === "generate") {
      setGenerateForm({ ...generateForm, colors: palette });
      return;
    }

    setRecreateForm({ ...recreateForm, colors: palette });
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await api.generateThumbnail({
        ...generateForm,
        mode: "generate"
      });
      setPreview(data.thumbnail);
      updateCredits(data.credits);
      setToast({ type: "success", message: "Thumbnail generated successfully" });
    } catch (error) {
      setToast({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRecreate = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await api.generateThumbnail({
        ...recreateForm,
        prompt: recreateForm.changeRequest,
        mode: "recreate"
      });
      setPreview(data.thumbnail);
      updateCredits(data.credits);
      setToast({ type: "success", message: "Thumbnail recreated successfully" });
    } catch (error) {
      setToast({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-pink">Studio</p>
          <h1 className="mt-3 text-4xl font-black text-white">Generate smarter thumbnails</h1>
        </div>
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          {["generate", "recreate"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2 text-sm capitalize transition ${
                activeTab === tab
                  ? "bg-gradient-to-r from-brand-pink to-brand-purple text-white"
                  : "text-slate-300"
              }`}
            >
              {tab === "generate" ? "Generate Thumbnail" : "Recreate Thumbnail"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="glass-card rounded-[32px] p-6">
          {activeTab === "generate" ? (
            <form onSubmit={handleGenerate} className="space-y-5">
              <InputBlock
                label="Title / Topic"
                value={generateForm.title}
                onChange={(value) => setGenerateForm({ ...generateForm, title: value })}
                placeholder="YouTube SEO Secrets for 2026"
              />
              <SelectBlock
                label="Aspect Ratio"
                value={generateForm.aspectRatio}
                options={aspectRatios}
                onChange={(value) => setGenerateForm({ ...generateForm, aspectRatio: value })}
              />
              <SelectBlock
                label="Style"
                value={generateForm.style}
                options={styles}
                onChange={(value) => setGenerateForm({ ...generateForm, style: value })}
              />
              <PaletteBlock
                label="Color Palette"
                value={generateForm.colors}
                onSelect={(palette) => handleColorSelect("generate", palette)}
              />
              <InputBlock
                label="Optional Prompt"
                value={generateForm.prompt}
                onChange={(value) => setGenerateForm({ ...generateForm, prompt: value })}
                placeholder="Face close-up, shocked expression, huge contrast"
              />
              <InputBlock
                label="Optional Image Upload URL"
                value={generateForm.sourceImage}
                onChange={(value) => setGenerateForm({ ...generateForm, sourceImage: value })}
                placeholder="Paste uploaded image URL"
              />
              <SubmitButton loading={loading} text="Generate Thumbnail" />
            </form>
          ) : (
            <form onSubmit={handleRecreate} className="space-y-5">
              <InputBlock
                label="Current Thumbnail Topic"
                value={recreateForm.title}
                onChange={(value) => setRecreateForm({ ...recreateForm, title: value })}
                placeholder="How I Grew to 1M Subscribers"
              />
              <InputBlock
                label="Upload Image Or Paste URL"
                value={recreateForm.sourceImage}
                onChange={(value) => setRecreateForm({ ...recreateForm, sourceImage: value })}
                placeholder="Paste image URL"
              />
              <InputBlock
                label="What To Change"
                value={recreateForm.changeRequest}
                onChange={(value) => setRecreateForm({ ...recreateForm, changeRequest: value })}
                placeholder="Make it more dramatic and add stronger text space"
              />
              <SelectBlock
                label="Aspect Ratio"
                value={recreateForm.aspectRatio}
                options={aspectRatios}
                onChange={(value) => setRecreateForm({ ...recreateForm, aspectRatio: value })}
              />
              <SelectBlock
                label="Style"
                value={recreateForm.style}
                options={styles}
                onChange={(value) => setRecreateForm({ ...recreateForm, style: value })}
              />
              <PaletteBlock
                label="Color Palette"
                value={recreateForm.colors}
                onSelect={(palette) => handleColorSelect("recreate", palette)}
              />
              <SubmitButton loading={loading} text="Recreate Thumbnail" />
            </form>
          )}
        </div>

        <div className="glass-card rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-cyan">Preview</p>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80">
            {preview ? (
              <img
                src={previewSrc}
                alt={preview.title}
                className="h-[420px] w-full object-cover"
                onError={() => {
                  setPreviewRetryCount((current) => (current < 3 ? current + 1 : current));
                }}
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center bg-gradient-to-br from-brand-pink/10 via-slate-900 to-brand-purple/10 px-6 text-center text-slate-400">
                Your generated thumbnail preview will appear here.
              </div>
            )}
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Optimized prompt</p>
              <p className="mt-2 text-sm text-slate-200">{preview?.prompt || "No prompt yet"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Tip: use short titles and strong palette contrast for better results.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputBlock = ({ label, value, onChange, placeholder }) => {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-200">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-pink/40"
        placeholder={placeholder}
        required={label !== "Optional Prompt" && label !== "Optional Image Upload URL"}
      />
    </div>
  );
};

const SelectBlock = ({ label, value, onChange, options }) => {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-200">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-pink/40"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-900">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

const PaletteBlock = ({ label, value, onSelect }) => {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-200">{label}</label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {palettes.map((palette) => (
          <button
            type="button"
            key={palette.join("-")}
            onClick={() => onSelect(palette)}
            className={`rounded-2xl border p-3 transition ${
              value.join("-") === palette.join("-")
                ? "border-brand-pink/50 bg-white/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex gap-2">
              {palette.map((color) => (
                <span
                  key={color}
                  className="h-7 w-7 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const SubmitButton = ({ loading, text }) => (
  <button
    type="submit"
    className="w-full rounded-2xl bg-gradient-to-r from-brand-pink to-brand-purple px-4 py-3 font-semibold text-white"
  >
    {loading ? "Generating..." : text}
  </button>
);

export default Generate;