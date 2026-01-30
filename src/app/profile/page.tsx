import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return <div>Please login</div>;
  }

  // Fetch User
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('id, name, email, points, subscription_plan')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return <p>User not found</p>;
  }

  // Fetch Latest Active Subscription for Expiry
  const { data: subscription } = await supabase
    .from('Subscription')
    .select('endDate')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('endDate', { ascending: false })
    .limit(1)
    .single();

  // Map to expected props
  const userWithDefaults = {
    id: user.id,
    name: user.name,
    email: user.email,
    points: user.points || 0,
    subscriptionPlan: user.subscription_plan || 'FREE',
    subscriptionExpiresAt: subscription?.endDate ? new Date(subscription.endDate) : null,
  };

  return <ProfileClient user={userWithDefaults} />;
}
