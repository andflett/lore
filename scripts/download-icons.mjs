import fs from "node:fs";

// game-icons.net CDN: white icon path on a black background rect.
// For CSS-mask use we keep only the icon path, stripped of fill.
const icons = {
  "treasure-map": "lorc/treasure-map",
  crossroads: "delapouite/crossroad",
  cowled: "lorc/cowled",
  castle: "delapouite/castle",
  "quill-ink": "lorc/quill-ink",
  dragon: "lorc/dragon-head",
  sunrise: "lorc/sunrise",
  "moon-bats": "lorc/moon",
  "magnifying-glass": "lorc/magnifying-glass",
  "scroll-unfurled": "lorc/scroll-unfurled",
  "check-mark": "delapouite/check-mark",
  cancel: "sbed/cancel",
  "light-bulb": "lorc/light-bulb",
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
  svg = svg.replace(/<path d="M0 0h512v512H0z"\/>/, "");
  svg = svg.replace(/ fill="#fff"/g, "").replace(/ fill="#000"/g, "");
  fs.writeFileSync(`public/icons/${name}.svg`, svg);
  console.log(`wrote ${name}`);
}
