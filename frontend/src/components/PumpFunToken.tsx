"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { SiSolana } from "react-icons/si";
import { db } from "../app/firebase"; // Assuming you have firebase config in a separate file
import Link from "next/link";

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
                    `https://api.jup.ag/price/v2?ids=${token.mintAddress}&showExtraInfo=true`
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
        console.log(tokensWithData);
        console.log(tokens);
      } catch (err) {
        setError(`Error fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
    //console log tokens token.mintAddress
  }, []);

  const formatPrice = (price) => {
    if (price === "N/A") return "N/A";

    // Convert string to number and format based on value
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "N/A";

    if (numPrice < 0.000001) {
      return numPrice.toExponential(6);
    }

    return numPrice.toFixed(8);
  };

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
        <span className="bg-gradient-to-br max-sm:text-xl from-black to-[#966300] bg-clip-text text-transparent">
          Tokenized Papers
        </span>
        <SiSolana className="text-[#966300] ml-2 max-sm:text-xl" />
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-[673px]:grid-cols-1">
        {tokens.map((token) => (
          <Link
            href={`/token/${token.id}`}
            className="block hover:shadow-2xl hover:border-yellow-400 hover:bg-yellow-200 bg-white p-2 border border-yellow-200 rounded-lg transition-shadow "
            key={token.id}
          >
            <div className="border border-gray-200 rounded-lg bg-yellow-100 flex overflow-hidden">
              <div className=" relative">
                {token.imageUrl ? (
                  <Image
                    src={token.metadata?.image || token.imageUrl}
                    alt={token.name}
                    height={200}
                    width={200}
                    className="object-cover"
                  />
                ) : (
                  <SiSolana className="text-6xl text-gray-300 mx-auto mt-10" />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-xl font-medium">{token.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {token.description || "No description"}
                </p>
                
              </div>
              
            </div>
            <div className="p-2 flex justify-between items-center">
                  <Link
                    href={`https://solscan.io/token/${token.mintAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-600 hover:underline text-sm"
                  >
                    Solscan 
                  </Link>
                  <p className="text-sm w-fit font-medium py-1 px-2 bg-green-300 text-green-700 border rounded-lg border-green-400">Price: {token.price ? `$${token.price}` : "N/A"}</p>
                </div>
          </Link>
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
