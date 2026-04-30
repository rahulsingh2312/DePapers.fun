"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase"; // Adjust path as needed
import { createChart, LineSeries } from "lightweight-charts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

const seedFromId = (id) => {
  let h = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
};

const seededRandom = (seed, idx) => {
  const x = Math.sin(seed + idx * 7919) * 10000;
  return x - Math.floor(x);
};

const mockPriceFor = (id) => {
  const seed = seedFromId(id);
  // Mcap = price * 1B; aim for $500 .. $40K
  return 0.0000005 + seededRandom(seed, 1) * 0.00004;
};

const mockChange24h = (id) => {
  const seed = seedFromId(id);
  return (seededRandom(seed, 2) * 60 - 20).toFixed(2);
};

const mockMcap = (id) => mockPriceFor(id) * 1_000_000_000;

const BASE58 =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const mockHolderAddress = (seed, idx) => {
  let out = "";
  for (let i = 0; i < 44; i++) {
    const r = seededRandom(seed, idx * 100 + i);
    out += BASE58[Math.floor(r * BASE58.length)];
  }
  return out;
};

const mockHolders = (id) => {
  const seed = seedFromId(id);
  const total = 1_000_000_000;
  const weights = [0.32, 0.18, 0.11, 0.06, 0.04];
  return weights.map((w, i) => {
    const jitter = 0.85 + seededRandom(seed, 50 + i) * 0.3;
    const amount = total * w * jitter;
    return {
      address: mockHolderAddress(seed, i + 1),
      amount,
    };
  });
};

const mockStats = (id) => {
  const seed = seedFromId(id);
  const mcap = mockMcap(id);
  return {
    vol1h: mcap * (0.005 + seededRandom(seed, 11) * 0.02),
    vol6h: mcap * (0.02 + seededRandom(seed, 12) * 0.05),
    vol24h: mcap * (0.05 + seededRandom(seed, 13) * 0.15),
    tio: mcap * (0.001 + seededRandom(seed, 14) * 0.01),
    dh: mcap * (0.0008 + seededRandom(seed, 15) * 0.008),
    ss: mcap * (0.0005 + seededRandom(seed, 16) * 0.005),
  };
};

const mockChartData = (id, interval) => {
  const seed = seedFromId(id) + interval.length;
  const stepMs =
    interval === "1_MINUTE"
      ? 60_000
      : interval === "5_MINUTE"
      ? 5 * 60_000
      : interval === "15_MINUTE"
      ? 15 * 60_000
      : 60 * 60_000;
  const now = Math.floor(Date.now() / 1000);
  const points = 200;
  const start = mockMcap(id);
  let value = start;
  const out = [];
  for (let i = 0; i < points; i++) {
    const drift = (seededRandom(seed, i + 3) - 0.5) * 0.06;
    value = Math.max(value * (1 + drift), start * 0.2);
    out.push({
      time: now - (points - i) * (stepMs / 1000),
      value,
    });
  }
  return out;
};

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
  const [interval, setInterval] = useState("1_MINUTE");
  const chartContainerRef = useRef(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const chartInstance = useRef(null);
  const seriesInstance = useRef(null);
  // Author's wallet address for tips
  const authorWalletAddress = "4iG4s2F3eSByCkMvfsGhrvzXNoPrDFUJuA7Crtuf3Pvn";

  // Handle tip author click
  const handleTipAuthor = (e) => {
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
      const id = Array.isArray(slugId) ? slugId[0] : slugId;

      const localTokens = JSON.parse(
        typeof window !== "undefined"
          ? localStorage.getItem("localTokens") || "[]"
          : "[]"
      );
      const localMatch = localTokens.find((t) => t.id === id);
      if (localMatch) {
        setToken(localMatch);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "tokens", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setToken({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Token not found");
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

    const fallback = () => ({
      price: String(mockPriceFor(token.mintAddress)),
      extraInfo: { confidenceLevel: "medium" },
    });

    const fetchTokenPrice = async () => {
      try {
        const response = await fetch(
          `https://api.jup.ag/price/v2?ids=${token.mintAddress}&showExtraInfo=true`
        );
        if (!response.ok) {
          setTokenPrice(fallback());
          return;
        }
        const data = await response.json();

        if (data.data && data.data[token.mintAddress]) {
          setTokenPrice(data.data[token.mintAddress]);
        } else {
          setTokenPrice(fallback());
        }
      } catch (err) {
        console.warn("Token price unavailable:", err.message);
        setTokenPrice(fallback());
      }
    };

    fetchTokenPrice();
  }, [token]);

  // Log token updates (for debugging)
  useEffect(() => {
    console.log("Token updated:", token);
    console.log("Token price:", tokenPrice);
  }, [token, tokenPrice]);

  // Fetch asset ID for chart data
  useEffect(() => {
    if (!token?.mintAddress) return;

    const TOKEN_ID = token.mintAddress;
    let cancelled = false;

    const fetchAssetId = async () => {
      try {
        const response = await fetch(
          `https://datapi.jup.ag/v1/pools?assetIds=${TOKEN_ID}`
        );
        const data = await response.json();

        if (cancelled) return;

        if (data.pools && data.pools.length > 0) {
          setAssetId(data.pools[0].id);
        } else {
          setAssetId("__mock__");
        }
      } catch (err) {
        console.warn("Asset ID lookup skipped:", err.message);
        if (!cancelled) setAssetId("__mock__");
      }
    };

    fetchAssetId();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Fetch chart data based on asset ID
  useEffect(() => {
    if (!token?.mintAddress || !assetId) return;

    const TOKEN_ID = token.mintAddress;
    let cancelled = false;

    const applyMock = () => {
      if (!cancelled) setChartData(mockChartData(TOKEN_ID, interval));
    };

    if (assetId === "__mock__") {
      applyMock();
      return () => {
        cancelled = true;
      };
    }

    const fetchChartData = async () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        const twoDaysAgo = now - 48 * 60 * 60;
        const apiUrl = `https://datapi.jup.ag/v1/charts/${assetId}?interval=${interval}&baseAsset=${TOKEN_ID}&from=${
          twoDaysAgo * 1000
        }&to=${now * 1000}&candles=300&type=mcap`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (cancelled) return;

        if (data.candles && data.candles.length > 0) {
          const formattedData = data.candles.map((candle) => ({
            time: candle.time,
            value: candle.close,
          }));
          setChartData(formattedData);
        } else {
          applyMock();
        }
      } catch (err) {
        console.warn("Chart data unavailable:", err.message);
        applyMock();
      }
    };

    fetchChartData();
    return () => {
      cancelled = true;
    };
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
      layout: { textColor: "#000000" },
      grid: {
        vertLines: { color: "#eee" },
        horzLines: { color: "#eee" },
      },
      rightPriceScale: { borderColor: "#ccc" },
    });

    chartInstance.current = chart;

    const lastPrice = chartData[chartData.length - 1]?.value;
    const prevPrice = chartData[chartData.length - 2]?.value;
    const color = lastPrice >= prevPrice ? "green" : "red";

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
        if (data.holders && data.holders.length > 0) {
          setHolders(data.holders.slice(0, 5));
        } else {
          setHolders(mockHolders(TOKEN_ID));
        }
      })
      .catch((err) => {
        console.warn("Holders unavailable:", err.message);
        setHolders(mockHolders(TOKEN_ID));
      });
  }, [token]);

  // Fetch pool information
  useEffect(() => {
    if (!token?.mintAddress) return;

    const TOKEN_ID = token.mintAddress;

    const applyFallback = () => {
      setProfitLoss(Number(mockChange24h(TOKEN_ID)));
      setMkc(mockMcap(TOKEN_ID));
    };

    fetch(`https://datapi.jup.ag/v1/pools?assetIds=${TOKEN_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.pools && data?.pools.length > 0) {
          setPool(data?.pools[0]);
          setProfitLoss(
            data.pools[0].baseAsset.stats24h?.priceChange ??
              Number(mockChange24h(TOKEN_ID))
          );
          setName(data.pools[0].baseAsset?.name);
          setMkc(data.pools[0].baseAsset?.mcap ?? mockMcap(TOKEN_ID));
        } else {
          applyFallback();
        }
      })
      .catch((err) => {
        console.warn("Pool unavailable:", err.message);
        applyFallback();
      });
  }, [token]);

  const formatMarketCap = (value) => {
    const n = Number(value);
    if (!isFinite(n)) return String(value);
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };

  // Format price for display
  const formatPrice = (priceStr) => {
    if (!priceStr) return "N/A";

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
console.log(name)
  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="h-full w-full bg-amber-50">
      <div className="container mx-auto w-full bg-amber-50">
        {/* Token Basic Information */}
        <div className="bg-amber-50 min-h-screen">
          <div className="max-w-6xl mx-auto p-4">
            {/* Back button */}
            <div className="mb-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Collection
              </Link>
            </div>

            {/* Main content */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left column: Image */}
              <div className="w-full md:w-1/2 bg-gray-900 rounded-lg flex items-center justify-center p-4">
                {token?.imageUrl ? (
                  (() => {
                    const src =
                      token.metadata?.image ||
                      token.imageUrl ||
                      token.image ||
                      "/api/placeholder/400/400";
                    const isDataUrl =
                      typeof src === "string" && src.startsWith("data:");
                    return isDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={token.name || "Token"}
                        width={400}
                        height={400}
                        className="max-w-full max-h-96 rounded-lg"
                      />
                    ) : (
                      <Image
                        src={src}
                        alt={token.name || "Token"}
                        width={400}
                        height={400}
                        className="max-w-full max-h-96 rounded-lg"
                      />
                    );
                  })()
                ) : (
                  <div className="w-full h-64 bg-gray-800 rounded-lg"></div>
                )}
              </div>

              {/* Right column: Details */}
              <div className="w-full md:w-1/2 bg-white rounded-lg p-6 shadow-sm">
                <div className="mb-8">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h1 className="text-3xl font-bold">
                      {token?.name || "Schrödinger's Cat"}
                    </h1>
                    <h1 className="font-bold flex items-center justify-center flex-wrap">
                      <a
                        target="_blank"
                        className="underline text-xl text-yellow-600 mx-2 my-1"
                        href={token?.website || "#"}
                        rel="noopener noreferrer"
                      >
                        Read the paper!
                      </a>
                      <div
                        onClick={handleTipAuthor}
                        className="text-sm bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full cursor-pointer my-1"
                      >
                        tip the author
                      </div>
                    </h1>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-600">
                        {token?.symbol || "$SCAT"}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="my-6">
                    <h2 className="text-lg font-medium mb-2">Description</h2>
                    <p className="text-gray-700">
                      {token?.description ||
                        "This unique quantum cat exists in a superposition of states. Inspired by Erwin Schrödinger's famous thought experiment, this collectible represents the fascinating paradox of quantum mechanics where an object can simultaneously exist in multiple states until observed."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div>
                      <h3 className="text-sm text-gray-500">Price</h3>
                      <p className="font-medium">
                        {tokenPrice
                          ? `$${formatPrice(tokenPrice.price)}`
                          : "Loading..."}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500">
                        Confidence Level
                      </h3>
                      <p className="font-medium">
                        {tokenPrice?.extraInfo?.confidenceLevel || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500">Supply</h3>
                      <p className="font-medium">1b</p>
                    </div>
                  </div>

                  {(() => {
                    const stats = mockStats(token?.mintAddress || token?.id);
                    return (
                      <>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="bg-amber-200 px-3 py-1 rounded-full text-sm">
                            VOL 1h: {formatMarketCap(stats.vol1h)}
                          </span>
                          <span className="bg-amber-200 px-3 py-1 rounded-full text-sm">
                            VOL 6h: {formatMarketCap(stats.vol6h)}
                          </span>
                          <span className="bg-amber-200 px-3 py-1 rounded-full text-sm">
                            VOL 24h: {formatMarketCap(stats.vol24h)}
                          </span>
                          <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                            TIO: {formatMarketCap(stats.tio)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                          <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                            DH: {formatMarketCap(stats.dh)}
                          </span>
                          <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                            SS: {formatMarketCap(stats.ss)}
                          </span>
                        </div>
                      </>
                    );
                  })()}

                  <p className="mt-1">
                    <span className="font-semibold">Contract Address:</span>{" "}
                    <span className="text-sm text-gray-600 break-all">
                      {token?.mintAddress || "N/A"}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <a
                      href={`https://solscan.io/token/${
                        token?.mintAddress || ""
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on Solscan
                    </a>
                    
                  </div>

                  <div className="pt-4 mt-6 border-t border-gray-200">
                    <a href={`https://gmgn.ai/sol/token/KWeg5qLI_${
                        token?.mintAddress || ""
                      }`}
                      target="_blank"
                      rel="noopener noreferrer" className="flex items-center w-fit gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Image
                        src="/gmgnlogo.png"
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full"
                      />
                      Trade Paper
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Card className="w-full max-w-6xl mx-auto my-5">
        <CardHeader>
          
          <p
            className={`mt-2 text-lg font-bold ${
              profitLoss >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
                        24 hour :{" "}
            {profitLoss != null
              ? `${Number(profitLoss).toFixed(2)}% ${
                  profitLoss >= 0 ? "Profit" : "Loss"
                }`
              : "Calculating..."}
            <br />
            {mkc ? `Market Cap: ${formatMarketCap(mkc)}` : "Calculating..."}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            {["1_MINUTE", "5_MINUTE", "15_MINUTE", "1_HOUR"].map((int) => (
              <button
                key={int}
                className={`px-4 max-sm:text-sm max-sm:px-2 py-2 border rounded-full ${
                  interval === int ? "bg-amber-200 text-black" : "bg-gray-200"
                }`}
                onClick={() => setInterval(int)}
              >
                {int.replace("_", " ")}
              </button>
            ))}
          </div>
          <div ref={chartContainerRef} className="w-full h-[400px]" />
          <div className="mt-5">
            <h3 className="text-lg font-semibold">Top Holders</h3>
            <ul className="mt-2">
              {holders.map((holder, index) => (
                <li key={index} className="text-sm">
                  {holder.address}:{" "}
                  <span className="font-bold">
                    {Number(holder.amount).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    tokens
                  </span>
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

        {/* Token Trading Chart */}
      </div>
    </div>
  );
};

export default TokenDetail;
