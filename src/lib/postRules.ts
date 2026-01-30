type SubscriptionPlan = 'FREE' | 'BRONZE_100' | 'BRONZE_300' | 'GOLD';

export function getDailyQuestionLimit(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'FREE':
      return 1;
    case 'BRONZE_100':
      return 5;
    case 'BRONZE_300':
      return 10;
    case 'GOLD':
      return Infinity;
    default:
      return 1; // Default to FREE limit
  }
}

export function getDailyPostLimit(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'FREE':
      return 2;
    case 'BRONZE_100':
      return 10;
    case 'BRONZE_300':
      return 20;
    case 'GOLD':
      return Infinity;
    default:
      return 2; // Default to FREE limit
  }
}
