"use client";

import { useEffect, useRef, useState } from "react";
import { DropZone } from "./drop-zone";
import { buildImagePdf, type FitMode, type PageSizeName } from "@/lib/make-pdf";
import { downloadBytes, logActivity } from "@/lib/browser";
import { safePdfName } from "@/lib/format";
import { buttonClass, fieldClass, labelClass } from "@/lib/styles";

type Item = { id: string; file: File; url: string };

const MAX_FILES = 20;
const MAX_BYTES = 20 * 1024 * 1024;

export function ImagesTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeName>("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [marginMm, setMarginMm] = useState(12);
  const [fit, setFit] = useState<FitMode>("contain");
  const [quality, setQuality] = useState(0.85);
  const [filename, setFilename] = useState("صور-chihab");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  useEffect(() => {
    return () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next = [...items];
    for (const file of list) {
      if (next.length >= MAX_FILES) {
        setError(`الحد ${MAX_FILES} صورة في الملف الواحد.`);
        break;
      }
      if (!file.type.startsWith("image/")) {
        setError("اختر ملفات صور.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} أكبر من 20 ميغابايت.`);
        continue;
      }
      next.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) });
    }
    setItems(next);
  }

  function remove(id: string) {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return current.filter((entry) => entry.id !== id);
    });
  }

  function move(id: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }

  async function build() {
    if (items.length === 0) {
      setError("أضف صورة واحدة على الأقل.");
      return;
    }
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const bytes = await buildImagePdf({
        files: items.map((item) => item.file),
        pageSize,
        orientation,
        marginMm,
        fit,
        quality,
      });
      downloadBytes(bytes, safePdfName(filename, "صور-chihab"), "application/pdf");
      const saved = await logActivity(
        "images-to-pdf",
        "تحويل صور إلى PDF",
        `${items.length} صور · ${pageSize.toUpperCase()} · ${orientation === "portrait" ? "عمودي" : "أفقي"}`,
      );
      if (!saved) setNote("تم تنزيل الملف. تعذر حفظ العملية في السجل.");
    } catch {
      setError("تعذر بناء الملف. تأكد أن الصور مدعومة في المتصفح.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ToolFrame
      title="صور إلى PDF"
      lede="رتّب الصور، اختر المقاس، ثم نزّل ملفًا واحدًا. المعالجة تتم في متصفحك والصورة لا تُرفع."
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <DropZone
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            label="أفلت الصور هنا أو اضغط للاختيار"
            hint="JPG وPNG وWebP وGIF. حتى 20 صورة، و20 ميغابايت للصورة."
            onFiles={addFiles}
          />
          {items.length > 0 ? (
            <ol className="space-y-2">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (!dragId || dragId === item.id) return;
                    setItems((current) => {
                      const from = current.findIndex((entry) => entry.id === dragId);
                      const to = current.findIndex((entry) => entry.id === item.id);
                      if (from < 0 || to < 0) return current;
                      const copy = [...current];
                      const [moved] = copy.splice(from, 1);
                      copy.splice(to, 0, moved);
                      return copy;
                    });
                  }}
                  className="flex items-center gap-3 border border-line bg-card p-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="h-16 w-16 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.file.name}</p>
                    <p className="text-xs text-ink-soft">صفحة {index + 1}</p>
                  </div>
                  <div className="flex gap-1">
                    <IconButton label="تحريك لأعلى" onClick={() => move(item.id, -1)}>
                      ↑
                    </IconButton>
                    <IconButton label="تحريك لأسفل" onClick={() => move(item.id, 1)}>
                      ↓
                    </IconButton>
                    <IconButton label="حذف الصورة" onClick={() => remove(item.id)}>
                      ×
                    </IconButton>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
        <fieldset className="space-y-4 border border-line bg-card p-4">
          <legend className="px-1 text-sm font-medium">إعداد الصفحة</legend>
          <label className="block">
            <span className={labelClass}>المقاس</span>
            <select
              className={fieldClass}
              value={pageSize}
              onChange={(event) => setPageSize(event.target.value as PageSizeName)}
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="a5">A5</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>الاتجاه</span>
            <select
              className={fieldClass}
              value={orientation}
              onChange={(event) => setOrientation(event.target.value as "portrait" | "landscape")}
            >
              <option value="portrait">عمودي</option>
              <option value="landscape">أفقي</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>الملاءمة</span>
            <select className={fieldClass} value={fit} onChange={(event) => setFit(event.target.value as FitMode)}>
              <option value="contain">إظهار الصورة كاملة</option>
              <option value="cover">ملء الصفحة مع قص الأطراف</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>الهامش: {marginMm} مم</span>
            <input
              type="range"
              min={0}
              max={30}
              value={marginMm}
              onChange={(event) => setMarginMm(Number(event.target.value))}
              className="w-full"
            />
          </label>
          <label className="block">
            <span className={labelClass}>الجودة: {Math.round(quality * 100)}%</span>
            <input
              type="range"
              min={50}
              max={92}
              value={Math.round(quality * 100)}
              onChange={(event) => setQuality(Number(event.target.value) / 100)}
              className="w-full"
            />
          </label>
          <label className="block">
            <span className={labelClass}>اسم الملف</span>
            <input className={fieldClass} value={filename} onChange={(event) => setFilename(event.target.value)} />
          </label>
          <button className={`${buttonClass.stamp} w-full`} onClick={build} disabled={pending}>
            {pending ? "جارٍ بناء الملف…" : "تنزيل PDF"}
          </button>
        </fieldset>
      </div>
      {error ? <p className="mt-4 text-sm text-seal">{error}</p> : null}
      {note ? <p className="mt-4 text-sm text-ink-soft">{note}</p> : null}
    </ToolFrame>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid h-8 w-8 place-items-center border border-line">
      {children}
    </button>
  );
}

export function ToolFrame({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">{lede}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}
