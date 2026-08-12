import { getRewards, getCoinBalance } from "@/lib/api";
import { RewardsDashboard } from "@/components/RewardsDashboard";

export default async function RewardsPage() {
  // Hardcoded user ID 1 for demonstration
  const userId = 1;
  
  // Fetch initial data in parallel
  const [rewardsRes, balanceRes] = await Promise.all([
    getRewards(),
    getCoinBalance(userId),
  ]);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      <RewardsDashboard 
        initialBalance={balanceRes} 
        rewards={rewardsRes.items} 
      />
    </div>
  );
}
