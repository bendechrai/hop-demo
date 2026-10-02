const form = document.getElementById("shorten");
const input = document.getElementById("url");
const codeInput = document.getElementById("code");
const expiresInput = document.getElementById("expires");
const labelInput = document.getElementById("label");
const filterInput = document.getElementById("filter");
const submit = form.querySelector("button[type=submit]");
const message = document.getElementById("message");
const result = document.getElementById("result");
const resultLink = document.getElementById("result-link");
const copyButton = document.getElementById("copy");
const rows = document.getElementById("rows");
const count = document.getElementById("count");

function setMessage(text, ok = false) {
  message.textContent = text;
  message.classList.toggle("ok", ok);
}

function cell(className, child) {
  const td = document.createElement("td");
  if (className) td.className = className;
  if (typeof child === "string") td.textContent = child;
  else td.appendChild(child);
  return td;
}

// The last list is kept so typing in the filter, and the five-second
// refresh, both redraw through the same filter.
let allLinks = [];

function visibleLinks() {
  const needle = filterInput.value.trim().toLowerCase();
  if (needle === "") return allLinks;
  return allLinks.filter((link) => link.label && link.label.toLowerCase().includes(needle));
}

function render(fetched) {
  allLinks = fetched;
  const links = visibleLinks();
  rows.replaceChildren();
  count.textContent = links.length === 1 ? "1 link" : `${links.length} links`;
  if (links.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty";
    const filtering = allLinks.length > 0;
    tr.appendChild(cell("", filtering ? "No link matches that label." : "No links yet. Shorten one above."));
    tr.firstChild.colSpan = 4;
    rows.appendChild(tr);
    return;
  }
  for (const link of links) {
    const tr = document.createElement("tr");
    if (link.expired) tr.className = "expired";
    const a = document.createElement("a");
    a.href = link.shortUrl;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = link.shortUrl.replace(/^https?:\/\//, "");
    const first = cell("", a);
    if (link.label) {
      const tag = document.createElement("span");
      tag.className = "tag label-tag";
      tag.textContent = link.label;
      first.appendChild(tag);
    }
    tr.appendChild(first);
    const dest = cell("dest", link.url);
    dest.title = link.url;
    tr.appendChild(dest);
    tr.appendChild(cell("num", link.expired ? "Expired" : String(link.clicks)));
    tr.appendChild(cell("actions", deleteButton(link)));
    rows.appendChild(tr);
  }
}

function deleteButton(link) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ghost danger";
  button.textContent = "Delete";
  button.setAttribute("aria-label", `Delete ${link.code}`);
  button.addEventListener("click", () => remove(link.code));
  return button;
}

async function remove(code) {
  if (!window.confirm(`Delete the short link "${code}"? This cannot be undone.`)) return;
  setMessage("");
  try {
    const res = await fetch(`/api/links/${encodeURIComponent(code)}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error ?? "Could not delete the link.");
    }
    await load();
  } catch (err) {
    setMessage(err.message);
  }
}

async function load() {
  const res = await fetch("/api/links");
  if (!res.ok) throw new Error("Failed to load links");
  render(await res.json());
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");
  submit.disabled = true;
  try {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.value, code: codeInput.value, expiresInDays: expiresInput.value, label: labelInput.value }),
    });
    const body = await res.json();
    if (!res.ok) {
      setMessage(body.error ?? "Something went wrong.");
      return;
    }
    resultLink.href = body.shortUrl;
    resultLink.textContent = body.shortUrl;
    result.hidden = false;
    input.value = "";
    codeInput.value = "";
    expiresInput.value = "";
    labelInput.value = "";
    setMessage("Short link created.", true);
    await load();
  } catch (err) {
    setMessage(err.message);
  } finally {
    submit.disabled = false;
  }
});

filterInput.addEventListener("input", () => render(allLinks));

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultLink.href);
    copyButton.textContent = "Copied";
    setTimeout(() => { copyButton.textContent = "Copy"; }, 1500);
  } catch {
    setMessage("Could not copy to clipboard.");
  }
});

load().catch((err) => setMessage(err.message));
setInterval(() => load().catch(() => {}), 5000);
