import { getCoinBalance, getRedemptions } from "@/lib/api";
import { RedeemCenter } from "@/components/RedeemCenter";

export const metadata = {
  title: "Redemption Center — Dash",
  description: "Manage your claimed rewards and active vouchers.",
};

export const dynamic = "force-dynamic";

export default async function RedeemPage() {
  const userId = 1;
  const [balanceRes, redemptionsRes] = await Promise.all([
    getCoinBalance(userId),
    getRedemptions(userId).catch(() => ({ items: [] })),
  ]);

  return (
    <RedeemCenter
      balance={balanceRes.total_coins}
      redemptions={redemptionsRes.items}
    />
  );
}
