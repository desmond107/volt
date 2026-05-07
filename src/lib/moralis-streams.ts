import { keccak256 } from "ethereum-cryptography/keccak.js";
import { utf8ToBytes, bytesToHex } from "ethereum-cryptography/utils.js";
import { TOKEN_CONTRACTS, TOKEN_DECIMALS } from "./crossmint";

const MORALIS_API_KEY = () => process.env.MORALIS_API_KEY!;
const MORALIS_BASE = "https://api.moralis-streams.com";

// Maps Volt network names → Moralis hex chain IDs
const CHAIN_HEX: Record<string, string> = {
  "Base":           "0x2105",
  "BNB Smart Chain":"0x38",
  "Ethereum":       "0x1",
  "Polygon":        "0x89",
};

// Reverse map: hex chain ID → Volt network name
const HEX_TO_NETWORK: Record<string, string> = Object.fromEntries(
  Object.entries(CHAIN_HEX).map(([net, hex]) => [hex, net]),
);

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const TRANSFER_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "from",  type: "address" },
      { indexed: true,  name: "to",    type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];

function moralisHeaders() {
  return {
    "X-API-Key": MORALIS_API_KEY(),
    "Content-Type": "application/json",
  };
}

/**
 * Returns the Moralis stream ID for Volt, creating it once if it doesn't exist.
 * The ID is persisted in the SystemConfig table so it survives restarts.
 */
export async function getOrCreateStream(): Promise<string> {
  // Lazy import to avoid circular dependency at module load time
  const { prisma } = await import("./prisma");

  const config = await prisma.systemConfig.findUnique({
    where: { key: "moralis_stream_id" },
  });
  if (config) return config.value;

  // Watch both Base and BSC in a single stream
  const res = await fetch(`${MORALIS_BASE}/streams/evm`, {
    method: "POST",
    headers: moralisHeaders(),
    body: JSON.stringify({
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/moralis`,
      description: "Volt stablecoin deposit monitor",
      tag: "volt-deposits",
      chains: [CHAIN_HEX["Base"], CHAIN_HEX["BNB Smart Chain"]],
      abi: TRANSFER_ABI,
      includeContractLogs: true,
      includeNativeTxs: false,
      topic0: [TRANSFER_TOPIC],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Moralis stream creation failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const streamId = data.id as string;

  await prisma.systemConfig.create({ data: { key: "moralis_stream_id", value: streamId } });
  return streamId;
}

/**
 * Registers a wallet address with Moralis so deposits to it trigger the webhook.
 */
export async function watchAddress(streamId: string, address: string): Promise<void> {
  const res = await fetch(`${MORALIS_BASE}/streams/evm/${streamId}/address`, {
    method: "POST",
    headers: moralisHeaders(),
    body: JSON.stringify({ address }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to register address with Moralis (${res.status}): ${text}`);
  }
}

/**
 * Verifies a Moralis webhook signature.
 * Moralis signs payloads with keccak256(rawBody + apiKey).
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const hash = "0x" + bytesToHex(keccak256(utf8ToBytes(rawBody + MORALIS_API_KEY())));
  return hash.toLowerCase() === signature.toLowerCase();
}

export interface ParsedTransfer {
  toAddress: string;
  tokenContract: string;
  rawAmount: bigint;
  txHash: string;
  network: string;
}

/**
 * Parses all inbound ERC-20 Transfer logs from a Moralis webhook payload.
 * Filters to only the stablecoin contracts Volt supports and discards zero-value logs.
 */
export function parseWebhookTransfers(payload: {
  chainId?: string;
  chain?: string;
  logs?: Array<{
    address: string;
    data: string;
    topic0: string;
    topic1: string;
    topic2: string;
    transactionHash?: string;
  }>;
  txs?: Array<{ hash: string }>;
}): ParsedTransfer[] {
  const chainHex: string = payload.chainId ?? payload.chain ?? "";
  const network = HEX_TO_NETWORK[chainHex];
  if (!network) return [];

  // Build a lookup set of all stablecoin contracts on this chain
  const chainKey =
    network === "Base" ? "base"
    : network === "BNB Smart Chain" ? "bsc"
    : network === "Ethereum" ? "ethereum"
    : "polygon";

  const supportedContracts = new Set(
    Object.values(TOKEN_CONTRACTS)
      .map((chains) => chains[chainKey]?.toLowerCase())
      .filter(Boolean),
  );

  const results: ParsedTransfer[] = [];

  for (const log of payload.logs ?? []) {
    if (log.topic0.toLowerCase() !== TRANSFER_TOPIC) continue;
    if (!supportedContracts.has(log.address.toLowerCase())) continue;

    const rawAmount = BigInt(log.data === "0x" ? "0" : log.data);
    if (rawAmount === BigInt(0)) continue;

    const toAddress = "0x" + log.topic2.slice(26).toLowerCase();
    const txHash = log.transactionHash ?? payload.txs?.[0]?.hash ?? "";

    results.push({
      toAddress,
      tokenContract: log.address.toLowerCase(),
      rawAmount,
      txHash,
      network,
    });
  }

  return results;
}

/**
 * Given a token contract address and network, returns the asset symbol and human-readable
 * amount for a given raw on-chain amount.
 */
export function resolveTokenAmount(
  contractAddress: string,
  network: string,
  rawAmount: bigint,
): { asset: string; amount: number } | null {
  const chainKey =
    network === "Base" ? "base"
    : network === "BNB Smart Chain" ? "bsc"
    : network === "Ethereum" ? "ethereum"
    : "polygon";

  for (const [asset, chains] of Object.entries(TOKEN_CONTRACTS)) {
    if (chains[chainKey]?.toLowerCase() === contractAddress) {
      const decimals = TOKEN_DECIMALS[asset] ?? 18;
      const amount = Number(rawAmount) / 10 ** decimals;
      return { asset, amount };
    }
  }
  return null;
}
