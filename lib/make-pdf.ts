import { PDFDocument } from "pdf-lib";

export type PageSizeName = "a4" | "letter" | "a5";
export type FitMode = "contain" | "cover";

const PAGE_SIZES: Record<PageSizeName, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  a5: [419.53, 595.28],
};

function mmToPt(mm: number) {
  return (mm * 72) / 25.4;
}

async function bitmapToJpeg(
  bitmap: ImageBitmap,
  quality: number,
  maxEdge: number,
  cropAspect: number | null,
) {
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (cropAspect) {
    const sourceAspect = bitmap.width / bitmap.height;
    if (sourceAspect > cropAspect) {
      sw = bitmap.height * cropAspect;
      sx = (bitmap.width - sw) / 2;
    } else {
      sh = bitmap.width / cropAspect;
      sy = (bitmap.height - sh) / 2;
    }
  }
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("image"))), "image/jpeg", quality);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

export async function buildImagePdf(options: {
  files: File[];
  pageSize: PageSizeName;
  orientation: "portrait" | "landscape";
  marginMm: number;
  fit: FitMode;
  quality: number;
}) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("chihab pdf cnv");
  pdf.setCreator("chihab pdf cnv");
  const base = PAGE_SIZES[options.pageSize];
  const pageWidth = options.orientation === "landscape" ? base[1] : base[0];
  const pageHeight = options.orientation === "landscape" ? base[0] : base[1];
  const margin = mmToPt(Math.min(30, Math.max(0, options.marginMm)));
  const boxWidth = Math.max(20, pageWidth - margin * 2);
  const boxHeight = Math.max(20, pageHeight - margin * 2);
  const quality = Math.min(0.92, Math.max(0.5, options.quality));

  for (const file of options.files) {
    const bitmap = await createImageBitmap(file);
    try {
      const bytes = await bitmapToJpeg(
        bitmap,
        quality,
        2000,
        options.fit === "cover" ? boxWidth / boxHeight : null,
      );
      const image = await pdf.embedJpg(bytes);
      const page = pdf.addPage([pageWidth, pageHeight]);
      const scale =
        options.fit === "cover"
          ? Math.min(boxWidth / image.width, boxHeight / image.height)
          : Math.min(boxWidth / image.width, boxHeight / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      page.drawImage(image, {
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width,
        height,
      });
    } finally {
      bitmap.close();
    }
  }

  return pdf.save();
}

export async function mergePdfFiles(files: File[]) {
  const merged = await PDFDocument.create();
  merged.setTitle("chihab pdf cnv");
  merged.setCreator("chihab pdf cnv");
  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer());
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}

export async function readPdfPageCount(file: File) {
  const source = await PDFDocument.load(await file.arrayBuffer());
  return source.getPageCount();
}

export function parsePageSelection(input: string, pageCount: number) {
  const pages = new Set<number>();
  for (const part of input.split(/[,،]/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const range = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (range) {
      let start = Number(range[1]);
      let end = Number(range[2]);
      if (start > end) [start, end] = [end, start];
      for (let page = start; page <= end; page += 1) {
        if (page < 1 || page > pageCount) throw new Error(`الصفحة ${page} غير موجودة في الملف.`);
        pages.add(page);
      }
    } else if (/^\d+$/.test(trimmed)) {
      const page = Number(trimmed);
      if (page < 1 || page > pageCount) throw new Error(`الصفحة ${page} غير موجودة في الملف.`);
      pages.add(page);
    } else {
      throw new Error("اكتب الصفحات بهذا الشكل: 1-3, 5");
    }
  }
  if (pages.size === 0) throw new Error("اختر صفحة واحدة على الأقل.");
  return [...pages].sort((a, b) => a - b);
}

export async function extractPdfPages(file: File, pages: number[]) {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const doc = await PDFDocument.create();
  doc.setCreator("chihab pdf cnv");
  const copied = await doc.copyPages(
    source,
    pages.map((page) => page - 1),
  );
  copied.forEach((page) => doc.addPage(page));
  return doc.save();
}
