/* =========================================================================
 * Anamnez Oluşturucu — Uygulama mantığı
 * Şemayı forma dönüştürür, durumu tutar, canlı taslak üretir.
 * ====================================================================== */

const TEMPLATES = {
  hipertansiyon: HIPERTANSIYON_SEMA,
  "ulseratif-kolit": ULSERATIF_KOLIT_SEMA,
  "tip2-dm": TIP2_DM_SEMA,
  kky: KKY_SEMA,
  koah: KOAH_SEMA,
  astim: ASTIM_SEMA,
  kbh: KBH_SEMA,
  hipotiroidi: HIPOTIROIDI_SEMA,
  hipertiroidi: HIPERTIROIDI_SEMA,
  mng: MNG_SEMA,
  siroz: SIROZ_SEMA,
  kf: KF_SEMA,
  "hepatit-b": HEPATIT_B_SEMA,
  osteoporoz: OSTEOPOROZ_SEMA
};

const form = document.getElementById("anamnez-form");
const preview = document.getElementById("preview");
const toast = document.getElementById("toast");
const subtitle = document.getElementById("subtitle");
const navList = document.getElementById("section-nav-list");
const layout = document.getElementById("layout");
const progressBar = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");
const wordCount = document.getElementById("word-count");

let currentId = "hipertansiyon";
let schema = TEMPLATES[currentId];
let savedStates = {}; // templateId -> state anlık görüntüsü (çoklu kronik hastalık)
let state = {}; // blockId -> { mode, values:{} } | semptom: { symptomId: {freq, artan} }
let conditionalEls = []; // koşullu görünür bloklar: [{ block, el }]

/* ---------- Durum başlatma ---------- */
function initState() {
  state = {};
  schema.groups.forEach((g) => {
    g.blocks.forEach((b) => {
      if (b.type === "symptoms") {
        state[b.id] = {};
        b.symptoms.forEach((s) => (state[b.id][s.id] = { freq: "atla", artan: false }));
      } else if (b.type === "symptom-code") {
        state[b.id] = {};
        b.symptoms.forEach((s) => (state[b.id][s.id] = "sorgu"));
      } else {
        state[b.id] = { mode: b.default || "skip", values: {} };
      }
    });
  });
  savedStates[currentId] = state;
}

/* ---------- Form oluşturma ---------- */
function renderForm() {
  form.innerHTML = "";
  navList.innerHTML = "";
  conditionalEls = [];

  schema.groups.forEach((group, i) => {
    const num = i + 1;
    const section = document.createElement("section");
    section.className = "group";
    section.id = `grp-${group.id}`;

    const head = document.createElement("div");
    head.className = "group-head";
    head.innerHTML =
      `<span class="group-num">${num}</span><h3>${group.title}</h3>`;
    section.appendChild(head);

    const body = document.createElement("div");
    body.className = "group-body";
    group.blocks.forEach((block) => {
      const el = block.type === "symptoms" ? renderSymptomBlock(block)
        : block.type === "symptom-code" ? renderSymptomCodeBlock(block)
        : renderBlock(block);
      if (typeof block.visibleIf === "function") conditionalEls.push({ block, el });
      body.appendChild(el);
    });
    section.appendChild(body);
    form.appendChild(section);

    // Bölüm navigasyon bağlantısı
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#grp-${group.id}`;
    a.innerHTML = `<span class="nav-num">${num}</span><span>${group.title}</span>`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(`grp-${group.id}`)
        .scrollIntoView({ behavior: "smooth", block: "start" });
    });
    li.appendChild(a);
    navList.appendChild(li);
  });

  applyVisibility();
  setupScrollSpy();
}

/* Aktif bölümü navigasyonda vurgular */
let scrollSpy;
function setupScrollSpy() {
  if (scrollSpy) scrollSpy.disconnect();
  const links = Array.from(navList.querySelectorAll("a"));
  scrollSpy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = en.target.id;
          links.forEach((l) =>
            l.classList.toggle("active", l.getAttribute("href") === `#${id}`));
        }
      });
    },
    { rootMargin: "-140px 0px -65% 0px", threshold: 0 }
  );
  schema.groups.forEach((g) => {
    const sec = document.getElementById(`grp-${g.id}`);
    if (sec) scrollSpy.observe(sec);
  });
}

/* Koşullu blokların görünürlüğünü günceller */
function applyVisibility() {
  conditionalEls.forEach(({ block, el }) => {
    el.style.display = block.visibleIf(state) ? "" : "none";
  });
}

/* Standart blok (modlu) */
function renderBlock(block) {
  const wrap = document.createElement("div");
  wrap.className = "block";
  wrap.dataset.block = block.id;

  const q = document.createElement("p");
  q.className = "block-label";
  q.textContent = block.label;
  wrap.appendChild(q);

  // Mod seçici (segmented)
  const seg = document.createElement("div");
  seg.className = "segmented";
  block.modes.forEach((mode) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seg-btn";
    btn.textContent = mode.label;
    btn.dataset.mode = mode.key;
    if (state[block.id].mode === mode.key) btn.classList.add("active");
    btn.addEventListener("click", () => {
      state[block.id].mode = mode.key;
      seg.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderFields(block, fieldsHost);
      generate();
    });
    seg.appendChild(btn);
  });
  wrap.appendChild(seg);

  // Açılan alanlar
  const fieldsHost = document.createElement("div");
  fieldsHost.className = "fields";
  wrap.appendChild(fieldsHost);
  renderFields(block, fieldsHost);

  return wrap;
}

function renderFields(block, host) {
  host.innerHTML = "";
  const mode = block.modes.find((m) => m.key === state[block.id].mode);
  if (!mode || !mode.fields) return;

  mode.fields.forEach((f) => {
    if (f.type === "multi") {
      host.appendChild(renderMultiField(block, f));
      return;
    }
    const id = `${block.id}__${f.name}`;
    const row = document.createElement("label");
    row.className = "field";
    row.setAttribute("for", id);

    const cap = document.createElement("span");
    cap.className = "field-label";
    cap.textContent = f.label;
    row.appendChild(cap);

    let input;
    if (f.type === "select") {
      input = document.createElement("select");
      f.options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else {
      input = document.createElement("input");
      input.type = f.type === "number" ? "number" : f.type === "date" ? "date" : "text";
      if (f.placeholder) input.placeholder = f.placeholder;
    }
    input.id = id;
    input.className = "field-input";

    // Mevcut değeri geri yükle
    const saved = state[block.id].values[f.name];
    if (saved != null) input.value = saved;
    else if (f.type === "select") state[block.id].values[f.name] = f.options[0];

    input.addEventListener("input", () => {
      state[block.id].values[f.name] = input.value;
      generate();
    });
    row.appendChild(input);
    host.appendChild(row);
  });
}

/* Çoklu seçim (checkbox) alanı */
function renderMultiField(block, f) {
  const wrap = document.createElement("div");
  wrap.className = "field field-multi";

  const cap = document.createElement("span");
  cap.className = "field-label";
  cap.textContent = f.label;
  wrap.appendChild(cap);

  const box = document.createElement("div");
  box.className = "checks";
  const saved = state[block.id].values[f.name] || [];

  f.options.forEach((opt) => {
    const lbl = document.createElement("label");
    lbl.className = "check";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = saved.includes(opt);
    cb.addEventListener("change", () => {
      const cur = new Set(state[block.id].values[f.name] || []);
      cb.checked ? cur.add(opt) : cur.delete(opt);
      // seçenek sırasını koru
      state[block.id].values[f.name] = f.options.filter((o) => cur.has(o));
      generate();
    });
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(opt));
    box.appendChild(lbl);
  });

  wrap.appendChild(box);
  return wrap;
}

/* Semptom matrisi bloğu */
function renderSymptomBlock(block) {
  const wrap = document.createElement("div");
  wrap.className = "block";
  wrap.dataset.block = block.id;

  const q = document.createElement("p");
  q.className = "block-label";
  q.textContent = block.label;
  wrap.appendChild(q);

  const table = document.createElement("div");
  table.className = "symptom-table";

  const FREQ = [
    { key: "atla", label: "Atla" },
    { key: "yok", label: "Yok" },
    { key: "ara", label: "Ara sıra" },
    { key: "sik", label: "Sık sık" }
  ];

  block.symptoms.forEach((s) => {
    const row = document.createElement("div");
    row.className = "symptom-row";

    const name = document.createElement("span");
    name.className = "symptom-name";
    name.textContent = s.label;
    row.appendChild(name);

    const seg = document.createElement("div");
    seg.className = "segmented small";
    FREQ.forEach((fr) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seg-btn";
      btn.textContent = fr.label;
      if (state[block.id][s.id].freq === fr.key) btn.classList.add("active");
      btn.addEventListener("click", () => {
        state[block.id][s.id].freq = fr.key;
        seg.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        // "atla"/"yok" iken artış kutusu anlamsız
        const showArtan = fr.key === "ara" || fr.key === "sik";
        artanWrap.style.visibility = showArtan ? "visible" : "hidden";
        if (!showArtan) {
          state[block.id][s.id].artan = false;
          artanChk.checked = false;
        }
        generate();
      });
      seg.appendChild(btn);
    });
    row.appendChild(seg);

    // "Son zamanlarda sıklaştı"
    const artanWrap = document.createElement("label");
    artanWrap.className = "artan";
    const artanChk = document.createElement("input");
    artanChk.type = "checkbox";
    artanChk.checked = !!state[block.id][s.id].artan;
    const cur = state[block.id][s.id].freq;
    artanWrap.style.visibility = cur === "ara" || cur === "sik" ? "visible" : "hidden";
    artanChk.addEventListener("change", () => {
      state[block.id][s.id].artan = artanChk.checked;
      generate();
    });
    artanWrap.appendChild(artanChk);
    artanWrap.appendChild(document.createTextNode("son zamanlarda arttı"));
    row.appendChild(artanWrap);

    table.appendChild(row);
  });

  wrap.appendChild(table);
  return wrap;
}

/* Semptom kodlama bloğu (Var / Yok / Sorgulanmalı; varsayılan Sorgulanmalı) */
function renderSymptomCodeBlock(block) {
  const wrap = document.createElement("div");
  wrap.className = "block";
  wrap.dataset.block = block.id;

  const q = document.createElement("p");
  q.className = "block-label";
  q.textContent = block.label;
  wrap.appendChild(q);

  const table = document.createElement("div");
  table.className = "symptom-table";

  const STATES = [
    { key: "var", label: "Var" },
    { key: "yok", label: "Yok" },
    { key: "sorgu", label: "Sorgulanmalı" }
  ];

  block.symptoms.forEach((s) => {
    const row = document.createElement("div");
    row.className = "symptom-row code";

    const name = document.createElement("span");
    name.className = "symptom-name";
    name.textContent = s.label;
    row.appendChild(name);

    const seg = document.createElement("div");
    seg.className = "segmented small";
    STATES.forEach((stt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seg-btn";
      btn.textContent = stt.label;
      if (state[block.id][s.id] === stt.key) btn.classList.add("active");
      btn.addEventListener("click", () => {
        state[block.id][s.id] = stt.key;
        seg.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        generate();
      });
      seg.appendChild(btn);
    });
    row.appendChild(seg);
    table.appendChild(row);
  });

  wrap.appendChild(table);
  return wrap;
}

/* ---------- Taslak üretimi ---------- */
/* Verilen şema + durum için paragraf listesi üretir (saf, DOM'a dokunmaz) */
function buildParagraphs(sch, st) {
  const paragraphs = [];
  sch.groups.forEach((group) => {
    const sentences = [];
    group.blocks.forEach((block) => {
      if (typeof block.visibleIf === "function" && !block.visibleIf(st)) return;
      if (!st[block.id]) return;
      if (block.type === "symptoms") {
        const txt = buildSymptoms(block.symptoms, st[block.id]);
        if (txt) sentences.push(txt);
      } else if (block.type === "symptom-code") {
        const txt = buildSymptomCode(block.symptoms, st[block.id]);
        if (txt) sentences.push((block.noteHeader ? block.noteHeader + "\n" : "") + txt);
      } else {
        const s0 = st[block.id];
        const mode = block.modes.find((m) => m.key === s0.mode);
        if (mode && typeof mode.build === "function") sentences.push(mode.build(s0.values));
      }
    });
    if (sentences.length) paragraphs.push(sentences.join(" "));
  });
  return paragraphs;
}

/* Şablon başlığından kısa hastalık adı: "KOAH Anamnezi" -> "KOAH" */
function shortName(t) { return t.replace(/\s*Anamnezi$/i, ""); }

function generate() {
  applyVisibility();
  savedStates[currentId] = state;

  // Tüm kayıtlı hastalıkların taslaklarını başlıklarıyla birleştir
  const parts = [];
  Object.keys(TEMPLATES).forEach((id) => {
    const st = id === currentId ? state : savedStates[id];
    if (!st) return;
    const paras = buildParagraphs(TEMPLATES[id], st);
    if (paras.length) parts.push({ id, title: TEMPLATES[id].title, paras });
  });
  const multi = parts.length > 1;

  if (parts.length === 0) {
    preview.innerHTML =
      '<p class="preview-empty">Soruları yanıtladıkça anamnez taslağı burada oluşacak.</p>';
    preview.dataset.text = "";
  } else {
    let html = "";
    const txtBlocks = [];
    parts.forEach((pt) => {
      const kisa = shortName(pt.title);
      if (multi) html += `<h3 class="disease-heading">${escapeHtml(kisa)}:</h3>`;
      html += pt.paras.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
      txtBlocks.push((multi ? `${kisa}:\n` : "") + pt.paras.join("\n\n"));
    });
    preview.innerHTML = html;
    preview.dataset.text = txtBlocks.join("\n\n");
  }

  renderActiveChips(parts);
  updateProgress();
  updateWordCount(preview.dataset.text);
}

/* Nottaki hastalıkları çip olarak gösterir; × ile ilgili anamnez çıkarılır */
function renderActiveChips(parts) {
  const host = document.getElementById("active-diseases");
  if (!host) return;
  host.innerHTML = "";
  if (parts.length < 2) { host.hidden = true; return; }
  host.hidden = false;
  const lbl = document.createElement("span");
  lbl.className = "ad-label";
  lbl.textContent = "Nottaki hastalıklar:";
  host.appendChild(lbl);
  parts.forEach((pt) => {
    const chip = document.createElement("span");
    chip.className = "ad-chip";
    chip.textContent = shortName(pt.title);
    const x = document.createElement("button");
    x.type = "button";
    x.className = "ad-x";
    x.textContent = "×";
    x.title = `${shortName(pt.title)} anamnezini nottan çıkar`;
    x.setAttribute("aria-label", x.title);
    x.addEventListener("click", () => removeDisease(pt.id));
    chip.appendChild(x);
    host.appendChild(chip);
  });
}

/* Bir kronik hastalığın anamnezini nottan çıkarır */
function removeDisease(id) {
  if (id === currentId) {
    initState();     // seçili hastalığı sıfırla (form da boşalır)
    renderForm();
  } else {
    delete savedStates[id];
  }
  generate();
  showToast("Hastalık anamnezi nottan çıkarıldı.");
}

/* Yanıtlanan (atlanmamış) blok oranını hesaplar */
function updateProgress() {
  let total = 0, done = 0;
  schema.groups.forEach((group) => {
    group.blocks.forEach((block) => {
      if (typeof block.visibleIf === "function" && !block.visibleIf(state)) return;
      total++;
      if (block.type === "symptoms") {
        const answered = Object.values(state[block.id]).some((s) => s.freq && s.freq !== "atla");
        if (answered) done++;
      } else if (block.type === "symptom-code") {
        const answered = Object.values(state[block.id]).some((v) => v !== "sorgu");
        if (answered) done++;
      } else if (state[block.id].mode !== "skip") {
        done++;
      }
    });
  });
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = pct + "%";
  progressLabel.textContent = `%${pct}`;
}

function updateWordCount(text) {
  const n = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  wordCount.textContent = `${n} kelime`;
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

/* ---------- Dışa aktarma: Yazdır/PDF (temiz pencere) ve Word (.doc) ---------- */
function anamnezPrintWindow(title, text) {
  if (!text) return showToast("Henüz oluşturulmuş bir taslak yok.");
  const w = window.open("", "_blank");
  if (!w) return showToast("Açılır pencereye izin verin (PDF/yazdırma için).");
  w.document.write(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
    "<style>@page{margin:20mm}body{font-family:Georgia,'Times New Roman',serif;font-size:12pt;" +
    "line-height:1.55;color:#000;white-space:pre-wrap;word-wrap:break-word;margin:0}</style>" +
    `</head><body>${escapeHtml(text)}</body></html>`);
  w.document.close(); w.focus();
  setTimeout(() => { try { w.print(); } catch (e) {} }, 350);
}

function anamnezDownloadWord(filename, title, text) {
  if (!text) return showToast("Henüz oluşturulmuş bir taslak yok.");
  const body = escapeHtml(text).replace(/\n/g, "<br>");
  const html =
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>" +
    `<head><meta charset='utf-8'><title>${escapeHtml(title)}</title></head>` +
    `<body><div style="font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5">${body}</div></body></html>`;
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  showToast("Word dosyası indiriliyor.");
}

/* ---------- Eylemler ---------- */
document.getElementById("copy-btn").addEventListener("click", async () => {
  const text = preview.dataset.text || "";
  if (!text) return showToast("Henüz oluşturulmuş bir taslak yok.");
  try {
    await navigator.clipboard.writeText(text);
    showToast("Taslak panoya kopyalandı.");
  } catch {
    // Yedek yöntem
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast("Taslak panoya kopyalandı.");
  }
});

document.getElementById("reset-btn").addEventListener("click", () => {
  savedStates = {};
  initState();
  renderForm();
  generate();
  showToast("Tüm formlar temizlendi.");
});

document.getElementById("print-btn").addEventListener("click", () => {
  anamnezPrintWindow("Anamnez Taslağı", preview.dataset.text);
});

document.getElementById("word-btn").addEventListener("click", () => {
  anamnezDownloadWord("anamnez.doc", "Anamnez Taslağı", preview.dataset.text);
});

/* Mobil görünüm geçişi (Sorular / Taslak) */
document.querySelectorAll(".ms-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".ms-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    layout.dataset.mobileView = btn.dataset.view;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

document.getElementById("template-select").addEventListener("change", (e) => {
  savedStates[currentId] = state;                 // mevcut hastalığı sakla
  currentId = e.target.value;
  schema = TEMPLATES[currentId] || TEMPLATES.hipertansiyon;
  if (savedStates[currentId]) state = savedStates[currentId]; // varsa geri yükle
  else initState();
  renderForm();
  generate();
  updateSubtitle();
});

function updateSubtitle() {
  if (subtitle) subtitle.textContent = `${schema.title} — form bazlı taslak`;
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------- Başlat ---------- */
initState();
renderForm();
generate();
updateSubtitle();
