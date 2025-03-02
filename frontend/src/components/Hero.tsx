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

  const [formState, setFormState] = useState({
    name: "",
    symbol: "",
    description: "",
    twitter: "",
    telegram: "",
    website: "",
    image: "",
    amount: 0.01,
    slippage: 10,
    priorityFee: 0.0005,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      console.error("Please connect your wallet first");
      return;
    }
    toast.info("Please wait, creating your token...");

    try {
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
            name: formState.name,
            symbol: formState.symbol,
            uri: formState.image,
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
        throw new Error("Failed to generate transaction");
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
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );
      //log whole response in console
      console.log("Transaction response:", response);
      console.log("Transaction signature:", signature);
          toast.success("Token created successfully!");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 flex items-center justify-center bg-black/60"
    >
      <DialogPanel className="bg-white p-8 rounded-lg shadow-xl max-w-sm md:max-w-screen-lg border border-gray-200 relative">
        {/* Paper decorative elements */}
        <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-r from-gray-100 to-white"></div>
        <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-r from-gray-100 to-white"></div>
        
        <DialogTitle className="text-2xl font-serif font-semibold text-gray-800 border-b border-gray-200 pb-2">
          Tokenize Research Paper
        </DialogTitle>
        
        <DialogDescription className="mt-3 text-sm text-gray-600 font-serif">
          Create a token representing your unpublished research paper
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Paper Title"
            value={formState.name}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
          />
          <input
            type="text"
            name="symbol"
            placeholder="Token Symbol (e.g., PAPER)"
            value={formState.symbol}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
          />
          <textarea
            name="description"
            placeholder="Abstract/Description"
            value={formState.description}
            onChange={handleChange}
            // rows="three"
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
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
              />
            </div>
          </div>
          
          <input
            type="text"
            name="image"
            placeholder="Cover Image URL"
            value={formState.image}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded text-gray-800 font-serif shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none"
          />
          
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
            >
              Publish Token
            </button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
