/* =========================================================================
 * ACİL / DAHİLİYE KONSÜLTASYON NOTU ÜRETECİ
 * Kronik anamnez modülünden ayrı sekme. Değişken-tabanlı, koşullu cümle üretimi.
 * + Kronik anamnez entegrasyonu  + otomatik skorlar (qSOFA / SIRS / CURB-65)
 * schema.js yardımcıları kullanılır (buyukHarfBasla, joinVe). IIFE ile izole.
 * ====================================================================== */
(function () {
  "use strict";

  const cap = buyukHarfBasla;
  const joinTr = joinVe;

  /* NOT: Şikayete özgü (ör. dispne) semptom sorgulaması ileride eklenecek. */
  const GENEL_DURUM = ["iyi", "orta", "kötü"];
  const BILINC = ["açık", "kapalı", "stupor", "letarjik"];
  const ORYANTE = ["oryante", "non-oryante"];
  const KOOPERE = ["koopere", "non-koopere"];
  const KATILIM = ["eşit katılıyor", "eşit katılmıyor"];
  const VARYOK = ["yok", "var"];
  const BATIN_GORUNUM = ["olağan görünümde", "distandü", "rahat"];
  const BARSAK = ["hipoaktif", "normoaktif", "hiperaktif"];
  const PTO_OPT = ["-/-", "Eser", "+/+", "++/++", "+++/+++"];
  const CINSIYET = ["Kadın", "Erkek"];
  const SONUC = [
    "dahiliye servisine yatış", "yoğun bakım değerlendirmesi", "acil serviste takip",
    "ilgili branş konsültasyonu", "taburculuk"
  ];
  const LAB = [
    { k: "hb", l: "Hb", u: "g/dL" }, { k: "wbc", l: "WBC", u: "/µL" },
    { k: "plt", l: "Plt", u: "10³/µL" }, { k: "ure", l: "Üre", u: "mg/dL" },
    { k: "kreatinin", l: "Kreatinin", u: "mg/dL" }, { k: "na", l: "Na", u: "mmol/L" },
    { k: "k", l: "K", u: "mmol/L" }, { k: "crp", l: "CRP", u: "mg/L" },
    { k: "ast", l: "AST", u: "U/L" }, { k: "alt", l: "ALT", u: "U/L" },
    { k: "bilirubin", l: "Bilirubin", u: "mg/dL" }, { k: "inr", l: "INR", u: "" },
    { k: "laktat", l: "Laktat", u: "mmol/L" }
  ];
  const VITAL = [
    { k: "ta", l: "Kan Basıncı", u: "mmHg", ph: "120/80" }, { k: "nabiz", l: "Nabız", u: "/dk" },
    { k: "solunum", l: "Solunum Sayısı", u: "/dk" }, { k: "ates", l: "Vücut Sıcaklığı", u: "°C" },
    { k: "spo2", l: "SpO₂", u: "%", pre: true, ph: "92 (oda havasında)" }
  ];

  const s = {
    yas: "", cinsiyet: "", kronikTanilar: "", isteyenBirim: "", konsultasyonNedeni: "",
    kronikAnamnez: "",
    basvuruSikayeti: "", sikayetSuresi: "",
    duzenliIlaclar: "",
    ta: "", nabiz: "", ates: "", spo2: "", solunum: "",
    genelDurum: "", bilinc: "", oryantasyon: "", kooperasyon: "", gks: "",
    akcKatilim: "", akcKatilimNot: "", ral: "", ralLok: "", ronkus: "", ronkusLok: "",
    batinGorunum: "", barsakSes: "", defans: "", defansLok: "", rebound: "", reboundLok: "", hsm: "", pto: "",
    hb: "", wbc: "", plt: "", ure: "", kreatinin: "", na: "", k: "", crp: "",
    ast: "", alt: "", bilirubin: "", inr: "", laktat: "", kanGazi: "",
    skorEkle: false,
    onTani: "", problemler: ["", "", ""], oneriler: ["", "", ""],
    sonuc: "", sonucDetay: ""
  };

  /* ---------------- skorlar ---------------- */
  function num(v) { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; }
  function parseTA(ta) {
    if (!ta) return { sys: null, dia: null };
    const m = String(ta).match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return { sys: +m[1], dia: +m[2] };
    return { sys: num(ta), dia: null };
  }
  // state: true (karşılandı) | false (karşılanmadı) | null (veri yok)
  function computeScores() {
    const { sys, dia } = parseTA(s.ta);
    const resp = num(s.solunum), nabiz = num(s.nabiz), ates = num(s.ates);
    const wbc = num(s.wbc), ure = num(s.ure), yas = num(s.yas);
    const altered = s.bilinc ? s.bilinc !== "açık" : null;

    const scores = [
      {
        key: "qsofa", name: "qSOFA", max: 3,
        crit: [
          ["Sistolik KB ≤ 100 mmHg", sys == null ? null : sys <= 100],
          ["Solunum sayısı ≥ 22/dk", resp == null ? null : resp >= 22],
          ["Bilinç değişikliği (GKS < 15)", altered]
        ],
        yorum: (sc) => sc >= 2
          ? "≥2: sepsiste kötü prognoz göstergesi; yakın izlem/escalation düşünülmeli."
          : "Düşük risk."
      },
      {
        key: "sirs", name: "SIRS", max: 4,
        crit: [
          ["Ateş > 38°C veya < 36°C", ates == null ? null : (ates > 38 || ates < 36)],
          ["Nabız > 90/dk", nabiz == null ? null : nabiz > 90],
          ["Solunum > 20/dk", resp == null ? null : resp > 20],
          ["WBC > 12.000 veya < 4.000 /µL", wbc == null ? null : (wbc > 12000 || wbc < 4000)]
        ],
        yorum: (sc) => sc >= 2 ? "≥2 kriter: SIRS pozitif." : "SIRS kriterleri negatif."
      },
      {
        key: "curb", name: "CURB-65", max: 5,
        crit: [
          ["Konfüzyon", altered],
          ["Üre > 42 mg/dL (≈7 mmol/L)", ure == null ? null : ure > 42],
          ["Solunum ≥ 30/dk", resp == null ? null : resp >= 30],
          ["Sistolik < 90 veya diastolik ≤ 60 mmHg",
            (sys == null && dia == null) ? null : ((sys != null && sys < 90) || (dia != null && dia <= 60))],
          ["Yaş ≥ 65", yas == null ? null : yas >= 65]
        ],
        yorum: (sc) => sc <= 1 ? "0–1: düşük mortalite, ayaktan tedavi düşünülebilir."
          : sc === 2 ? "2: orta risk, kısa süreli yatış/gözlem."
            : "≥3: yüksek risk, hastaneye yatış (4–5 için YBÜ değerlendir)."
      }
    ];

    scores.forEach((sc) => {
      sc.score = sc.crit.filter((c) => c[1] === true).length;
      sc.eksik = sc.crit.filter((c) => c[1] === null).length;
      sc.hasData = sc.crit.some((c) => c[1] !== null);
    });
    return scores;
  }

  /* Türkçe ayrılma hâli eki: HÜTF BAP -> HÜTF BAP'tan */
  function ablatif(w) {
    if (!w) return w;
    const t = String(w).trim();
    const lower = t.toLocaleLowerCase("tr-TR");
    const vowels = "aeıioöuü";
    let lastV = "e";
    for (let i = lower.length - 1; i >= 0; i--) { if (vowels.includes(lower[i])) { lastV = lower[i]; break; } }
    const ekV = "aıou".includes(lastV) ? "a" : "e";
    const sert = "fstkçşhp";
    const d = sert.includes(lower[lower.length - 1]) ? "t" : "d";
    return `${t}'${d}${ekV}n`;
  }

  /* Fizik muayene metni (yapılandırılmış) */
  function fizikText() {
    const L = [];
    const g = [];
    if (s.genelDurum) g.push(`Genel durumu ${s.genelDurum}`);
    if (s.bilinc) g.push(`bilinç ${s.bilinc}`);
    if (s.oryantasyon) g.push(s.oryantasyon);
    if (s.kooperasyon) g.push(s.kooperasyon);
    if (s.gks) g.push(`GKS: ${s.gks}`);
    if (g.length) L.push(cap(g.join(", ")));

    const mv = (v) => v === "var" ? "mevcut" : v === "yok" ? "mevcut değil" : "";
    const ac = [];
    if (s.akcKatilim === "eşit katılıyor") ac.push("Her iki hemitoraks solunuma eşit katılıyor");
    else if (s.akcKatilim === "eşit katılmıyor")
      ac.push("Her iki hemitoraks solunuma eşit katılmıyor" + (s.akcKatilimNot ? ` (${s.akcKatilimNot})` : ""));
    if (s.ral === "yok" && s.ronkus === "yok") ac.push("ral ve ronküs mevcut değil");
    else {
      if (s.ral) ac.push(`ral ${mv(s.ral)}${s.ral === "var" && s.ralLok ? ` (${s.ralLok})` : ""}`);
      if (s.ronkus) ac.push(`ronküs ${mv(s.ronkus)}${s.ronkus === "var" && s.ronkusLok ? ` (${s.ronkusLok})` : ""}`);
    }
    if (ac.length) L.push("Akciğer Muayenesi: " + cap(ac.join(", ")));

    const ba = [];
    if (s.batinGorunum) ba.push(`Batın ${s.batinGorunum}`);
    if (s.barsakSes) ba.push(`barsak sesleri ${s.barsakSes}`);
    const dr = (name, st, lok) => st === "var" ? `${lok ? lok + " " : ""}${name} +` : st === "yok" ? `${name} yok` : "";
    if (s.defans === "yok" && s.rebound === "yok") ba.push("defans ve rebound yok");
    else {
      const d = dr("defans", s.defans, s.defansLok), r = dr("rebound", s.rebound, s.reboundLok);
      if (d) ba.push(d); if (r) ba.push(r);
    }
    if (s.hsm) ba.push(`hepatosplenomegali ${mv(s.hsm)}`);
    if (ba.length) L.push("Batın Muayenesi: " + cap(ba.join(", ")));

    if (s.pto) L.push(`PTÖ: ${s.pto}`);
    return L.join("\n");
  }

  /* ---------------- not üretici (saf) ---------------- */
  function generateNote() {
    const P = [];

    // Künye satırı (68Y/E) + konsültasyon cümlesi
    const cinsKisa = s.cinsiyet === "Erkek" ? "E" : s.cinsiyet === "Kadın" ? "K" : "";
    let header = "";
    if (s.yas && cinsKisa) header = `${s.yas}Y/${cinsKisa}`;
    else if (s.yas) header = `${s.yas}Y`;
    else if (cinsKisa) header = cinsKisa;

    let sent = s.kronikTanilar ? `Bilinen ${s.kronikTanilar} tanıları bulunan hasta` : "Hasta";
    if (s.konsultasyonNedeni) sent += ` ${s.konsultasyonNedeni} nedeniyle`;
    sent += s.isteyenBirim ? ` ${ablatif(s.isteyenBirim)} tarafımıza` : " tarafımıza";
    sent += " konsülte edildi.";
    P.push(header ? `${header}\n${sent}` : sent);

    const p2 = [];
    if (s.basvuruSikayeti) p2.push(`Hasta acil servise ${s.basvuruSikayeti} nedeniyle başvurmuş.`);
    if (s.sikayetSuresi) p2.push(`Şikâyetleri ${s.sikayetSuresi} önce başlamış.`);
    if (p2.length) P.push(p2.join(" "));

    if (s.kronikAnamnez.trim())
      P.push("Bilinen Hastalıklarının Öyküsü:\n" + s.kronikAnamnez.trim());

    // Düzenli kullandığı ilaçlar — alt alta
    const ilacLines = String(s.duzenliIlaclar || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (ilacLines.length) P.push("Düzenli Kullandığı İlaçlar:\n" + ilacLines.join("\n"));

    // Vital bulgular — alt alta (SpO₂ için birim sayıdan önce: %92)
    const vitLines = VITAL.filter((f) => String(s[f.k]).trim() !== "")
      .map((f) => f.pre ? `${f.l}: ${f.u}${s[f.k]}` : `${f.l}: ${s[f.k]}${f.u ? " " + f.u : ""}`);
    if (vitLines.length) P.push("Vital Bulgular:\n" + vitLines.join("\n"));

    // Fizik muayene
    const fz = fizikText();
    if (fz) P.push("Fizik Muayene:\n" + fz);

    // Laboratuvar (atlanabilir — boşsa nota işlenmez)
    const labs = LAB.filter((f) => String(s[f.k]).trim() !== "")
      .map((f) => `${f.l} ${s[f.k]}${f.u ? " " + f.u : ""}`);
    const p4 = [];
    if (labs.length) p4.push(`Laboratuvar Sonuçları: ${labs.join(", ")}.`);
    if (s.kanGazi) p4.push(`Kan gazı: ${s.kanGazi}.`);
    if (p4.length) P.push(p4.join(" "));

    if (s.skorEkle) {
      const lines = computeScores().filter((sc) => sc.hasData).map((sc) =>
        `- ${sc.name}: ${sc.score}/${sc.max}${sc.eksik ? ` (${sc.eksik} kriter veri bekliyor)` : ""} → ${sc.yorum(sc.score)}`);
      if (lines.length) P.push("Hesaplanan skorlar (karar desteği):\n" + lines.join("\n"));
    }

    // Ön tanı (düz) + değerlendirme (1) 2) 3))
    const p5 = [];
    if (s.onTani) p5.push(`Ön Tanı: ${s.onTani}`);
    const probs = s.problemler.filter((x) => x.trim());
    if (probs.length) p5.push("Sorun Listesi:\n" + probs.map((p, i) => `${i + 1}) ${p}`).join("\n"));
    if (p5.length) P.push(p5.join("\n\n"));

    const ons = s.oneriler.filter((x) => x.trim());
    if (ons.length) P.push("Öneriler:\n" + ons.map((o, i) => `${i + 1}) ${o}`).join("\n"));

    if (s.sonuc) {
      const detay = s.sonucDetay ? ` (${s.sonucDetay})` : "";
      P.push(`Sonuç: Hasta mevcut haliyle ${s.sonuc}${detay} açısından uygun görülmüştür.`);
    }
    return P.join("\n\n");
  }

  /* ---------------- DOM ---------------- */
  const noteEl = document.getElementById("acil-note");
  const wcEl = document.getElementById("acil-word-count");
  const PLACEHOLDER = "Soldaki alanları doldurdukça konsültasyon notu burada oluşur.";
  let scoresBody = null;

  function render() {
    const t = generateNote();
    noteEl.textContent = t || PLACEHOLDER;
    noteEl.dataset.text = t;
    const n = t ? t.trim().split(/\s+/).filter(Boolean).length : 0;
    wcEl.textContent = `${n} kelime`;
    if (scoresBody) renderScores();
  }

  function mk(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function label(txt) { const l = mk("p", "block-label"); l.textContent = txt; return l; }

  function textInput(key, ph, area) {
    const inp = mk(area ? "textarea" : "input", "field-input");
    if (!area) inp.type = "text";
    if (ph) inp.placeholder = ph;
    if (area) inp.rows = 2;
    inp.value = s[key];
    inp.addEventListener("input", () => { s[key] = inp.value; render(); });
    return inp;
  }
  function field(t, control) {
    const w = mk("div", "acil-field");
    const l = mk("span", "field-label"); l.textContent = t;
    w.appendChild(l); w.appendChild(control);
    return w;
  }
  function segmented(options, key) {
    const seg = mk("div", "segmented");
    options.forEach((o) => {
      const b = mk("button", "seg-btn"); b.type = "button"; b.textContent = o;
      if (s[key] === o) b.classList.add("active");
      b.addEventListener("click", () => {
        s[key] = s[key] === o ? "" : o;
        seg.querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active"));
        if (s[key]) b.classList.add("active");
        render();
      });
      seg.appendChild(b);
    });
    return seg;
  }
  function card(num, title) {
    const sec = mk("section", "group");
    const head = mk("div", "group-head");
    head.innerHTML = `<span class="group-num">${num}</span><h3>${title}</h3>`;
    const body = mk("div", "group-body");
    sec.appendChild(head); sec.appendChild(body);
    return { sec, body };
  }
  function vitalGrid(list, cls) {
    const g = mk("div", cls);
    list.forEach((f) => {
      const cell = mk("div", "vcell");
      const lab = mk("span", "vlab"); lab.textContent = f.l;
      cell.appendChild(lab);
      const inRow = mk("div", "vin-row");
      if (f.pre && f.u) { const up = mk("span", "vunit"); up.textContent = f.u; inRow.appendChild(up); }
      const inp = mk("input", "vinput"); inp.inputMode = "decimal";
      inp.value = s[f.k]; if (f.ph) inp.placeholder = f.ph;
      inp.addEventListener("input", () => { s[f.k] = inp.value; render(); });
      inRow.appendChild(inp);
      if (!f.pre && f.u) { const u = mk("span", "vunit"); u.textContent = f.u; inRow.appendChild(u); }
      cell.appendChild(inRow);
      g.appendChild(cell);
    });
    return g;
  }
  function toggle(key, textFn) {
    const b = mk("button", "acil-toggle"); b.type = "button";
    const knob = mk("span", "knob");
    const txt = mk("span");
    const sync = () => { b.classList.toggle("on", s[key]); txt.innerHTML = textFn(s[key]); };
    b.appendChild(knob); b.appendChild(txt); sync();
    b.addEventListener("click", () => { s[key] = !s[key]; sync(); render(); });
    return b;
  }
  function list(key, numbered) {
    const wrap = mk("div");
    const rows = mk("div");
    function draw() {
      rows.innerHTML = "";
      s[key].forEach((val, i) => {
        const r = mk("div", "acil-list-row");
        const mrk = mk("span", numbered ? "lnum" : "lbul");
        mrk.textContent = numbered ? i + 1 : "–";
        const inp = mk("input", "field-input"); inp.type = "text"; inp.value = val;
        inp.addEventListener("input", () => { s[key][i] = inp.value; render(); });
        r.appendChild(mrk); r.appendChild(inp);
        if (s[key].length > 1) {
          const del = mk("button", "ldel"); del.type = "button"; del.textContent = "×";
          del.addEventListener("click", () => { s[key].splice(i, 1); draw(); render(); });
          r.appendChild(del);
        }
        rows.appendChild(r);
      });
    }
    draw();
    const add = mk("button", "ladd"); add.type = "button";
    add.textContent = numbered ? "+ problem ekle" : "+ öneri ekle";
    add.addEventListener("click", () => { s[key].push(""); draw(); });
    wrap.appendChild(rows); wrap.appendChild(add);
    return wrap;
  }
  function sonucList() {
    const wrap = mk("div", "sonuc-list");
    SONUC.forEach((o) => {
      const b = mk("button", "sonuc-btn"); b.type = "button"; b.textContent = o;
      if (s.sonuc === o) b.classList.add("on");
      b.addEventListener("click", () => {
        s.sonuc = s.sonuc === o ? "" : o;
        wrap.querySelectorAll(".sonuc-btn").forEach((x) => x.classList.remove("on"));
        if (s.sonuc) b.classList.add("on");
        render();
      });
      wrap.appendChild(b);
    });
    return wrap;
  }
  function row(cls, children) { const r = mk("div", cls); children.forEach((c) => r.appendChild(c)); return r; }

  /* segmented + lokalizasyon metin kutusu (ral, ronküs, defans, rebound) */
  function segLoc(labelText, options, key, lokKey, lokPh) {
    const w = mk("div", "acil-field");
    const l = mk("span", "field-label"); l.textContent = labelText;
    w.appendChild(l);
    w.appendChild(segmented(options, key));
    const lok = mk("input", "field-input"); lok.type = "text";
    lok.placeholder = lokPh || "lokalizasyon (varsa)";
    lok.value = s[lokKey]; lok.style.marginTop = "6px";
    lok.addEventListener("input", () => { s[lokKey] = lok.value; render(); });
    w.appendChild(lok);
    return w;
  }

  /* kronik anamnez aktar */
  function importBox() {
    const wrap = mk("div");
    const btn = mk("button", "btn btn-soft"); btn.type = "button";
    btn.textContent = "↗ Kronik anamnez sekmesinden aktar";
    btn.style.marginBottom = "8px";
    const area = textInput("kronikAnamnez", "Kronik anamnez taslağı buraya aktarılır; elle de düzenleyebilirsiniz.", true);
    area.rows = 4;
    btn.addEventListener("click", () => {
      const prev = document.getElementById("preview");
      const txt = (prev && prev.dataset.text) ? prev.dataset.text : "";
      if (!txt) {
        const o = btn.textContent;
        btn.textContent = "Önce 'Kronik Anamnez' sekmesinde taslak oluşturun";
        setTimeout(() => { btn.textContent = o; }, 2200);
        return;
      }
      s.kronikAnamnez = txt; area.value = txt; render();
    });
    wrap.appendChild(btn); wrap.appendChild(area);
    return wrap;
  }

  /* skor paneli */
  function renderScores() {
    scoresBody.innerHTML = "";
    computeScores().forEach((sc) => {
      const item = mk("div", "score-item");
      const head = mk("div", "score-head");
      const nm = mk("span", "score-name"); nm.textContent = sc.name;
      const badge = mk("span", "score-badge");
      badge.textContent = sc.hasData ? `${sc.score} / ${sc.max}` : "veri yok";
      if (!sc.hasData) badge.classList.add("na");
      else if (sc.key === "qsofa" && sc.score >= 2) badge.classList.add("hi");
      else if (sc.key === "sirs" && sc.score >= 2) badge.classList.add("hi");
      else if (sc.key === "curb" && sc.score >= 3) badge.classList.add("hi");
      head.appendChild(nm); head.appendChild(badge);
      item.appendChild(head);

      const ul = mk("div", "crit-list");
      sc.crit.forEach((c) => {
        const cr = mk("div", "crit");
        const dot = mk("span", "dot " + (c[1] === true ? "met" : c[1] === false ? "no" : "na"));
        const lb = mk("span"); lb.textContent = c[0];
        cr.appendChild(dot); cr.appendChild(lb);
        item.appendChild(ul);
        ul.appendChild(cr);
      });
      if (sc.hasData) {
        const y = mk("p", "score-yorum"); y.textContent = sc.yorum(sc.score);
        item.appendChild(y);
      }
      scoresBody.appendChild(item);
    });
    const dis = mk("p", "score-disclaimer");
    dis.textContent = "Skorlar girilen verilerden otomatik hesaplanır; karar desteği amaçlıdır, klinik değerlendirmenin yerini tutmaz.";
    scoresBody.appendChild(dis);
  }

  /* ---------------- formu kur ---------------- */
  function buildForm() {
    const root = document.getElementById("acil-form");

    let c = card("1", "Konsültasyon künyesi");
    c.body.appendChild(row("acil-row3", [
      field("Yaş", textInput("yas", "örn. 68")),
      field("Cinsiyet", segmented(CINSIYET, "cinsiyet"))
    ]));
    c.body.appendChild(field("Kronik tanılar", textInput("kronikTanilar", "HT, DM, KKY...")));
    c.body.appendChild(row("acil-row2", [
      field("İsteyen birim", textInput("isteyenBirim", "Acil servis")),
      field("Konsültasyon nedeni", textInput("konsultasyonNedeni", "AKI, hiponatremi..."))
    ]));
    root.appendChild(c.sec);

    c = card("2", "Özgeçmiş / kronik anamnez");
    c.body.appendChild(importBox());
    root.appendChild(c.sec);

    c = card("3", "Başvuru");
    c.body.appendChild(row("acil-row2", [
      field("Başvuru şikâyeti", textInput("basvuruSikayeti", "halsizlik")),
      field("Şikâyet süresi", textInput("sikayetSuresi", "3 gün"))
    ]));
    root.appendChild(c.sec);

    c = card("4", "İlaçlar & vital bulgular");
    c.body.appendChild(field("Düzenli kullandığı ilaçlar (her satıra bir ilaç)",
      textInput("duzenliIlaclar", "Metformin 2x1000 mg\nRamipril 1x5 mg", true)));
    c.body.appendChild(label("Vital bulgular"));
    c.body.appendChild(vitalGrid(VITAL, "acil-vitals"));
    root.appendChild(c.sec);

    c = card("5", "Fizik muayene");
    c.body.appendChild(row("acil-row2", [
      field("Genel durum", segmented(GENEL_DURUM, "genelDurum")),
      field("Bilinç", segmented(BILINC, "bilinc"))
    ]));
    c.body.appendChild(row("acil-row3", [
      field("Oryantasyon", segmented(ORYANTE, "oryantasyon")),
      field("Kooperasyon", segmented(KOOPERE, "kooperasyon")),
      field("GKS", textInput("gks", "15"))
    ]));
    c.body.appendChild(label("Akciğer muayenesi"));
    c.body.appendChild(field("Solunuma katılım", segmented(KATILIM, "akcKatilim")));
    c.body.appendChild(field("Katılmıyorsa açıklama", textInput("akcKatilimNot", "ör. sol bazalde azalmış")));
    c.body.appendChild(segLoc("Ral", VARYOK, "ral", "ralLok", "ral lokalizasyonu"));
    c.body.appendChild(segLoc("Ronküs", VARYOK, "ronkus", "ronkusLok", "ronküs lokalizasyonu"));
    c.body.appendChild(label("Batın muayenesi"));
    c.body.appendChild(row("acil-row2", [
      field("Görünüm", segmented(BATIN_GORUNUM, "batinGorunum")),
      field("Barsak sesleri", segmented(BARSAK, "barsakSes"))
    ]));
    c.body.appendChild(segLoc("Defans", VARYOK, "defans", "defansLok", "ör. sağ alt kadranda"));
    c.body.appendChild(segLoc("Rebound", VARYOK, "rebound", "reboundLok", "ör. sağ alt kadranda"));
    c.body.appendChild(row("acil-row2", [
      field("Hepatosplenomegali", segmented(VARYOK, "hsm")),
      field("PTÖ", segmented(PTO_OPT, "pto"))
    ]));
    root.appendChild(c.sec);

    c = card("6", "Laboratuvar (opsiyonel)");
    c.body.appendChild(vitalGrid(LAB, "acil-labs"));
    c.body.appendChild(field("Kan gazı", textInput("kanGazi", "pH 7.32 / pCO₂ 30 / HCO₃ 16")));
    root.appendChild(c.sec);

    c = card("7", "Otomatik skorlar");
    c.body.appendChild(toggle("skorEkle", (v) => `Skorları konsültasyon notuna ekle: <b>${v ? "EVET" : "hayır"}</b>`));
    scoresBody = mk("div", "scores-body");
    c.body.appendChild(scoresBody);
    root.appendChild(c.sec);

    c = card("8", "Ön tanı & sorun listesi");
    c.body.appendChild(field("Ön tanı", textInput("onTani", "HES Evre I / Prerenal ABH")));
    c.body.appendChild(label("Sorun Listesi"));
    c.body.appendChild(list("problemler", true));
    root.appendChild(c.sec);

    c = card("9", "Öneriler & sonuç");
    c.body.appendChild(label("Öneriler"));
    c.body.appendChild(list("oneriler", false));
    c.body.appendChild(label("Sonuç / disposition"));
    c.body.appendChild(sonucList());
    c.body.appendChild(field("Detay (opsiyonel)", textInput("sonucDetay", "örn. gastroenteroloji servisi")));
    root.appendChild(c.sec);
  }

  /* ---------------- eylemler ---------------- */
  function bindActions() {
    const copyBtn = document.getElementById("acil-copy");
    copyBtn.addEventListener("click", async () => {
      const text = noteEl.dataset.text || "";
      if (!text) return;
      try { await navigator.clipboard.writeText(text); }
      catch {
        const ta = document.createElement("textarea"); ta.value = text;
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
      }
      const orig = copyBtn.textContent;
      copyBtn.textContent = "✓ kopyalandı";
      setTimeout(() => { copyBtn.textContent = orig; }, 1600);
    });
    document.getElementById("acil-print").addEventListener("click", () => {
      anamnezPrintWindow("Konsültasyon Notu", noteEl.dataset.text);
    });
    const wbtn = document.getElementById("acil-word");
    if (wbtn) wbtn.addEventListener("click", () => {
      anamnezDownloadWord("konsultasyon.doc", "Konsültasyon Notu", noteEl.dataset.text);
    });
    document.querySelectorAll(".ms-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById("acil-view").dataset.mobileView = btn.dataset.view;
      });
    });
  }

  function bindTabs() {
    const tabs = document.getElementById("mode-tabs");
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const acil = b.dataset.mode === "acil";
      tabs.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      document.querySelector(".toolbar").hidden = acil;
      document.getElementById("layout").hidden = acil;
      document.getElementById("acil-view").hidden = !acil;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  buildForm();
  bindActions();
  bindTabs();
  render();
})();
