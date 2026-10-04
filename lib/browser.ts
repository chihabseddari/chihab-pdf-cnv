export function downloadBytes(bytes: Uint8Array, filename: string, type: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const url = URL.createObjectURL(new Blob([copy], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function logActivity(kind: string, title: string, detail: string) {
  const response = await fetch("/api/activity", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, title, detail }),
  });
  return response.ok;
}
