'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase'; // Adjust path as needed
import { createChart, LineSeries } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const TokenDetail = () => {
  const { slugId } = useParams(); // Get the dynamic slugId from URL
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenPrice, setTokenPrice] = useState(null);

  // Chart-related states
  const [name, setName] = useState(null);
  const [mkc, setMkc] = useState(null);
  const [assetId, setAssetId] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [holders, setHolders] = useState([]);
  const [pool, setPool] = useState(null);
  const [interval, setInterval] = useState('1_MINUTE');
  const chartContainerRef = useRef(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const chartInstance = useRef(null);
  const seriesInstance = useRef(null);
// Author's wallet address for tips
const authorWalletAddress = "4iG4s2F3eSByCkMvfsGhrvzXNoPrDFUJuA7Crtuf3Pvn"

// Handle tip author click
const handleTipAuthor = (e ) => {
  e.preventDefault();
  navigator.clipboard.writeText(authorWalletAddress);
  toast.success("Wallet address copied to clipboard!", {
    description: "Thank you for supporting the author!",
    duration: 3000,
  });
};
  // Fetch token details from Firestore
  useEffect(() => {
    if (!slugId) return;

    const fetchToken = async () => {
      try {
        const docRef = doc(db, 'tokens', Array.isArray(slugId) ? slugId[0] : slugId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setToken({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Token not found');
        }
      } catch (err) {
        setError(`Error fetching token: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [slugId]);

  // Fetch token price from Jupiter API
  useEffect(() => {
    if (!token?.mintAddress) return;
    
    const fetchTokenPrice = async () => {
      try {
        const response = await fetch(`https://api.jup.ag/price/v2?ids=${token.mintAddress}&showExtraInfo=true`);
        const data = await response.json();
        
        if (data.data && data.data[token.mintAddress]) {
          setTokenPrice(data.data[token.mintAddress]);
        }
      } catch (err) {
        console.error("Error fetching token price:", err);
      }
    };
    
    fetchTokenPrice();
  }, [token]);

  // Log token updates (for debugging)
  useEffect(() => {
    console.log('Token updated:', token);
    console.log('Token price:', tokenPrice);
  }, [token, tokenPrice]);

  // Fetch asset ID for chart data
  useEffect(() => {
    if (!token?.mintAddress) return;
    
    const TOKEN_ID = token.mintAddress;
    
    const fetchAssetId = async () => {
      try {
        const response = await fetch(`https://datapi.jup.ag/v1/pools?assetIds=${TOKEN_ID}`);
        const data = await response.json();
  
        if (data.pools && data.pools.length > 0) {
          setAssetId(data.pools[0].id);
        } else {
          throw new Error("Asset ID not found");
        }
      } catch (err) {
        setError(err.message);
      }
    };
  
    fetchAssetId();
  }, [token]);

  // Fetch chart data based on asset ID
  useEffect(() => {
    if (!token?.mintAddress || !assetId) return;
    
    const TOKEN_ID = token.mintAddress;

    const fetchChartData = async () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        const twoDaysAgo = now - 48 * 60 * 60; // 48 hours ago
        const apiUrl = `https://datapi.jup.ag/v1/charts/${assetId}?interval=${interval}&baseAsset=${TOKEN_ID}&from=${twoDaysAgo * 1000}&to=${now * 1000}&candles=300&type=mcap`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.candles && data.candles.length > 0) {
          const formattedData = data.candles.map((candle) => ({
            time: candle.time,
            value: candle.close,
          }));
          setChartData(formattedData);
        } else {
          throw new Error('No chart data found');
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchChartData();
  }, [interval, token, assetId]);

  // Create and update chart
  useEffect(() => {
    if (!chartData.length || !chartContainerRef.current) return;

    if (chartInstance.current) {
      try {
        chartInstance.current.remove();
      } catch (error) {
        console.warn("Chart instance already disposed:", error);
      }
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 600,
      height: 400,
      layout: { textColor: '#000000' },
      grid: {
        vertLines: { color: '#eee' },
        horzLines: { color: '#eee' },
      },
      rightPriceScale: { borderColor: '#ccc' },
    });

    chartInstance.current = chart;

    const lastPrice = chartData[chartData.length - 1]?.value;
    const prevPrice = chartData[chartData.length - 2]?.value;
    const color = lastPrice >= prevPrice ? 'green' : 'red';

    const series = chart.addSeries(LineSeries, { lineWidth: 2, color });
    seriesInstance.current = series;
    series.setData(chartData);

    return () => {
      if (chartInstance.current) {
        try {
          chartInstance.current.remove();
        } catch (error) {
          console.warn("Chart instance cleanup failed:", error);
        }
      }
    };
  }, [chartData]);

  // Fetch token holders
  useEffect(() => {
    if (!token?.mintAddress) return;
    
    const TOKEN_ID = token.mintAddress;

    fetch(`https://datapi.jup.ag/v1/holders/${TOKEN_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.holders) {
          setHolders(data.holders.slice(0, 5));
        }
      })
      .catch((err) => setError(err.message));
  }, [token]);

  // Fetch pool information
  useEffect(() => {
    if (!token?.mintAddress) return;
    
    const TOKEN_ID = token.mintAddress;

    fetch(`https://datapi.jup.ag/v1/pools?assetIds=${TOKEN_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.pools && data?.pools.length > 0) {
          setPool(data?.pools[0]);
          setProfitLoss(data.pools[0].baseAsset.stats24h?.priceChange);
          setName(data.pools[0].baseAsset?.name);
          setMkc(data.pools[0].baseAsset?.mcap);
        }
      })
      .catch((err) => setError(err.message));
  }, [token]);

  // Format price for display
  const formatPrice = (priceStr) => {
    if (!priceStr) return 'N/A';
    
    // Convert scientific notation to a readable format for small numbers
    const price = parseFloat(priceStr);
    
    if (price < 0.00001) {
      // Format with appropriate number of decimals for very small numbers
      return price.toFixed(10);
    } else if (price < 0.01) {
      return price.toFixed(6);
    } else {
      return price.toFixed(4);
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      {/* Token Basic Information */}
      <div className="mb-8">
     
     <div className='flex items-center justify-between gap-4'>
        <h1 className="text-3xl font-bold">{token.name}</h1>
        <h1 className=" font-bold flex items-center justify-center "><a target='_blank' className='underline text-xl  text-yellow-600 mx-5' href={`${token?.website}`}>Read the paper!</a>
        <div onClick={handleTipAuthor}  className='text-sm'>tip the author</div>
        </h1>
        </div>
        <div className="flex items-center gap-4 mt-4">
          {token.imageUrl && (
            <Image
              src={token.metadata?.image || token.imageUrl || token.image}
              alt={token.name}
              width={200}
              height={200}
              className="rounded-lg"
            />
          )}
          <div>
            <p className="text-lg">{token.description || 'No description available'}</p>
            <p className="mt-2">
              <span className="font-semibold">Price:</span>{" "}
              {tokenPrice ? `$${formatPrice(tokenPrice.price)}` : 'Loading...'}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Confidence Level:</span>{" "}
              {tokenPrice?.extraInfo?.confidenceLevel || 'N/A'}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Contract Address:</span>{" "}
              {token.mintAddress ? `${token.mintAddress}` : 'N/A'}
            </p>
            <div className='flex'>
            <a
              href={`https://solscan.io/token/${token.mintAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline block mt-2 "
            >
              View on Solscan
            </a>
            <a
                    href={`https://gmgn.ai/sol/token/KWeg5qLI_${token.mintAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-600 hover:underline   block mt-2  ml-2" 
                  >
                    Trade 
                  </a>
                  </div>
          </div>
        </div>
      </div>

      {/* Token Trading Chart */}
      <Card className="w-full max-w-4xl mx-auto my-5">
        <CardHeader>
          <CardTitle>Token Trading Chart</CardTitle>
          <p className={`mt-2 text-lg font-bold ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {name || token.name}
            <br />
            24 hour : {profitLoss ? `${profitLoss}% ${profitLoss >= 0 ? 'Profit' : 'Loss'}` : 'Calculating...'}
            <br />
            {mkc ? `Market Cap: ${mkc}` : 'Calculating...'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            {['1_MINUTE', '5_MINUTE', '15_MINUTE', '1_HOUR'].map((int) => (
              <button
                key={int}
                className={`px-4 py-2 border rounded ${interval === int ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setInterval(int)}
              >
                {int.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div ref={chartContainerRef} className="w-full h-[400px]" />
          <div className="mt-5">
            <h3 className="text-lg font-semibold">Top Holders</h3>
            <ul className="mt-2">
              {holders.map((holder, index) => (
                <li key={index} className="text-sm">
                  {holder.address}: <span className="font-bold">{holder.amount} tokens</span>
                </li>
              ))}
            </ul>
            {pool && (
              <div className="mt-5">
                <h3 className="text-lg font-semibold">Pool Info</h3>
                <p>Liquidity: {pool.liquidity}</p>
                <p>Volume (24h): {pool.volume24h}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenDetail;