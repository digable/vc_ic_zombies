// ---------------------------------------------------------------------------
// Bug Report — modal, compression, API call, download
// ---------------------------------------------------------------------------

function openBugReportModal() {
  const modal = document.getElementById("bugReportModal");
  if (!modal) return;
  // Reset to input state
  document.getElementById("brInputSection").classList.remove("hidden");
  document.getElementById("brResultSection").classList.add("hidden");
  document.getElementById("brTitle").value = "";
  document.getElementById("brDescription").value = "";
  document.getElementById("brStatus").textContent = "";
  const submitBtn = document.getElementById("brSubmitBtn");
  if (submitBtn) submitBtn.disabled = false;
  modal.classList.remove("hidden");
  document.getElementById("brTitle").focus();
}

function closeBugReportModal() {
  document.getElementById("bugReportModal")?.classList.add("hidden");
}

async function compressState() {
  const json = JSON.stringify(serializeState());
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  writer.write(encoder.encode(json));
  writer.close();

  const chunks = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const compressed = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    compressed.set(chunk, offset);
    offset += chunk.length;
  }
  // Convert to base64
  return btoa(String.fromCharCode(...compressed));
}

function downloadJson(json, filename) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildEnvironment() {
  const p = currentPlayer();
  return [
    `Turn: ${state.turnNumber}`,
    `Step: ${state.step}`,
    `Players: ${state.players.length}`,
    `Browser: ${navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] ?? "unknown"}`
  ].join(" | ");
}

async function submitBugReport() {
  const title = document.getElementById("brTitle")?.value.trim();
  const description = document.getElementById("brDescription")?.value.trim();
  const statusEl = document.getElementById("brStatus");

  if (!title) {
    statusEl.textContent = "Please enter a title.";
    statusEl.className = "br-status br-error";
    return;
  }

  const submitBtn = document.getElementById("brSubmitBtn");
  if (submitBtn) submitBtn.disabled = true;
  statusEl.textContent = "Compressing game state...";
  statusEl.className = "br-status";

  try {
    const compressedState = await compressState();
    statusEl.textContent = "Submitting report...";

    const res = await fetch("/api/bug-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        compressedState,
        environment: buildEnvironment()
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

    // Switch modal to result view
    document.getElementById("brInputSection").classList.add("hidden");
    const resultSection = document.getElementById("brResultSection");
    resultSection.classList.remove("hidden");

    const link = document.getElementById("brIssueLink");
    if (link) { link.href = data.issueUrl; link.textContent = data.issueUrl; }

    const dlBtn = document.getElementById("brDownloadBtn");
    if (dlBtn) {
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      dlBtn.onclick = () => downloadJson(data.saveJson, `vc-zombies-bug-${ts}.json`);
    }
  } catch (e) {
    statusEl.textContent = `Failed: ${e.message}`;
    statusEl.className = "br-status br-error";
    if (submitBtn) submitBtn.disabled = false;
  }
}
