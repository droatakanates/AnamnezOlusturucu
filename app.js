/* =========================================================================
 * Anamnez Oluşturucu — Uygulama mantığı
 * Şemayı forma dönüştürür, durumu tutar, canlı taslak üretir.
 * ====================================================================== */

const TEMPLATES = { hipertansiyon: HIPERTANSIYON_SEMA };

const form = document.getElementById("anamnez-form");
const preview = document.getElementById("preview");
const toast = document.getElementById("toast");

let schema = TEMPLATES.hipertansiyon;
let state = {}; // blockId -> { mode, values:{} } | semptom: { symptomId: {freq, artan} }

/* ---------- Durum başlatma ---------- */
function initState() {
  state = {};
  schema.groups.forEach((g) => {
    g.blocks.forEach((b) => {
      if (b.type === "symptoms") {
        state[b.id] = {};
        b.symptoms.forEach((s) => (state[b.id][s.id] = { freq: "atla", artan: false }));
      } else {
        state[b.id] = { mode: b.default || "skip", values: {} };
      }
    });
  });
}

/* ---------- Form oluşturma ---------- */
function renderForm() {
  form.innerHTML = "";
  schema.groups.forEach((group) => {
    const section = document.createElement("fieldset");
    section.className = "group";
    section.innerHTML = `<legend>${group.title}</legend>`;

    group.blocks.forEach((block) => {
      section.appendChild(
        block.type === "symptoms" ? renderSymptomBlock(block) : renderBlock(block)
      );
    });
    form.appendChild(section);
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
      input.type = f.type === "number" ? "number" : "text";
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

/* ---------- Taslak üretimi ---------- */
function generate() {
  const paragraphs = [];

  schema.groups.forEach((group) => {
    const sentences = [];
    group.blocks.forEach((block) => {
      if (block.type === "symptoms") {
        const txt = buildSymptoms(block.symptoms, state[block.id]);
        if (txt) sentences.push(txt);
      } else {
        const st = state[block.id];
        const mode = block.modes.find((m) => m.key === st.mode);
        if (mode && typeof mode.build === "function") {
          sentences.push(mode.build(st.values));
        }
      }
    });
    if (sentences.length) paragraphs.push(sentences.join(" "));
  });

  if (paragraphs.length === 0) {
    preview.innerHTML =
      '<p class="preview-empty">Soruları yanıtladıkça taslak burada oluşacak.</p>';
    preview.dataset.text = "";
    return;
  }

  preview.innerHTML = paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
  preview.dataset.text = paragraphs.join("\n\n");
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
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
  initState();
  renderForm();
  generate();
  showToast("Form temizlendi.");
});

document.getElementById("template-select").addEventListener("change", (e) => {
  schema = TEMPLATES[e.target.value] || TEMPLATES.hipertansiyon;
  initState();
  renderForm();
  generate();
});

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
