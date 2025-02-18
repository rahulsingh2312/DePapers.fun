import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [tokensResponse, detailedTokensResponse] = await Promise.all([
      fetch("https://api.jup.ag/tokens/v1/all"),
      fetch("https://api.jup.ag/tokens/v1/details")
    ]);

    const tokens = await tokensResponse.json();
    const tokenDetails = await detailedTokensResponse.json();

    // Filter pump tokens and merge with details
    const pumpTokens = tokens
      .filter((token: any) => token.address.toLowerCase().endsWith("pump"))
      .map((token: any) => ({
        ...token,
        ...(tokenDetails[token.address] || {}),
      }))
      .filter((token: any) => token.volume_24h > 100000);

    return NextResponse.json(pumpTokens);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}