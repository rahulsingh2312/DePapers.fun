// 'use client'
// import React, { useState } from 'react';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// import { Connection, VersionedTransaction, Keypair } from '@solana/web3.js';
// // import mintkeypair from './mintkeypair';
// const TokenCreationForm = () => {
//   const { publicKey, signTransaction, connected } = useWallet();
//   const [formData, setFormData] = useState({
//     name: '',
//     symbol: '',
//     description: '',
//     twitter: '',
//     telegram: '',
//     website: '',
//     amount: 1,
//     slippage: 10,
//     priorityFee: 0.0005,
//   });
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [txSignature, setTxSignature] = useState('');

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleImageChange = (e) => {
//     if (e.target.files[0]) {
//       setImage(e.target.files[0]);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!connected || !publicKey) {
//       setError('Please connect your wallet first');
//       return;
//     }

//     try {
//       setLoading(true);
//       setError('');

//       // Generate a new mint keypair
//       const mintKeypair = Keypair.generate();
// console.log(mintKeypair , "mintKeypair");
//       const ipfsFormData = new FormData();
//       ipfsFormData.append('file', image);
//       ipfsFormData.append('name', formData.name);
//       ipfsFormData.append('symbol', formData.symbol);
//       ipfsFormData.append('description', formData.description);
//       ipfsFormData.append('twitter', formData.twitter);
//       ipfsFormData.append('telegram', formData.telegram);
//       ipfsFormData.append('website', formData.website);
//       ipfsFormData.append('showName', 'true');

//       // const metadataResponse = await fetch('https://pump.fun/api/ipfs', {
//       //   method: 'POST',
//       //   body: ipfsFormData,
//       // });
      
//       // if (!metadataResponse.ok) {
//       //   throw new Error('Failed to upload metadata');
//       // }
      
//       // const metadataResponseJSON = await metadataResponse.json();

//       const response = await fetch('https://pumpportal.fun/api/trade-local', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           publicKey: publicKey.toString(),
//           action: 'create',
//           tokenMetadata: {
//             name: formData.name,
//             symbol: formData.symbol,
//             uri: "abc"
//           },
//           mint: mintKeypair.publicKey.toString(), // Add the mint public key
//           denominatedInSol: 'true',
//           amount: formData.amount,
//           slippage: formData.slippage,
//           priorityFee: formData.priorityFee,
//           pool: 'pump'
//         })
//       });

//       if (!response.ok) {
//         throw new Error('Failed to generate transaction');
//       }

//       const txData = await response.arrayBuffer();
//       const tx = VersionedTransaction.deserialize(new Uint8Array(txData));
      
//       // Sign with both the mint keypair and the user's wallet
//       tx.sign([mintKeypair]);
//       const signedTx = await signTransaction(tx);
      
//       const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=fb5ef076-69e7-4d96-82d8-2237c13aef7a', 'confirmed');
//       const signature = await connection.sendRawTransaction(signedTx.serialize());
      
//       setTxSignature(signature);
      
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <div className="w-full max-w-2xl  text-black mx-auto bg-white shadow-lg rounded-lg p-6">
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold text-gray-800">Create Token</h2>
//       </div>
//       <div className="p-4">
//         {!connected ? (
//           <div className="text-center mb-4">
//             <WalletMultiButton />
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="text-center mb-4">
//             <WalletMultiButton />
//           </div>
//             <div>
//               <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
//                 Token Name
//               </label>
//               <input
//                 id="name"
//                 name="name"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={formData.name}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>

//             <div>
//               <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
//                 Token Symbol
//               </label>
//               <input
//                 id="symbol"
//                 name="symbol"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={formData.symbol}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>

//             <div>
//               <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
//                 Description
//               </label>
//               <input
//                 id="description"
//                 name="description"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>

//             <div>
//               <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
//                 Token Image
//               </label>
//               <input
//                 id="image"
//                 type="file"
//                 accept="image/*"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={handleImageChange}
//                 required
//               />
//             </div>

//             <div>
//               <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
//                 Twitter URL
//               </label>
//               <input
//                 id="twitter"
//                 name="twitter"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={formData.twitter}
//                 onChange={handleInputChange}
//               />
//             </div>

//             <div>
//               <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 mb-1">
//                 Telegram URL
//               </label>
//               <input
//                 id="telegram"
//                 name="telegram"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={formData.telegram}
//                 onChange={handleInputChange}
//               />
//             </div>

//             <div>
//               <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
//                 Website URL
//               </label>
//               <input
//                 id="website"
//                 name="website"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={formData.website}
//                 onChange={handleInputChange}
//               />
//             </div>

//             <div>
//               <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
//                 Amount (SOL)
//               </label>
//               <input
//                 id="amount"
//                 name="amount"
//                 type="number"
//                 step="0.1"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={formData.amount}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>

//             <div>
//               <label htmlFor="slippage" className="block text-sm font-medium text-gray-700 mb-1">
//                 Slippage (%)
//               </label>
//               <input
//                 id="slippage"
//                 name="slippage"
//                 type="number"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={formData.slippage}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>

//             <div>
//               <label htmlFor="priorityFee" className="block text-sm font-medium text-gray-700 mb-1">
//                 Priority Fee (SOL)
//               </label>
//               <input
//                 id="priorityFee"
//                 name="priorityFee"
//                 type="number"
//                 step="0.0001"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={formData.priorityFee}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>

//             <button 
//               type="submit" 
//               disabled={loading || !connected}
//               className={`w-full py-2 px-4 rounded-md text-white font-medium ${
//                 loading || !connected 
//                   ? 'bg-gray-400 cursor-not-allowed' 
//                   : 'bg-blue-600 hover:bg-blue-700'
//               }`}
//             >
//               {loading ? 'Creating Token...' : 'Create Token'}
//             </button>

//             {error && (
//               <div className="text-red-500 mt-2">{error}</div>
//             )}

//             {txSignature && (
//               <div className="text-green-500 mt-2">
//                 Transaction successful! View on{' '}
//                 <a 
//                   href={`https://solscan.io/tx/${txSignature}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="underline"
//                 >
//                   Solscan
//                 </a>
//               </div>
//             )}
//           </form>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TokenCreationForm;