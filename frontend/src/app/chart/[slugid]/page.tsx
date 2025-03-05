'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';


const TokenTradingChart = () => {
  const { slugid } = useParams(); // Get the dynamic slugId from URL
  const TOKEN_ID = slugid ;
  console.log(TOKEN_ID);
  const [name, setName] = useState(null);
  const [mkc, setMkc] = useState(null);
  const [assetId, setAssetId] = useState(null);

  const [chartData, setChartData] = useState([]);
  const [holders, setHolders] = useState([]);
  const [pool, setPool] = useState(null);
  const [error, setError] = useState(null);
  const [interval, setInterval] = useState('1_MINUTE');
  const chartContainerRef = useRef(null);
  const [profitLoss, setProfitLoss] = useState(null);

  const chartInstance = useRef(null);
  const seriesInstance = useRef(null);


  useEffect(() => {
    if (!TOKEN_ID) return;
  
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
  }, [TOKEN_ID]);


  useEffect(() => {
  if (!TOKEN_ID || !assetId) return;

    const fetchChartData = async () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        const twoDaysAgo = now - 48 * 60 * 60; // 48 hours ago
        // const apiUrl = `     https://datapi.jup.ag/v1/charts/9d9mb8kooFfaD3SctgZtkxQypkshx6ezhbKio89ixyy2?interval=15_MINUTE&baseAsset=${TOKEN_ID}&from=1740859396000&to=1741129396000&candles=301&type=price`;
        const apiUrl = `https://datapi.jup.ag/v1/charts/${assetId}?interval=${interval}&baseAsset=${TOKEN_ID}&from=${twoDaysAgo * 1000}&to=${now * 1000}&candles=300&type=price`;
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
  }, [interval, TOKEN_ID, assetId]);

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

    // if (chartData.length >= 2) {
    //   const lastPrice = chartData[chartData.length - 1]?.value;
    //   const prevPrice = chartData[chartData.length - 2]?.value;
    //   const percentageChange = ((lastPrice - prevPrice) / prevPrice) * 100;
    //   setProfitLoss(percentageChange.toFixed(2));
    // }

    const lastPrice = chartData[chartData.length - 1]?.value;
    const prevPrice = chartData[chartData.length - 2]?.value;
    const color = lastPrice >= prevPrice ? 'green' : 'red';

    const series = chart.addSeries(LineSeries,{ lineWidth: 2, color });
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

  useEffect(() => {
    if (!TOKEN_ID) return;

    fetch(`https://datapi.jup.ag/v1/holders/${TOKEN_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.holders) {
          setHolders(data.holders.slice(0, 5));
        }
      })
      .catch((err) => setError(err.message));
  }, [TOKEN_ID]);

  useEffect(() => {
    if (!TOKEN_ID) return;

    fetch(`https://datapi.jup.ag/v1/pools?assetIds=${TOKEN_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pools && data.pools.length > 0) {
          setPool(data.pools[0]);
          setProfitLoss(data.pools[0].baseAsset.stats24h.priceChange);
          setName(data.pools[0].baseAsset.name);
          setMkc(data.pools[0].baseAsset.mcap);

        }
      })
      .catch((err) => setError(err.message));
  }, [TOKEN_ID]);

  return (
    <Card className="w-full max-w-4xl mx-auto my-5">
      <CardHeader>
        <CardTitle>Token Trading Chart</CardTitle>
        <p className={`mt-2 text-lg font-bold ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {name}
          <br></br>
          24 hour : {profitLoss ? `${profitLoss}% ${profitLoss >= 0 ? 'Profit' : 'Loss'}` : 'Calculating...'}
          <br></br>

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
        {error}
      </CardContent>
    </Card>
  );
};

export default TokenTradingChart;
