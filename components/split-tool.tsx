"use client";

import { useState } from "react";
import JSZip from "jszip";
import { DropZone } from "./drop-zone";
import { ToolFrame } from "./images-tool";
import { extractPdfPages, parsePageSelection, readPdfPageCount } from "@/lib/make-pdf";
import { downloadBytes, logActivity } from "@/lib/browser";
import { safePdfName } from "@/lib/format";
import { buttonClass, fieldClass, labelClass } from "@/lib/styles";

export function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [selection, setSelection] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function addFiles(list: FileList | null) {
    const next = list?.[0];
    if (!next) return;
    setError(null);
    setNote(null);
    if (next.size > 40 * 1024 * 1024) {
      setError("الملف أكبر من 40 ميغابايت.");
      return;
    }
    try {
      const count = await readPdfPageCount(next);
      setFile(next);
      setPageCount(count);
      setSelection(count === 1 ? "1" : `1-${count}`);
    } catch {
      setFile(null);
      setPageCount(null);
      setError("تعذر فتح الملف. قد يكون محميًا أو تالفًا.");
    }
  }

  function chosenPages() {
    if (!pageCount) throw new Error("اختر ملف PDF.");
    return parsePageSelection(selection, pageCount);
  }

  async function downloadSelection() {
    if (!file) return;
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const pages = chosenPages();
      const bytes = await extractPdfPages(file, pages);
      downloadBytes(bytes, safePdfName(`${file.name}-صفحات`, "صفحات"), "application/pdf");
      const saved = await logActivity("split-pdf", "استخراج صفحات", `${pages.length} من ${pageCount}`);
      if (!saved) setNote("تم التنزيل. تعذر حفظ العملية في السجل.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر استخراج الصفحات.");
    } finally {
      setPending(false);
    }
  }

  async function downloadZip() {
    if (!file || !pageCount) return;
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const pages = chosenPages();
      const zip = new JSZip();
      for (const page of pages) {
        const bytes = await extractPdfPages(file, [page]);
        zip.file(`page-${page}.pdf`, bytes);
      }
      const zipped = await zip.generateAsync({ type: "uint8array" });
      downloadBytes(zipped, safePdfName(`${file.name}-صفحات`, "صفحات").replace(/\.pdf$/, ".zip"), "application/zip");
      const saved = await logActivity("split-pdf", "تقسيم صفحات إلى ملفات", `${pages.length} ملفات`);
      if (!saved) setNote("تم التنزيل. تعذر حفظ العملية في السجل.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر إنشاء الأرشيف.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ToolFrame
      title="تقسيم PDF"
      lede="استخرج صفحات محددة في ملف واحد، أو نزّل كل صفحة في ملف داخل أرشيف. الملف يبقى في متصفحك."
    >
      <DropZone
        accept="application/pdf"
        label="اختر ملف PDF"
        hint="حتى 40 ميغابايت. اكتب الصفحات مثل 1-3, 5."
        onFiles={addFiles}
      />
      {file && pageCount ? (
        <div className="mt-4 max-w-lg space-y-4">
          <p className="text-sm text-ink-soft">
            {file.name} · {pageCount} صفحة
          </p>
          <label className="block">
            <span className={labelClass}>الصفحات</span>
            <input
              dir="ltr"
              className={`${fieldClass} text-left`}
              value={selection}
              onChange={(event) => setSelection(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button className={buttonClass.stamp} onClick={downloadSelection} disabled={pending}>
              ملف بالصفحات المختارة
            </button>
            <button className={buttonClass.ghost} onClick={downloadZip} disabled={pending}>
              أرشيف، صفحة لكل ملف
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm text-seal">{error}</p> : null}
      {note ? <p className="mt-4 text-sm text-ink-soft">{note}</p> : null}
    </ToolFrame>
  );
}
