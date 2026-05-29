import fs from "node:fs";

const src = fs.readFileSync(".claude/planning/lorekeeper-prototype.jsx", "utf8");
const start = src.indexOf("const GI_PATHS = {");
const end = src.indexOf("\n}", start);
const block = src.slice(start, end);
const re = /'([a-z-]+)':\s*"((?:[^"\\]|\\.)*)"/g;
let m;
let count = 0;
fs.mkdirSync("public/icons", { recursive: true });
while ((m = re.exec(block))) {
  const name = m[1];
  const d = m[2];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="${d}"/></svg>`;
  fs.writeFileSync(`public/icons/${name}.svg`, svg);
  count++;
  console.log("wrote", name);
}
console.log("total", count);
