export const formatNumber = (value: number): string => new Intl.NumberFormat("en-US").format(value);
export const percentage = (wins: number, total: number): number => total ? Math.round(wins / total * 100) : 0;
