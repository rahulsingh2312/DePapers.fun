'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase'; // Adjust path as needed
import TradingChart from '@/app/chart/[slugid]/page'; // Adjust path as needed
const TokenDetail = () => {
  const { slugId } = useParams(); // Get the dynamic slugId from URL
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dummyToken = {
    name: 'Dummy Token',
    description: 'This is a dummy token description.',
    imageUrl: '/path/to/dummy/image.png',
    price: 'N/A',
    mintAddress: 'CEW7M5PptHjdDTb7gwLhwY7vGBDfgiALVQS7F93Upump'
  };

  useEffect(() => {
    if (!slugId) return;

    const fetchToken = async () => {
      try {
        const docRef = doc(db, 'tokens', Array.isArray(slugId) ? slugId[0] : slugId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setToken({ id: docSnap.id, ...docSnap.data() });
        } else {
          setToken(dummyToken);
        }
      } catch (err) {
        setError(`Error fetching token: ${err.message}`);
        setToken(dummyToken);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
    
  }, [slugId]);

  useEffect(() => {
    console.log('Token updated:', token);
  }, [token]);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className='flex justify-center'>
      <TradingChart tokenAddress={dummyToken.mintAddress} />
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">{token.name}</h1>
      <div className="flex items-center gap-4">
        {token.imageUrl && (
          <Image
            src={token.metadata?.image || token.imageUrl || token.image}
            alt={token.name}
            width={200}
            height={200}
            className="rounded-lg"
          />
        )}
        <p className="text-lg">{token.description || 'No description available'}</p>
      </div>
      <div className="mt-4"></div>
        <p>Price: {token.price ? `$${token.price}` : 'N/A'}</p>
        <a
          href={`https://solscan.io/token/${token.mintAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View on Solscan
        </a>
    </div>
    </div>
  );
};

export default TokenDetail;
