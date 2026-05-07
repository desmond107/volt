import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookSignature,
  parseWebhookTransfers,
  resolveTokenAmount,
} from "@/lib/moralis-streams";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // Moralis sends an empty-logs ping when a stream is first created — acknowledge and ignore
  if (!payload.logs?.length) {
    return NextResponse.json({ ok: true });
  }

  const transfers = parseWebhookTransfers(payload);

  for (const transfer of transfers) {
    // Idempotency: skip if this on-chain transaction was already processed
    const alreadyProcessed = await prisma.transaction.findFirst({
      where: { reference: transfer.txHash },
    });
    if (alreadyProcessed) continue;

    // Find the Volt wallet matching the recipient address.
    // Addresses are stored lowercase; Moralis sends them lowercase too.
    const wallet = await prisma.wallet.findUnique({
      where: { address: transfer.toAddress },
    });
    if (!wallet) continue;

    const resolved = resolveTokenAmount(
      transfer.tokenContract,
      transfer.network,
      transfer.rawAmount,
    );
    if (!resolved) continue;

    const { asset, amount } = resolved;

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          userId: wallet.userId,
          walletId: wallet.id,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount,
          fee: 0,
          currency: asset,
          description: `${asset} received on ${transfer.network}`,
          reference: transfer.txHash,
          metadata: JSON.stringify({
            onChain: true,
            txHash: transfer.txHash,
            tokenContract: transfer.tokenContract,
            network: transfer.network,
          }),
        },
      });

      await tx.notification.create({
        data: {
          userId: wallet.userId,
          type: "DEPOSIT",
          title: `${asset} deposit confirmed`,
          body: `${amount.toFixed(asset === "DAI" ? 4 : 2)} ${asset} arrived in your ${transfer.network} wallet`,
        },
      });
    });
  }

  return NextResponse.json({ ok: true });
}
