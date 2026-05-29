// Strips the model-appended SOURCES block (we have structured sources from the
// data stream) and collects the distinct [n] indices cited in the text.
export function parseCitations(content: string): {
  text: string;
  citedIndices: number[];
} {
  const sourcesBlockPattern = /\n*SOURCES\n[\s\S]*$/;
  const text = content.replace(sourcesBlockPattern, "").trim();
  const citedIndices = [...text.matchAll(/\[(\d+)\]/g)].map((m) =>
    parseInt(m[1], 10),
  );
  return { text, citedIndices: [...new Set(citedIndices)] };
}
