"use client";
import { Policy } from "@/lib/api";

const STATUS_STYLES: Record<Policy["status"], string> = {
  active: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<Policy["status"], string> = {
  active: "Active",
  paid: "Paid Out",
  expired: "Expired",
  cancelled: "Cancelled",
};

interface PolicyCardProps {
  policy: Policy;
  delayMinutes?: number;
}

export function PolicyCard({ policy, delayMinutes }: PolicyCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{policy.flight_id}</p>
          <p className="text-sm text-gray-500">
            Policy #{policy.policy_id} ·{" "}
            {new Date(policy.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[policy.status]}`}
        >
          {STATUS_LABELS[policy.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Premium Paid</p>
          <p className="font-medium">${policy.premium} USDC</p>
        </div>
        <div>
          <p className="text-gray-500">Coverage</p>
          <p className="font-medium">${policy.payout_amount} USDC</p>
        </div>
      </div>

      {delayMinutes !== undefined && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            delayMinutes >= 120
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {delayMinutes >= 120
            ? `⚠ Delayed ${delayMinutes} min — payout triggered`
            : `✓ On time (${delayMinutes} min delay)`}
        </div>
      )}
    </div>
  );
}
