'use client'
import { SiSolana } from "react-icons/si";
import ConnectWallet from "./ConnectWallet";
import { Toaster, toast } from "sonner";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
  DialogDescription,
} from "@headlessui/react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Keypair } from "@solana/web3.js";
const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = () => {
    setIsModalOpen(false);
    console.log("Creating GoFundMe token...");
    // Replace this with your actual token creation logic
  };
  return (
    <main className="p-10">
        <div className="flex items-center w-fit">
        <h1 className="text-9xl max-md:text-8xl max-sm:text-6xl font-light bg-gradient-to-br from-black to-[#966300]  bg-clip-text text-transparent">
        Tokenize <br/>Unpublished Papers

        </h1>
        <SiSolana className="text-[#966300]" />

        </div>

        <div className="mt-6 flex items-center justify-center gap-6 w-fit">
            <Image
             onClick={() => setIsModalOpen(true)}
            src="/publishPaper.png" width={150} height={100} className="select-none hover:invert cursor-pointer transition-all hover:translate-y-2" draggable="false" alt="" />
            <ConnectWallet  />

        </div>
        <ConsentModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              // onConfirm={handleConfirm}
            />
    </main>
  )
}



export default Hero


const ConsentModal = ({ isOpen, onClose }) => {
  const { publicKey, signTransaction, connected } = useWallet();
  const [error, setError] = useState("");

  const [formState, setFormState] = useState({
    name: "",
    symbol: "",
    description: "",
    twitter: "",
    telegram: "",
    website: "",
    amount: 0.01,
    slippage: 10,
    priorityFee: 0.0005,
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateForm = () => {
    // Reset previous errors
    setError("");
    
    // Validate symbol length - Solana requires 10 characters or less
    if (formState.symbol.length > 10) {
      setError("Symbol must be 10 characters or less");
      return false;
    }
    
    // Check if image is selected
    if (!imageFile) {
      setError("Please upload an image file");
      return false;
    }
    
    // Validate name is not empty
    if (!formState.name.trim()) {
      setError("Paper title is required");
      return false;
    }
    
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for symbol to enforce uppercase and character limit
    if (name === "symbol") {
      const uppercaseValue = value.toUpperCase();
      const trimmedValue = uppercaseValue.slice(0, 10); // Limit to 10 characters
      setFormState(prev => ({ ...prev, [name]: trimmedValue }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when user types
    setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit");
        return;
      }
      
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setError("");
    }
  };

  const uploadImageToIPFS = async () => {
    if (!imageFile) return null;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("name", formState.name);
      formData.append("symbol", formState.symbol);
      formData.append("description", formState.description);
      
      // Only append if values exist
      if (formState.twitter) formData.append("twitter", formState.twitter);
      if (formState.telegram) formData.append("telegram", formState.telegram);
      if (formState.website) formData.append("website", formState.website);
      
      formData.append("showName", "true");

      const metadataResponse = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        body: formData,
      });

      if (!metadataResponse.ok) {
        throw new Error("Failed to upload image to IPFS");
      }

      const metadataResponseJSON = await metadataResponse.json();
      return metadataResponseJSON;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form first
    if (!validateForm()) {
      return;
    }
    
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    toast.info("Uploading image and creating your token...");

    try {
      // Upload image and get metadata
      const metadataResponse = await uploadImageToIPFS();
      if (!metadataResponse) {
        throw new Error("Failed to create metadata");
      }

      const mintKeypair = Keypair.generate();

      const response = await fetch("https://pumpportal.fun/api/trade-local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey: publicKey.toString(),
          action: "create",
          tokenMetadata: {
            name: metadataResponse.metadata.name,
            symbol: metadataResponse.metadata.symbol,
            uri: metadataResponse.metadataUri
          },
          mint: mintKeypair.publicKey.toString(),
          denominatedInSol: "true",
          amount: formState.amount,
          slippage: formState.slippage,
          priorityFee: formState.priorityFee,
          pool: "pump",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate transaction: ${errorText}`);
      }
      
      const txData = await response.arrayBuffer();
      const tx = (
        await import("@solana/web3.js")
      ).VersionedTransaction.deserialize(new Uint8Array(txData));

      tx.sign([mintKeypair]);
      const signedTx = await signTransaction(tx);

      const connection = new (await import("@solana/web3.js")).Connection(
        "https://mainnet.helius-rpc.com/?api-key=fb5ef076-69e7-4d96-82d8-2237c13aef7a",
        "confirmed"
      );
      
      try {
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );
        
        console.log("Transaction signature:", signature);
        
        // Close the modal first
        onClose();
        
        // Show success toast
        toast.success("Token created successfully!");
        
        // No need to reload the page - let the success message show
      } catch (txError) {
        // Try to get the logs if available
        const logs = txError.logs || [];
        console.error("Transaction logs:", logs);
        
        // Check for specific error messages
        if (logs.some(log => log.includes("Symbol too long"))) {
          throw new Error("Symbol too long. Please use 10 characters or less.");
        } else {
          throw txError;
        }
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(`Error: ${err.message}`);
      setError(err.message);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 flex items-center justify-center bg-black/60"
    >
      <DialogPanel className="bg-white p-8 rounded-lg shadow-xl  border border-gray-200 relative overflow-y-auto max-h-screen">
        {/* Paper decorative elements */}
        {/* <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-r from-gray-100 to-white"></div>
        <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-r from-gray-100 to-white"></div> */}
        
        <DialogTitle className="text-2xl font-serif font-semibold text-gray-800 border-b border-gray-200 pb-2">
          Tokenize Research Paper
        </DialogTitle>
        
        <DialogDescription className="mt-3 text-sm text-gray-600 font-serif">
          Create a token representing your unpublished research paper
        </DialogDescription>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Paper Title"
            value={formState.name}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
            required
          />
          
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
              {formState.symbol.length}/10 characters (required, uppercase)
            </p>
          </div>
          
          <textarea
            name="description"
            placeholder="Abstract/Description"
            value={formState.description}
            onChange={handleChange}
            // rows="3"
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
          
          {/* File upload section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <label htmlFor="file-upload" className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md px-4 py-2 transition">
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
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-serif">SOL Amount</label>
              <input
                type="number"
                step="0.01"
                name="amount"
                placeholder="0.01"
                value={formState.amount}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
                min="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-serif">Slippage %</label>
              <input
                type="number"
                name="slippage"
                placeholder="10"
                value={formState.slippage}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
                min="1"
                max="100"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-serif">Priority Fee</label>
            <input
              type="number"
              step="0.0001"
              name="priorityFee"
              placeholder="0.0005"
              value={formState.priorityFee}
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
              min="0.0001"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition font-serif"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition font-serif shadow-md"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Publish Token"}
            </button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};