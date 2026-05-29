import fs from "node:fs";

const icons = {
  fireplace: "delapouite/fireplace",
  campfire: "lorc/campfire",
  "lantern-flame": "lorc/lantern-flame",
  "candle-flame": "lorc/candle-flame",
};

fs.mkdirSync("public/icons", { recursive: true });

for (const [name, path] of Object.entries(icons)) {
  const url = `https://game-icons.net/icons/ffffff/000000/1x1/${path}.svg`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAIL ${name} (${res.status}) ${path}`);
    continue;
  }
  let svg = await res.text();
  // Drop the full-canvas black background rect; strip explicit fills so the
  // glyph picks up `currentColor` via the CSS mask in GameIcon.
  svg = svg.replace(/<path d="M0 0h512v512H0z"\/>/, "");
  svg = svg.replace(/ fill="#fff"/g, "").replace(/ fill="#000"/g, "");
  fs.writeFileSync(`public/icons/${name}.svg`, svg);
  console.log(`wrote ${name}`);
}
