"use client";

import { useEffect, useRef, useState } from "react";
import { DropZone } from "./drop-zone";
import { ToolFrame } from "./images-tool";
import { OFFICIAL_GAMES, type CheckResponse, type OfficialGameId } from "@/lib/games";
import { normalizeDigits, numbersFromText } from "@/lib/digits";
import { logActivity } from "@/lib/browser";
import { buttonClass, fieldClass, labelClass } from "@/lib/styles";

type GameChoice = OfficialGameId | "manual";
type OcrWorker = {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  terminate: () => Promise<unknown>;
};

export function LotteryTool() {
  const [game, setGame] = useState<GameChoice>("powerball");
  const [date, setDate] = useState("");
  const [doublePlay, setDoublePlay] = useState(false);
  const [gameName, setGameName] = useState("");
  const [mainText, setMainText] = useState("");
  const [bonusText, setBonusText] = useState("");
  const [winMainText, setWinMainText] = useState("");
  const [winBonusText, setWinBonusText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [contrast, setContrast] = useState(true);
  const [arabic, setArabic] = useState(false);
  const [detected, setDetected] = useState<number[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const fileRef = useRef<File | null>(null);
  const workerRef = useRef<{ lang: string; worker: OcrWorker } | null>(null);

  useEffect(() => {
    return () => {
      void workerRef.current?.worker.terminate();
    };
  }, []);

  const rules = game === "manual" ? null : OFFICIAL_GAMES[game];

  async function onFiles(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("اختر صورة للتذكرة.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("الصورة أكبر من 12 ميغابايت.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    fileRef.current = file;
    setPreview(URL.createObjectURL(file));
    setDetected([]);
    setError(null);
  }

  async function readTicket() {
    const file = fileRef.current;
    if (!file) {
      setError("أضف صورة التذكرة أولًا.");
      return;
    }
    setPending(true);
    setError(null);
    setProgress("جارٍ تجهيز الصورة…");
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = drawPrepared(bitmap, rotation, contrast);
      bitmap.close();
      const lang = arabic ? "ara" : "eng";
      if (!workerRef.current || workerRef.current.lang !== lang) {
        if (workerRef.current) await workerRef.current.worker.terminate();
        const tesseract = (await import("tesseract.js")) as unknown as {
          createWorker?: (lang: string, oem: number, options: object) => Promise<OcrWorker>;
          default?: {
            createWorker: (lang: string, oem: number, options: object) => Promise<OcrWorker>;
          };
        };
        const createWorker = tesseract.createWorker ?? tesseract.default?.createWorker;
        if (!createWorker) throw new Error("ocr");
        const worker = await createWorker(lang, 1, {
          logger: (message: { status?: string; progress?: number }) => {
            if (message.status) {
              const percent =
                typeof message.progress === "number" ? ` ${Math.round(message.progress * 100)}%` : "";
              setProgress(`${message.status}${percent}`);
            }
          },
        });
        if (!arabic) {
          await worker.setParameters({ tessedit_char_whitelist: "0123456789" });
        }
        workerRef.current = { lang, worker };
      }
      const recognized = await workerRef.current.worker.recognize(canvas);
      const found = uniqueNumbers(recognized.data.text);
      setDetected(found);
      if (rules) {
        const mains = found.filter((n) => n >= rules.mainMin && n <= rules.mainMax).slice(0, rules.mainCount);
        const bonuses = found
          .filter((n) => n >= rules.bonusMin && n <= rules.bonusMax && !mains.includes(n))
          .slice(0, rules.bonusCount);
        setMainText(mains.join(" "));
        setBonusText(bonuses.join(" "));
      }
      setProgress(null);
      if (found.length === 0) setError("لم تُقرأ أرقام. جرّب التدوير أو زيادة التباين أو الكتابة اليدوية.");
    } catch {
      setProgress(null);
      setError("تعذر قراءة الصورة. يمكنك إدخال الأرقام يدويًا.");
    } finally {
      setPending(false);
    }
  }

  async function check() {
    setError(null);
    setNote(null);
    setResult(null);
    const main = numbersFromText(mainText);
    const bonus = numbersFromText(bonusText);
    const payload =
      game === "manual"
        ? {
            game,
            gameName,
            drawDate: date,
            main,
            bonus,
            winningMain: numbersFromText(winMainText),
            winningBonus: numbersFromText(winBonusText),
          }
        : { game, date: date || null, main, bonus, doublePlay: game === "powerball" && doublePlay };
    setPending(true);
    try {
      const response = await fetch("/api/lottery/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as CheckResponse & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "تعذر الفحص.");
        return;
      }
      setResult(data);
      const saved = await logActivity(
        "lottery",
        `فحص ${data.gameName}`,
        `${data.drawDate ?? "بدون تاريخ"} · ${data.tier}`,
      );
      if (!saved) setNote("ظهرت النتيجة. تعذر حفظ الفحص في السجل.");
    } catch {
      setError("تعذر الاتصال بالفحص.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ToolFrame
      title="فحص صورة التذكرة"
      lede="اقرأ الأرقام من الصورة، راجعها، ثم قارنها بسحب Powerball أو Mega Millions من بيانات نيويورك الرسمية. لأي يانصيب آخر، الصق أرقام الإعلان الرسمي بنفسك."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["powerball", "Powerball", "نتائج رسمية"],
            ["megamillions", "Mega Millions", "نتائج رسمية"],
            ["manual", "يانصيب آخر", "أرقام تنسخها أنت"],
          ] as const
        ).map(([id, title, hint]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setGame(id);
              setResult(null);
            }}
            className={`border px-4 py-3 text-right ${game === id ? "border-ink bg-ink text-paper" : "border-line bg-card"}`}
          >
            <span className="block font-medium">{title}</span>
            <span className={`mt-1 block text-xs ${game === id ? "text-paper/70" : "text-ink-soft"}`}>{hint}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <DropZone
            accept="image/*"
            label="صورة التذكرة"
            hint="تُقرأ داخل المتصفح. لا نرفع الصورة ولا نحفظ أرقامها في السجل."
            onFiles={onFiles}
          />
          {preview ? (
            <div className="mt-4 space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="معاينة التذكرة"
                className="max-h-72 w-full border border-line object-contain"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass.ghost} onClick={() => setRotation((value) => (value + 90) % 360)}>
                  تدوير
                </button>
                <button type="button" className={buttonClass.stamp} onClick={readTicket} disabled={pending}>
                  اقرأ الأرقام
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={contrast} onChange={(event) => setContrast(event.target.checked)} />
                زيادة التباين قبل القراءة
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={arabic} onChange={(event) => setArabic(event.target.checked)} />
                الأرقام بالخط العربي
              </label>
              {progress ? <p className="text-sm text-ink-soft">{progress}</p> : null}
              {detected.length > 0 ? (
                <p className="text-sm leading-7">
                  أرقام ظهرت في الصورة:{" "}
                  <span dir="ltr" className="tabular-nums">
                    {detected.join(" · ")}
                  </span>
                  . راجعها قبل الفحص، فالقراءة الآلية تخطئ.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border border-line bg-card p-4">
          {rules ? (
            <p className="text-sm leading-7 text-ink-soft">
              {rules.mainCount} أرقام من {rules.mainMin} إلى {rules.mainMax}، و{rules.bonusLabel} من {rules.bonusMin} إلى {rules.bonusMax}.
            </p>
          ) : (
            <label className="block">
              <span className={labelClass}>اسم اللعبة</span>
              <input className={fieldClass} value={gameName} onChange={(event) => setGameName(event.target.value)} placeholder="اليانصيب الوطني" />
            </label>
          )}
          <label className="block">
            <span className={labelClass}>{rules ? "تاريخ السحب. اتركه فارغًا لآخر سحب منشور في المصدر" : "تاريخ السحب إن عرفته"}</span>
            <input type="date" dir="ltr" className={`${fieldClass} text-left`} value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <NumberField label="أرقام تذكرتك" value={mainText} onChange={setMainText} />
          <NumberField label={rules ? rules.bonusLabel : "الرقم الإضافي في تذكرتك"} value={bonusText} onChange={setBonusText} />
          {game === "manual" ? (
            <>
              <NumberField label="أرقام السحب من الإعلان الرسمي" value={winMainText} onChange={setWinMainText} />
              <NumberField label="الرقم الإضافي في الإعلان" value={winBonusText} onChange={setWinBonusText} />
            </>
          ) : null}
          {game === "powerball" ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={doublePlay} onChange={(event) => setDoublePlay(event.target.checked)} />
              تذكرتي من سحب Double Play
            </label>
          ) : null}
          <button className={`${buttonClass.stamp} w-full`} onClick={check} disabled={pending}>
            {pending ? "جارٍ الفحص…" : "افحص التطابق"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm leading-7 text-seal">{error}</p> : null}
      {note ? <p className="mt-4 text-sm text-ink-soft">{note}</p> : null}
      {result ? <ResultCard result={result} /> : null}
      <p className="mt-6 max-w-3xl text-sm leading-7 text-ink-soft">
        chihab pdf cnv ليس جهة اليانصيب. طابق النتيجة مع إعلان الجهة قبل أي مطالبة. لا نعرض مبلغ جائزة لأن المبلغ يتغير ولا يُستنتج من الأرقام وحدها.
      </p>
    </ToolFrame>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        dir="ltr"
        className={`${fieldClass} text-left`}
        value={value}
        onChange={(event) => onChange(normalizeDigits(event.target.value))}
        placeholder="4 12 19 33 44"
      />
    </label>
  );
}

function ResultCard({ result }: { result: CheckResponse }) {
  return (
    <div className="mt-6 border border-ink bg-card p-5">
      <p className="text-sm text-stamp">{result.mode === "official" ? "مقارنة مع سحب منشور" : "مقارنة مع أرقام أدخلتها"}</p>
      <h2 className="mt-1 font-display text-3xl">{result.gameName}</h2>
      <p className="mt-1 text-sm text-ink-soft">{result.drawDate ?? "بدون تاريخ"}</p>
      <p className="mt-4 text-lg leading-8">{result.tier}</p>
      <BallRow
        label="أرقام السحب"
        main={result.winningMain}
        bonus={result.winningBonus}
        mainHits={result.matchedMain}
        bonusHits={result.matchedBonus}
      />
      <BallRow
        label="أرقام تذكرتك"
        main={result.yourMain}
        bonus={result.yourBonus}
        mainHits={result.matchedMain}
        bonusHits={result.matchedBonus}
      />
      <ul className="mt-4 space-y-2 text-sm leading-7 text-ink-soft">
        {result.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
        <li>
          المصدر: {result.sourceName}
          {result.sourceUrl ? (
            <>
              {" "}
              ·{" "}
              <a href={result.sourceUrl} className="text-stamp" target="_blank" rel="noreferrer">
                صفحة البيانات
              </a>
            </>
          ) : null}
        </li>
      </ul>
    </div>
  );
}

function BallRow({
  label,
  main,
  bonus,
  mainHits,
  bonusHits,
}: {
  label: string;
  main: number[];
  bonus: number[];
  mainHits: number[];
  bonusHits: number[];
}) {
  const mainSet = new Set(mainHits);
  const bonusSet = new Set(bonusHits);
  return (
    <div className="mt-4">
      <p className="mb-2 text-sm">{label}</p>
      <div className="flex flex-wrap gap-2" dir="ltr">
        {main.map((n, index) => (
          <Ball key={`m-${index}-${n}`} n={n} hit={mainSet.has(n)} />
        ))}
        {bonus.map((n, index) => (
          <Ball key={`b-${index}-${n}`} n={n} hit={bonusSet.has(n)} bonus />
        ))}
      </div>
    </div>
  );
}

function Ball({ n, hit, bonus = false }: { n: number; hit: boolean; bonus?: boolean }) {
  return (
    <span
      className={`grid h-11 w-11 place-items-center border text-sm tabular-nums ${bonus ? "rounded-full" : ""} ${hit ? "border-stamp bg-stamp text-paper" : "border-line text-ink"}`}
    >
      {n}
    </span>
  );
}

function uniqueNumbers(text: string) {
  const found: number[] = [];
  for (const n of numbersFromText(text)) {
    if (n > 0 && n < 100 && !found.includes(n)) found.push(n);
  }
  return found;
}

function drawPrepared(bitmap: ImageBitmap, rotation: number, contrast: boolean) {
  const swap = rotation % 180 !== 0;
  const width = swap ? bitmap.height : bitmap.width;
  const height = swap ? bitmap.width : bitmap.height;
  const scale = Math.min(1, 1800 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.scale(scale, scale);
  context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  context.setTransform(1, 0, 0, 1, 0, 0);
  if (contrast) {
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const value = Math.min(255, Math.max(0, (gray - 128) * 1.7 + 128));
      data[i] = data[i + 1] = data[i + 2] = value;
    }
    context.putImageData(image, 0, 0);
  }
  return canvas;
}
