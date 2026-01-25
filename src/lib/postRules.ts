export function getDailyPostLimit(plan: string): number {
  switch (plan) {
    case 'FREE':
      return 1;
    case 'BRONZE':
      return 5;
    case 'SILVER':
      return 10;
    case 'GOLD':
      return Infinity;
    default:
      return 0;
  }
}
