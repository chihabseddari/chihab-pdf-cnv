import {
  OFFICIAL_GAMES,
  describeOfficialTier,
  matched,
  officialSelectionError,
  type CheckResponse,
  type OfficialGameId,
} from "./games";

export class DrawLookupError extends Error {}

type PowerballRow = {
  draw_date: string;
  winning_numbers: string;
  multiplier?: string;
  double_play_winning_numbers?: string;
};

type MegaRow = {
  draw_date: string;
  winning_numbers: string;
  mega_ball: string;
};

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function parseGroup(value: string, count: number) {
  const parts = value.trim().split(/\s+/).map((part) => Number(part));
  if (parts.length < count || parts.some((n) => !Number.isInteger(n))) {
    throw new DrawLookupError("صيغة النتيجة الرسمية غير متوقعة، ولم تُعرض أرقام بديلة.");
  }
  return parts.slice(0, count);
}

async function fetchRows<T>(url: string): Promise<T[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      throw new DrawLookupError("تعذر جلب نتيجة السحب من المصدر الرسمي.");
    }
    const data = (await response.json()) as T[];
    if (!Array.isArray(data) || data.length === 0) {
      throw new DrawLookupError("المصدر الرسمي لم يعدّ بأي سحب.");
    }
    return data;
  } catch (error) {
    if (error instanceof DrawLookupError) throw error;
    throw new DrawLookupError("تعذر الاتصال بمصدر النتائج الرسمي.");
  } finally {
    clearTimeout(timer);
  }
}

function endpoint(resource: string) {
  const url = new URL(`https://data.ny.gov/resource/${resource}.json`);
  url.searchParams.set("$limit", "80");
  url.searchParams.set("$order", "draw_date DESC");
  return url.toString();
}

export async function checkOfficial(input: {
  game: OfficialGameId;
  date?: string | null;
  main: number[];
  bonus: number[];
  doublePlay?: boolean;
}): Promise<CheckResponse> {
  const rules = OFFICIAL_GAMES[input.game];
  const invalid = officialSelectionError(rules, input.main, input.bonus);
  if (invalid) throw new DrawLookupError(invalid);

  if (input.game === "powerball") {
    const rows = await fetchRows<PowerballRow>(endpoint("d6yy-54nr"));
    const row = pickRow(rows, input.date);
    const winning = parseGroup(row.winning_numbers, 6);
    let winningMain = winning.slice(0, 5);
    let winningBonus = [winning[5]];
    const notes = [
      "قيمة الجائزة تختلف حسب السحب والولاية وخيار المضاعف على التذكرة. chihab pdf cnv يعرض التطابق، والجهة الرسمية تحدد المبلغ.",
    ];
    if (row.multiplier) {
      notes.push(
        `مضاعف Power Play المنشور لهذا السحب: ${row.multiplier}×. ينطبق على التذاكر التي اشترته، ولا يظهر من الأرقام وحدها.`,
      );
    }
    if (input.doublePlay) {
      if (!row.double_play_winning_numbers) {
        throw new DrawLookupError("هذا السحب لا يتضمن أرقام Double Play في المصدر الرسمي.");
      }
      const doublePlay = parseGroup(row.double_play_winning_numbers, 6);
      winningMain = doublePlay.slice(0, 5);
      winningBonus = [doublePlay[5]];
      notes.push("المقارنة هنا مع سحب Double Play المنشور في السجل نفسه.");
    }
    return buildOfficial(rules, input, dateOnly(row.draw_date), winningMain, winningBonus, notes);
  }

  const rows = await fetchRows<MegaRow>(endpoint("5xaw-6ayf"));
  const row = pickRow(rows, input.date);
  const winningMain = parseGroup(row.winning_numbers, 5);
  const mega = Number(row.mega_ball);
  if (!Number.isInteger(mega)) {
    throw new DrawLookupError("صيغة Mega Ball في المصدر الرسمي غير متوقعة.");
  }
  return buildOfficial(rules, input, dateOnly(row.draw_date), winningMain, [mega], [
    "جوائز Mega Millions تختلف حسب الولاية ومضاعف التذكرة. المعروض هو التطابق مع أرقام السحب الرسمية.",
  ]);
}

function pickRow<T extends { draw_date: string }>(rows: T[], date?: string | null) {
  if (!date) return rows[0];
  const row = rows.find((item) => dateOnly(item.draw_date) === date);
  if (!row) {
    throw new DrawLookupError("لا يوجد سحب في هذا التاريخ ضمن آخر النتائج المنشورة في المصدر.");
  }
  return row;
}

function buildOfficial(
  rules: (typeof OFFICIAL_GAMES)[OfficialGameId],
  input: { main: number[]; bonus: number[] },
  drawDate: string,
  winningMain: number[],
  winningBonus: number[],
  notes: string[],
): CheckResponse {
  const matchedMain = matched(input.main, winningMain);
  const matchedBonus = matched(input.bonus, winningBonus);
  return {
    mode: "official",
    gameName: rules.name,
    drawDate,
    yourMain: input.main,
    yourBonus: input.bonus,
    winningMain,
    winningBonus,
    matchedMain,
    matchedBonus,
    tier: describeOfficialTier(rules.id, matchedMain.length, matchedBonus.length > 0),
    sourceName: rules.sourceName,
    sourceUrl: rules.sourceUrl,
    notes,
  };
}
