"use client"
import { useEffect, useState } from "react";
import axios from "axios";
// import Image from "next/image";
const FetchPumpFunCoins = () => {
  interface Coin {
    image_uri: string;
    name: string;
    symbol: string;
    usd_market_cap: number;
  }
  
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get("https://frontend-api-v3.pump.fun/coins/currently-live", {
          params: {
            limit: 10,
            offset: 1,
            includeNsfw : false, // Ensure only complete coins are fetched
          },
        });

        const filteredCoins = response.data;

        setCoins(filteredCoins);
      } catch (err) {
        setError(`Error fetching data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mx-10 w-11/12 max-sm:mx-0 max-sm:w-72">
  
      <table className="table-auto w-full">
        <thead>
          <tr>
          <th className="border px-4 py-2">Image</th>

            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Symbol</th>
            <th className="border px-4 py-2">Price</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin, index) => (
            <tr key={index}>
                              <td className="border px-4 py-2"><img src={coin.image_uri} width={40} height={40} alt="icon" /></td>

              <td className="border px-4 py-2">{coin.name}</td>
              <td className="border px-4 py-2">{coin.symbol}</td>
              <td className="border px-4 py-2">${coin.usd_market_cap / 1000000000 }</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FetchPumpFunCoins;
