export type OfficialGameId = "powerball" | "megamillions";

export type GameRules = {
  id: OfficialGameId;
  name: string;
  mainCount: number;
  mainMin: number;
  mainMax: number;
  bonusCount: number;
  bonusMin: number;
  bonusMax: number;
  bonusLabel: string;
  sourceName: string;
  sourceUrl: string;
};

export const OFFICIAL_GAMES: Record<OfficialGameId, GameRules> = {
  powerball: {
    id: "powerball",
    name: "Powerball",
    mainCount: 5,
    mainMin: 1,
    mainMax: 69,
    bonusCount: 1,
    bonusMin: 1,
    bonusMax: 26,
    bonusLabel: "Powerball",
    sourceName: "New York State Open Data",
    sourceUrl:
      "https://data.ny.gov/Government-Finance/Lottery-Powerball-Winning-Numbers-Beginning-2010/d6yy-54nr",
  },
  megamillions: {
    id: "megamillions",
    name: "Mega Millions",
    mainCount: 5,
    mainMin: 1,
    mainMax: 70,
    bonusCount: 1,
    bonusMin: 1,
    bonusMax: 24,
    bonusLabel: "Mega Ball",
    sourceName: "New York State Open Data",
    sourceUrl:
      "https://data.ny.gov/Government-Finance/Lottery-Mega-Millions-Winning-Numbers-Beginning-2002/5xaw-6ayf",
  },
};

export type CheckResponse = {
  mode: "official" | "manual";
  gameName: string;
  drawDate: string | null;
  yourMain: number[];
  yourBonus: number[];
  winningMain: number[];
  winningBonus: number[];
  matchedMain: number[];
  matchedBonus: number[];
  tier: string;
  sourceName: string;
  sourceUrl: string | null;
  notes: string[];
};

export function selectionError(
  numbers: number[],
  count: number,
  min: number,
  max: number,
  label: string,
) {
  if (numbers.length !== count) {
    return `${label}: المطلوب ${count} أرقام.`;
  }
  if (numbers.some((n) => !Number.isInteger(n) || n < min || n > max)) {
    return `${label}: كل رقم بين ${min} و${max}.`;
  }
  if (new Set(numbers).size !== numbers.length) {
    return `${label}: الأرقام لا تتكرر.`;
  }
  return null;
}

export function officialSelectionError(
  game: GameRules,
  main: number[],
  bonus: number[],
) {
  return (
    selectionError(main, game.mainCount, game.mainMin, game.mainMax, "الأرقام الرئيسية") ||
    selectionError(bonus, game.bonusCount, game.bonusMin, game.bonusMax, game.bonusLabel)
  );
}

export function matched(ticket: number[], winning: number[]) {
  const pool = new Set(winning);
  return ticket.filter((n) => pool.has(n));
}

export function describeOfficialTier(game: OfficialGameId, mainHits: number, bonusHit: boolean) {
  const bonus = game === "powerball" ? "كرة Powerball" : "Mega Ball";
  if (mainHits === 5 && bonusHit) return `خمسة أرقام مع ${bonus}. هذه فئة الجائزة الكبرى.`;
  if (mainHits === 5) return "خمسة أرقام رئيسية.";
  if (mainHits === 4 && bonusHit) return `أربعة أرقام مع ${bonus}.`;
  if (mainHits === 4) return "أربعة أرقام رئيسية.";
  if (mainHits === 3 && bonusHit) return `ثلاثة أرقام مع ${bonus}.`;
  if (mainHits === 3) return "ثلاثة أرقام رئيسية.";
  if (mainHits === 2 && bonusHit) return `رقمان مع ${bonus}.`;
  if (mainHits === 1 && bonusHit) return `رقم واحد مع ${bonus}.`;
  if (bonusHit) return `${bonus} فقط.`;
  return "لا تطابق ضمن فئات الجوائز المعتادة.";
}

export function describeManualTier(
  mainHits: number,
  mainTotal: number,
  bonusHits: number,
  bonusTotal: number,
) {
  const bonus =
    bonusTotal > 0 ? ` و${bonusHits} من ${bonusTotal} في الأرقام الإضافية` : "";
  return `${mainHits} من ${mainTotal} في الأرقام الرئيسية${bonus}.`;
}
