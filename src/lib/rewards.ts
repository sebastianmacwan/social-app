import supabase from "@/lib/prisma";

export async function addPoints(
  userId: string,
  amount: number,
  reason: string
) {
  try {
    console.log(`REWARDS: Adding ${amount} points to user ${userId} for: ${reason}`);

    // Get current user points
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    console.log('REWARDS: User fetch result:', { user, fetchError });

    if (fetchError) {
      console.error('REWARDS: Error fetching user or points column may not exist:', fetchError);
      return; // Don't fail if points system not set up
    }

    if (!user) {
      console.error('REWARDS: User not found for points update:', userId);
      return;
    }

    const currentPoints = user.points || 0;
    const newPoints = Math.max(0, currentPoints + amount);

    console.log(`REWARDS: Updating points from ${currentPoints} to ${newPoints}`);

    // Update user points
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    console.log('REWARDS: Update result:', { updateError });

    if (updateError) {
      console.error('REWARDS: Failed to update points:', updateError);
      return;
    }

    // Log the transaction (you might want to create a points_transaction table)
    console.log(`REWARDS: Points ${amount > 0 ? 'added' : 'deducted'}: ${amount} to user ${userId} for: ${reason}`);

  } catch (error) {
    console.error('Error updating points:', error);
  }
}

export async function getUserPoints(userId: string): Promise<number> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return 0;
    }

    return user.points || 0;
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
    // Check sender's points
    const senderPoints = await getUserPoints(fromUserId);
    if (senderPoints < amount) {
      return { success: false, error: 'Insufficient points' };
    }

    if (senderPoints < 10) {
      return { success: false, error: 'You need at least 10 points to transfer' };
    }

    // Check if recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('id', toUserId)
      .single();

    if (recipientError || !recipient) {
      return { success: false, error: 'Recipient not found' };
    }

    // Perform transfer
    const { error: updateSenderError } = await supabase
      .from('users')
      .update({ points: senderPoints - amount })
      .eq('id', fromUserId);

    if (updateSenderError) {
      return { success: false, error: 'Failed to deduct points from sender' };
    }

    const recipientPoints = await getUserPoints(toUserId);
    const { error: updateRecipientError } = await supabase
      .from('users')
      .update({ points: recipientPoints + amount })
      .eq('id', toUserId);

    if (updateRecipientError) {
      // Rollback sender's points
      await supabase
        .from('users')
        .update({ points: senderPoints })
        .eq('id', fromUserId);
      return { success: false, error: 'Failed to add points to recipient' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error transferring points:', error);
    return { success: false, error: 'Transfer failed' };
  }
}
