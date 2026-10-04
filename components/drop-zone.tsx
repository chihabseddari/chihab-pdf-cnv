"use client";

export function DropZone({
  accept,
  multiple = false,
  label,
  hint,
  onFiles,
}: {
  accept: string;
  multiple?: boolean;
  label: string;
  hint: string;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <label
      className="block cursor-pointer border border-dashed border-ink/30 bg-card px-6 py-10 text-center transition hover:border-stamp"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(event.dataTransfer.files);
      }}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <span className="block font-medium">{label}</span>
      <span className="mt-1 block text-sm leading-7 text-ink-soft">{hint}</span>
    </label>
  );
}
