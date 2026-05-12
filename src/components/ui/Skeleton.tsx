import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function WalletCardSkeleton() {
  return (
    <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#0d2040]">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function CardTileSkeleton() {
  return (
    <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl p-3 flex items-center gap-3">
      <Skeleton className="w-8 h-6 rounded" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  );
}
