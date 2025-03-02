'use client'
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
        const tokensData = tokensSnapshot.docs.map(doc => ({
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
                    tokenPrice = priceData.data[token.mintAddress]?.price || "N/A";
                  }
                } catch (priceErr) {
                  console.error(`Error fetching price for ${token.name}:`, priceErr);
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
                  console.error(`Error fetching metadata for ${token.name}:`, metadataErr);
                }
              }
              
              return {
                ...token,
                price: tokenPrice,
                metadata,
                imageUrl // Use the updated imageUrl
              };
            } catch (err) {
              console.error(`Error processing data for ${token.name}:`, err);
              return {
                ...token,
                price: "N/A"
              };
            }
          })
        );


        setTokens(tokensWithData);
        console.log(tokensWithData);
        console.log(tokens)
      } catch (err) {
        setError(`Error fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
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

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#966300]"></div>
    </div>
  );
  
  if (error) return (
    <div className="text-red-500 p-4 bg-red-50 rounded-lg mt-4">
      <p className="font-medium">Error: {error}</p>
    </div>
  );

  return (
    <div className="container mx-5 px-4 py-8">
      <h2 className="text-4xl font-light mb-8 flex items-center">
        <span className="bg-gradient-to-br from-black to-[#966300] bg-clip-text text-transparent">
          Tokenized Papers
        </span>
        <SiSolana className="text-[#966300] ml-2" />
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-4 gap-6">
        {tokens.map((token) => (
          <div 
            key={token.id} 
            className="border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              {token.imageUrl ? (
                <Image
                  src={token.metadata?.image || token.imageUrl}
                  alt={token.name || "Token image"}
                  fill
                  sizes="(max-width: 468px) 500vw, (max-width: 600px) 25vw, 16vw"
                  className="transition-transform hover:scale-105 object-cover"
                  onError={(e) => {
                    // Fallback to placeholder on error
                    e.currentTarget.src = "/api/placeholder/400/400";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <SiSolana className="text-6xl text-gray-300" />
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-medium truncate" title={token.name}>
                  {token.name}
                </h3>
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                  ${token.symbol || "TOKEN"}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {token.description || token.metadata?.description || "No description available"}
              </p>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <SiSolana className="text-[#966300]" />
                  <span className="font-medium">{formatPrice(token.price)}</span>
                </div>
                
                <a
                  href={`https://solscan.io/token/${token.mintAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View on Solscan
                </a>
              </div>
              
              {/* Social links */}
              {(token.twitter || token.telegram || token.website || 
                token.metadata?.twitter || token.metadata?.telegram || token.metadata?.website) && (
                <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                  {(token.twitter || token.metadata?.twitter) && (
                    <a 
                      href={token.twitter || token.metadata?.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-400"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  
                  {(token.telegram || token.metadata?.telegram) && (
                    <a 
                      href={token.telegram || token.metadata?.telegram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-500"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.067l-1.675 7.883c-.126.59-.493.736-.999.458l-2.766-2.038-1.333 1.282c-.148.148-.272.272-.559.272-.361 0-.301-.136-.424-.48l-.951-3.131-2.206-.684c-.477-.149-.483-.476.105-.706l8.677-3.352c.398-.162.776.097.652.527z" />
                      </svg>
                    </a>
                  )}
                  
                  {(token.website || token.metadata?.website) && (
                    <a 
                      href={token.website || token.metadata?.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
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