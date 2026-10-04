import {
  describeManualTier,
  matched,
  selectionError,
  type CheckResponse,
} from "@/lib/games";
import { jsonError, readJson, rejectCrossSite } from "@/lib/http";
import { checkOfficial, DrawLookupError } from "@/lib/lottery-sources";
import { getCurrentUser } from "@/lib/current";

function numbers(value: unknown, max: number) {
  if (!Array.isArray(value) || value.length > max) return null;
  const list = value.map((item) => Number(item));
  if (list.some((item) => !Number.isInteger(item))) return null;
  return list;
}

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return jsonError("ادخل إلى حسابك أولًا.", 401);
  const body = await readJson(request);
  const game = body?.game;

  try {
    if (game === "powerball" || game === "megamillions") {
      const main = numbers(body?.main, 5);
      const bonus = numbers(body?.bonus, 1);
      const date = typeof body?.date === "string" && body.date ? body.date : null;
      if (!main || !bonus) return jsonError("أرقام التذكرة غير مكتملة.", 400);
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError("تاريخ السحب غير صالح.", 400);
      const result = await checkOfficial({
        game,
        main,
        bonus,
        date,
        doublePlay: Boolean(body?.doublePlay),
      });
      return Response.json(result);
    }

    if (game === "manual") {
      const main = numbers(body?.main, 8);
      const bonus = numbers(body?.bonus, 3);
      const winningMain = numbers(body?.winningMain, 8);
      const winningBonus = numbers(body?.winningBonus, 3);
      const gameName =
        typeof body?.gameName === "string" && body.gameName.trim()
          ? body.gameName.trim().slice(0, 40)
          : "يانصيب آخر";
      const drawDate =
        typeof body?.drawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.drawDate)
          ? body.drawDate
          : null;
      if (!main || !bonus || !winningMain || !winningBonus) {
        return jsonError("أدخل أرقام التذكرة وأرقام السحب المنشورة.", 400);
      }
      if (main.length < 1 || main.length !== winningMain.length || bonus.length !== winningBonus.length) {
        return jsonError("عدد أرقام التذكرة يجب أن يساوي عدد أرقام السحب.", 400);
      }
      const message =
        selectionError(main, main.length, 1, 99, "الأرقام الرئيسية") ||
        selectionError(bonus, bonus.length, 1, 99, "الأرقام الإضافية") ||
        selectionError(winningMain, winningMain.length, 1, 99, "أرقام السحب") ||
        selectionError(winningBonus, winningBonus.length, 1, 99, "إضافي السحب");
      if (message) return jsonError(message, 400);

      const matchedMain = matched(main, winningMain);
      const matchedBonus = matched(bonus, winningBonus);
      const result: CheckResponse = {
        mode: "manual",
        gameName,
        drawDate,
        yourMain: main,
        yourBonus: bonus,
        winningMain,
        winningBonus,
        matchedMain,
        matchedBonus,
        tier: describeManualTier(matchedMain.length, main.length, matchedBonus.length, bonus.length),
        sourceName: "الأرقام التي أدخلتها من إعلان السحب",
        sourceUrl: null,
        notes: [
          "هذه مقارنة مع الأرقام التي كتبتها بنفسك. chihab pdf cnv لم يجلب نتيجة هذه اللعبة من مصدر رسمي.",
        ],
      };
      return Response.json(result);
    }

    return jsonError("اختر لعبة مدعومة.", 400);
  } catch (error) {
    if (error instanceof DrawLookupError) return jsonError(error.message, 422);
    return jsonError("تعذر فحص التذكرة.", 500);
  }
}
