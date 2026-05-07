const BASE_URL =
  process.env.CROSSMINT_ENV === "production"
    ? "https://www.crossmint.com/api/2022-06-09"
    : "https://staging.crossmint.com/api/2022-06-09";

// Maps Volt's network names → Crossmint chain identifiers
export const CROSSMINT_CHAIN: Record<string, string> = {
  "Base": "base",
  "BNB Smart Chain": "bsc",
  "Ethereum": "ethereum",
  "Polygon": "polygon",
};

// ERC-20 contract addresses for each asset on each chain
export const TOKEN_CONTRACTS: Record<string, Record<string, string>> = {
  USDC: {
    base:     "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    polygon:  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
  USDT: {
    bsc:      "0x55d398326f99059fF775485246999027B3197955",
    ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    polygon:  "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  },
  DAI: {
    base:     "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    ethereum: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    polygon:  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  },
};

// Token decimals: USDC and USDT use 6, DAI uses 18
export const TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  DAI: 18,
};

function headers() {
  return {
    "X-API-KEY": process.env.CROSSMINT_API_KEY!,
    "Content-Type": "application/json",
  };
}

/**
 * Creates a Crossmint EVM smart wallet for a user.
 * Crossmint is idempotent — calling this twice for the same email + chain
 * returns the same wallet rather than creating a duplicate.
 */
export async function createCrossmintWallet(
  userEmail: string,
  network: string,
): Promise<{ walletId: string; address: string }> {
  const chain = CROSSMINT_CHAIN[network];
  if (!chain) throw new Error(`Unsupported network for Crossmint: ${network}`);

  const res = await fetch(`${BASE_URL}/wallets`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type: "evm-smart-wallet",
      linkedUser: `email:${userEmail}:${chain}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Crossmint wallet creation failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    walletId: data.id as string,
    address: (data.address as string).toLowerCase(),
  };
}

/**
 * Sends stablecoins from a Crossmint-managed wallet to any EVM address.
 * Returns the Crossmint transaction ID (not the on-chain hash — that arrives later).
 */
export async function sendStablecoin(
  crossmintWalletId: string,
  toAddress: string,
  asset: string,
  network: string,
  amount: number,
): Promise<string> {
  const chain = CROSSMINT_CHAIN[network];
  if (!chain) throw new Error(`Unsupported network: ${network}`);

  const contractAddress = TOKEN_CONTRACTS[asset]?.[chain];
  if (!contractAddress) throw new Error(`No contract for ${asset} on ${chain}`);

  const decimals = TOKEN_DECIMALS[asset] ?? 18;
  const calldata = encodeERC20Transfer(toAddress, amount, decimals);

  const res = await fetch(`${BASE_URL}/wallets/${crossmintWalletId}/transactions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      params: {
        calls: [{ to: contractAddress, data: calldata }],
        chain,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Crossmint send failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.id as string;
}

// Encodes transfer(address,uint256) calldata for an ERC-20 token
function encodeERC20Transfer(to: string, amount: number, decimals: number): string {
  const units = BigInt(Math.round(amount * 10 ** decimals));
  const paddedTo = to.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const paddedAmount = units.toString(16).padStart(64, "0");
  return "0xa9059cbb" + paddedTo + paddedAmount;
}
