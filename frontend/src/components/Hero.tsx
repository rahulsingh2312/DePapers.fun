'use client'
import { SiSolana } from "react-icons/si";
import ConnectWallet from "./ConnectWallet";
import { toast } from "sonner";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from "@headlessui/react";
import Image from "next/image";
import { useState } from "react";

const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="p-10 max-sm:p-4">
        <div className="flex items-center w-fit">
        <h1 className="text-9xl max-md:text-8xl max-sm:text-4xl font-light bg-gradient-to-br from-black to-[#966300]  bg-clip-text text-transparent">
        Tokenize <br/>Unpublished Papers
        </h1>
        <SiSolana className="text-[#966300]" />
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 w-fit">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              aria-label="Publish a paper"
              className="cursor-pointer transition-all hover:translate-y-2 hover:invert"
            >
              <Image
                src="/publishPaper.png"
                width={150}
                height={100}
                className="select-none pointer-events-none"
                draggable="false"
                alt="Publish a paper"
              />
            </button>
            <ConnectWallet  />
        </div>
        <ConsentModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
    </main>
  )
}

export default Hero


type LocalToken = {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  metadataUrl: string;
  mintAddress: string;
  transactionSignature: string;
  creatorWallet: string;
  createdAt: string;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  isLocal: true;
};

const generateMintAddress = () => {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < 44; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const ConsentModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [formState, setFormState] = useState({
    name: "",
    symbol: "",
    description: "",
    twitter: "",
    telegram: "",
    website: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const validateForm = () => {
    setError("");

    if (!formState.name.trim()) {
      setError("Paper title is required");
      return false;
    }

    if (formState.symbol.length > 10) {
      setError("Symbol must be 10 characters or less");
      return false;
    }

    if (!formState.symbol.trim()) {
      setError("Symbol is required");
      return false;
    }

    if (!formState.description.trim()) {
      setError("Abstract/description is required");
      return false;
    }

    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "symbol") {
      const uppercaseValue = value.toUpperCase().slice(0, 10);
      setFormState((prev) => ({ ...prev, [name]: uppercaseValue }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }

    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be 5MB or less");
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const resetForm = () => {
    setFormState({
      name: "",
      symbol: "",
      description: "",
      twitter: "",
      telegram: "",
      website: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const imageDataUrl = imageFile ? await readFileAsDataUrl(imageFile) : "";

      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newToken: LocalToken = {
        id,
        name: formState.name.trim(),
        symbol: formState.symbol.trim(),
        description: formState.description.trim(),
        imageUrl: imageDataUrl,
        metadataUrl: "",
        mintAddress: generateMintAddress(),
        transactionSignature: "",
        creatorWallet: "",
        createdAt: new Date().toISOString(),
        twitter: formState.twitter.trim() || null,
        telegram: formState.telegram.trim() || null,
        website: formState.website.trim() || null,
        isLocal: true,
      };

      const existing: LocalToken[] = JSON.parse(
        localStorage.getItem("localTokens") || "[]"
      );
      const updated = [newToken, ...existing];
      localStorage.setItem("localTokens", JSON.stringify(updated));

      window.dispatchEvent(new CustomEvent("localTokens:updated"));

      toast.success("Token created and saved locally!");
      resetForm();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error creating token:", err);
      toast.error(`Error: ${message}`);
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <DialogPanel className="bg-white p-8 max-sm:p-5 rounded-lg shadow-xl border border-gray-200 relative overflow-y-auto max-h-[90vh] w-full max-w-xl">
        <DialogTitle className="text-2xl font-serif font-semibold text-gray-800 border-b border-gray-200 pb-2">
          Tokenize Research Paper
        </DialogTitle>

        <DialogDescription className="mt-3 text-sm text-gray-600 font-serif">
          Create a token representing your unpublished research paper. Saved locally in your browser.
        </DialogDescription>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Paper Title"
              value={formState.name}
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
              required
              maxLength={100}
            />
          </div>

          <div>
            <input
              type="text"
              name="symbol"
              placeholder="Token Symbol (e.g., PAPER)"
              value={formState.symbol}
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
              required
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formState.symbol.length}/10 characters (uppercase)
            </p>
          </div>

          <textarea
            name="description"
            placeholder="Abstract/Description"
            value={formState.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="twitter"
              placeholder="Twitter (optional)"
              value={formState.twitter}
              onChange={handleChange}
              className="p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
            />
            <input
              type="text"
              name="telegram"
              placeholder="Telegram (optional)"
              value={formState.telegram}
              onChange={handleChange}
              className="p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <input
            type="text"
            name="website"
            placeholder="Website/Repository URL (optional)"
            value={formState.website}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
          />

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md px-4 py-2 transition"
                >
                  {imageFile ? "Change Image" : "Upload Cover Image"}
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB (optional)</p>
            </div>

            {imagePreview && (
              <div className="mt-4">
                <div className="relative w-32 h-32 mx-auto border rounded overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition font-serif"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition font-serif shadow-md disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Publish Token"}
            </button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
