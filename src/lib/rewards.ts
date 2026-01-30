import { supabase } from "@/lib/supabaseClient";

export async function addPoints(
  userId: string,
  amount: number,
  reason: string
) {
  try {
    console.log(`REWARDS: Adding ${amount} points to user ${userId} for: ${reason}`);

    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('points')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error('REWARDS: User not found for points update:', userId);
      return;
    }

    const currentPoints = user.points || 0;
    const newPoints = Math.max(0, currentPoints + amount);

    const { error: updateError } = await supabase
      .from('User')
      .update({ points: newPoints })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating points:', updateError);
    } else {
      console.log(`REWARDS: Points ${amount > 0 ? 'added' : 'deducted'}: ${amount} to user ${userId} for: ${reason}. New balance: ${newPoints}`);
    }

  } catch (error) {
    console.error('Error updating points:', error);
  }
}

export async function getUserPoints(userId: string): Promise<number> {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('points')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting user points:', error);
      return 0;
    }

    return user?.points || 0;
  } catch (error) {
    console.error('Error getting user points:', error);
    return 0;
  }
}

export async function transferPoints(
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Check sender's points
    const { data: sender, error: senderError } = await supabase
      .from('User')
      .select('points')
      .eq('id', fromUserId)
      .single();

    if (senderError || !sender) return { success: false, error: 'Sender not found' };

    const senderPoints = sender.points || 0;

    // "user can transefer points... only if they have more than 10 points"
    if (senderPoints <= 10) {
      return { success: false, error: 'You need more than 10 points to transfer' };
    }

    if (senderPoints < amount) {
      return { success: false, error: 'Insufficient points' };
    }

    // Check recipient
    const { data: recipient, error: recipientError } = await supabase
      .from('User')
      .select('id') // Just check existence
      .eq('id', toUserId)
      .single();

    if (recipientError || !recipient) {
      return { success: false, error: 'Recipient not found' };
    }

    // Perform transfer
    const { error: deductError } = await supabase
      .from('User')
      .update({ points: senderPoints - amount })
      .eq('id', fromUserId);

    if (deductError) return { success: false, error: 'Failed to deduct points' };

    // Get recipient's current points
    const { data: recipientData } = await supabase
      .from('User')
      .select('points')
      .eq('id', toUserId)
      .single();

    const { error: addError } = await supabase
      .from('User')
      .update({ points: (recipientData?.points || 0) + amount })
      .eq('id', toUserId);

    if (addError) {
      // Rollback deduction (basic)
      await supabase
        .from('User')
        .update({ points: senderPoints })
        .eq('id', fromUserId);
      return { success: false, error: 'Failed to add points to recipient' };
    }

    console.log(`REWARDS: Transferred ${amount} points from ${fromUserId} to ${toUserId}`);
    return { success: true };

  } catch (error) {
    console.error('Error transferring points:', error);
    return { success: false, error: 'Internal server error' };
  }
}
