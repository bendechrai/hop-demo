const totalLinks = document.getElementById("total-links");
const totalClicks = document.getElementById("total-clicks");
// Not named top: a top-level const named top collides with window.top.
const topRows = document.getElementById("top");
const message = document.getElementById("message");

function cell(className, text) {
  const td = document.createElement("td");
  if (className) td.className = className;
  td.textContent = text;
  return td;
}

function render(stats) {
  totalLinks.textContent = String(stats.links);
  totalClicks.textContent = String(stats.clicks);
  topRows.replaceChildren();
  if (stats.top.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty";
    tr.appendChild(cell("", "No links yet."));
    tr.firstChild.colSpan = 3;
    topRows.appendChild(tr);
    return;
  }
  for (const link of stats.top) {
    const tr = document.createElement("tr");
    if (link.expired) tr.className = "expired";
    tr.appendChild(cell("code", link.code));
    const dest = cell("dest", link.url);
    dest.title = link.url;
    tr.appendChild(dest);
    const num = cell("num", String(link.clicks));
    if (link.expired) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = "Expired";
      num.append(" ", tag);
    }
    tr.appendChild(num);
    topRows.appendChild(tr);
  }
}

async function load() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  render(await res.json());
}

load().catch((err) => {
  message.textContent = err.message;
});
