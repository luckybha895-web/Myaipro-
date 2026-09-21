export type ProjectFile = { name: string; language: string; code: string };

export type GeneratedProject = {
  title: string;
  description: string;
  preview_html: string;
  files: ProjectFile[];
};

const MARKER = "<!--PREVIEW-->";

/** Projects store description + preview HTML in one column, split by a marker. */
export function packDescription(description: string, previewHtml: string) {
  return `${description}\n\n${MARKER}\n${previewHtml}`;
}

export function unpackDescription(value: string | null): {
  description: string;
  previewHtml: string;
} {
  if (!value) return { description: "", previewHtml: "" };
  const idx = value.indexOf(MARKER);
  if (idx === -1) return { description: value, previewHtml: "" };
  return {
    description: value.slice(0, idx).trim(),
    previewHtml: value.slice(idx + MARKER.length).trim(),
  };
}
