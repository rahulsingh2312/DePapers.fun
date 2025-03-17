"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { SiSolana } from "react-icons/si";
import { db } from "../app/firebase"; // Assuming you have firebase config in a separate file

const TokenDisplay = () => {
  const [tokens, setTokens] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // Fetch tokens from Firebase
        const tokensSnapshot = await getDocs(collection(db, "tokens"));
        const tokensData = tokensSnapshot.docs.map((doc) => ({
          id: doc.id,
          mintAddress: doc.data().mintAddress || "",
          metadataUrl: doc.data().metadataUrl || "",
          name: doc.data().name || "Unknown Token",
          imageUrl: doc.data().imageUrl || null,
          ...doc.data(),
        }));

        // Fetch price data and metadata for each token
        const tokensWithData = await Promise.all(
          tokensData.map(async (token) => {
            try {
              // Fetch price data
              let tokenPrice = "N/A";
              if (token.mintAddress) {
                try {
                  const priceResponse = await fetch(
                    `https://api.jup.ag/price/v2?ids=${token.mintAddress}&showExtraInfo=false`
                  );

                  if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    tokenPrice =
                      priceData.data[token.mintAddress]?.price || "N/A";
                  }
                } catch (priceErr) {
                  console.error(
                    `Error fetching price for ${token.name}:`,
                    priceErr
                  );
                }
              }

              // Fetch metadata if available
              let metadata = null;
              let imageUrl = token.imageUrl || null;

              if (token.metadataUrl) {
                try {
                  const metadataResponse = await fetch(token.metadataUrl);

                  metadata = await metadataResponse.json();
                  console.log(metadata);
                  if (metadata.image && !imageUrl) {
                    imageUrl = metadata.image;
                  }
                } catch (metadataErr) {
                  console.error(
                    `Error fetching metadata for ${token.name}:`,
                    metadataErr
                  );
                }
              }

              return {
                ...token,
                price: tokenPrice,
                metadata,
                imageUrl, // Use the updated imageUrl
              };
            } catch (err) {
              console.error(`Error processing data for ${token.name}:`, err);
              return {
                ...token,
                price: "N/A",
              };
            }
          })
        );

        setTokens(tokensWithData);
        // console.log(tokensWithData);
        // console.log(tokens);
      } catch (err) {
        setError(`Error fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
    //console log tokens token.mintAddress
  }, []);

  // const formatPrice = (price) => {
  //   if (price === "N/A") return "N/A";

  //   // Convert string to number and format based on value
  //   const numPrice = parseFloat(price);
  //   if (isNaN(numPrice)) return "N/A";

  //   if (numPrice < 0.000001) {
  //     return numPrice.toExponential(6);
  //   }

  //   return numPrice.toFixed(8);
  // };
  function formatMarketCap(value) {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#966300]"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded-lg mt-4">
        <p className="font-medium">Error: {error}</p>
      </div>
    );

  return (
    <div className=" mx-5 px-4 py-8">
      <h2 className="text-4xl font-light mb-8 flex items-center">
        <Image
          alt="logo"
          width={40}
          height={30}
          src="/logov1.png"
          className="w-12 h-12 rounded-xl border-orange-300 border mr-2 shadow-sm"
        />
        <span className="bg-gradient-to-br max-sm:text-xl from-black to-[#966300] bg-clip-text text-transparent">
          Tokenized Papers
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokens.map((token) => (
          <div
            className="border border-gray-300 rounded-lg bg-gradient-to-b from-amber-50 hover:shadow-inner transition-all to-amber-100 p-4 shadow-sm"
            key={token.id}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="font-medium">{token.name}</span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-500">{token.symbol}</span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <a
                href={`https://gmgn.ai/sol/token/KWeg5qLI_${token.mintAddress}`}
                className="text-gray-500 flex gap-2"
              >
                <p className="text-sm text-gray-500 underline">gmgn.ai</p>
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
            <div className=" rounded-lg flex overflow-hidden">
              <div className="w-1/3 flex items-center justify-center mx-auto relative">
                {token.imageUrl || token.metadata?.image ? (
                  <Image
                    src={token.metadata?.image || token.imageUrl}
                    alt={token.name}
                    height={200}
                    width={200}
                    className="object-cover border rounded-md border-orange-400"
                  />
                ) : (
                  <SiSolana className="text-6xl text-gray-300 mx-auto mt-10" />
                )}
              </div>
              <div className="w-full p-4">
                <h3 className="text-xl font-medium">{token.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 xl:line-clamp-4">
                  {token.description || "No description"}
                </p>
              </div>
            </div>
            <div className="p-2 flex justify-between items-center flex-row-reverse">
              <a
                className="inline-flex items-center gap-1 border border-gray-300 rounded px-3 py-1 text-sm bg-white"
                href={`/token/${token.id}`}
              >
                <svg
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Read Paper
              </a>
              <p className="text-sm w-fit font-medium py-1 px-2 bg-green-100 text-green-700 border rounded-lg border-green-200">
                Mcap: $
                {token.price
                  ? formatMarketCap(token.price * 1_000_000_000) // Convert price to market cap
                  : "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {tokens.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tokenized papers found</p>
        </div>
      )}
    </div>
  );
};

export default TokenDisplay;
