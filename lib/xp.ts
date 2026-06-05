export interface PassLevel {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progressPercent: number;
  title: string;
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(150 * Math.pow(level - 1, 1.4));
}

export function getLevelFromXp(totalXp: number): PassLevel {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;

  const currentLevelXp = xpForLevel(level);
  const nextLevelXp    = xpForLevel(level + 1);
  const xpIntoLevel    = totalXp - currentLevelXp;
  const xpNeeded       = nextLevelXp - currentLevelXp;

  const titles: Record<number, string> = {
    1: "New Fan", 5: "Rising Fan", 10: "Loyal Fan",
    20: "Super Fan", 35: "Elite Fan", 50: "Legend",
  };
  const titleLevel = Math.max(...Object.keys(titles).map(Number).filter((t) => t <= level));

  return {
    level,
    currentXp: xpIntoLevel,
    xpForNextLevel: xpNeeded,
    progressPercent: Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)),
    title: titles[titleLevel] ?? "New Fan",
  };
}