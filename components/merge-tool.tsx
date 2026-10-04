"use client";

import { useState } from "react";
import { DropZone } from "./drop-zone";
import { ToolFrame } from "./images-tool";
import { mergePdfFiles, readPdfPageCount } from "@/lib/make-pdf";
import { downloadBytes, logActivity } from "@/lib/browser";
import { safePdfName } from "@/lib/format";
import { buttonClass, fieldClass, labelClass } from "@/lib/styles";

type Item = { id: string; file: File; pages: number | null; problem?: string };

export function MergeTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [filename, setFilename] = useState("دمج-chihab");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next = [...items];
    for (const file of list) {
      if (next.length >= 20) {
        setError("الحد 20 ملفًا.");
        break;
      }
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setError("اختر ملفات PDF.");
        continue;
      }
      if (file.size > 30 * 1024 * 1024) {
        setError(`${file.name} أكبر من 30 ميغابايت.`);
        continue;
      }
      const item: Item = { id: crypto.randomUUID(), file, pages: null };
      try {
        item.pages = await readPdfPageCount(file);
      } catch {
        item.problem = "محمي أو تالف";
      }
      next.push(item);
    }
    setItems(next);
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
    if (items.length < 2) {
      setError("أضف ملفين على الأقل.");
      return;
    }
    if (items.some((item) => item.problem)) {
      setError("احذف الملفات التي تعذر قراءتها قبل الدمج.");
      return;
    }
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const bytes = await mergePdfFiles(items.map((item) => item.file));
      downloadBytes(bytes, safePdfName(filename, "دمج-chihab"), "application/pdf");
      const pages = items.reduce((sum, item) => sum + (item.pages ?? 0), 0);
      const saved = await logActivity("merge-pdf", "دمج ملفات PDF", `${items.length} ملفات · ${pages} صفحة`);
      if (!saved) setNote("تم التنزيل. تعذر حفظ العملية في السجل.");
    } catch {
      setError("تعذر الدمج. قد يكون أحد الملفات محميًا بكلمة مرور.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ToolFrame
      title="دمج PDF"
      lede="اجمع عدة ملفات في ملف واحد بالترتيب الذي تختاره. الملفات تبقى في متصفحك."
    >
      <DropZone
        accept="application/pdf"
        multiple
        label="أفلت ملفات PDF هنا"
        hint="حتى 20 ملفًا. الملفات المحمية بكلمة مرور لا تُفتح."
        onFiles={addFiles}
      />
      <ol className="mt-4 space-y-2">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3 border border-line bg-card px-3 py-2">
            <span className="font-display text-2xl text-ink-soft">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{item.file.name}</p>
              <p className="text-xs text-ink-soft">
                {item.problem ? item.problem : item.pages === null ? "…" : `${item.pages} صفحة`}
              </p>
            </div>
            <button type="button" className="px-2" onClick={() => move(item.id, -1)} aria-label="تحريك لأعلى">
              ↑
            </button>
            <button type="button" className="px-2" onClick={() => move(item.id, 1)} aria-label="تحريك لأسفل">
              ↓
            </button>
            <button
              type="button"
              className="px-2"
              aria-label="حذف الملف"
              onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            >
              ×
            </button>
          </li>
        ))}
      </ol>
      <label className="mt-4 block max-w-sm">
        <span className={labelClass}>اسم الملف</span>
        <input className={fieldClass} value={filename} onChange={(event) => setFilename(event.target.value)} />
      </label>
      <button className={`${buttonClass.stamp} mt-4`} onClick={build} disabled={pending}>
        {pending ? "جارٍ الدمج…" : "تنزيل الملف المدموج"}
      </button>
      {error ? <p className="mt-4 text-sm text-seal">{error}</p> : null}
      {note ? <p className="mt-4 text-sm text-ink-soft">{note}</p> : null}
    </ToolFrame>
  );
}
