/* =========================================================================
 * SİROZ / KRONİK KARACİĞER HASTALIĞI ANAMNEZİ
 * schema.js yardımcıları + otomatik Child-Pugh ve MELD/MELD-Na hesaplaması.
 * ====================================================================== */

function sirozNum(v) { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; }

/* Child-Pugh: bilirubin, albümin, INR, asit, ensefalopati -> {score, cls} | null */
function childPugh(v) {
  const bil = sirozNum(v.bil), alb = sirozNum(v.alb), inr = sirozNum(v.inr);
  if (bil == null || alb == null || inr == null || !v.asit || !v.ensf) return null;
  const pBil = bil < 2 ? 1 : bil <= 3 ? 2 : 3;
  const pAlb = alb > 3.5 ? 1 : alb >= 2.8 ? 2 : 3;
  const pInr = inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3;
  const pAsit = v.asit === "yok" ? 1 : v.asit === "hafif/kontrollü" ? 2 : 3;
  const pEnsf = v.ensf === "yok" ? 1 : v.ensf === "evre 1-2" ? 2 : 3;
  const score = pBil + pAlb + pInr + pAsit + pEnsf;
  const cls = score <= 6 ? "A" : score <= 9 ? "B" : "C";
  return { score, cls };
}

/* MELD ve MELD-Na: bilirubin, INR, kreatinin (+ sodyum) -> {meld, na} | null */
function meldScore(v) {
  let bil = sirozNum(v.bil), inr = sirozNum(v.inr), cr = sirozNum(v.kreatinin);
  if (bil == null || inr == null || cr == null) return null;
  bil = Math.max(bil, 1); inr = Math.max(inr, 1);
  cr = Math.min(Math.max(cr, 1), 4);
  const meld = Math.round(3.78 * Math.log(bil) + 11.2 * Math.log(inr) + 9.57 * Math.log(cr) + 6.43);
  let na = null;
  const sod = sirozNum(v.sodyum);
  if (sod != null) {
    const Na = Math.min(Math.max(sod, 125), 137);
    na = Math.round(meld + 1.32 * (137 - Na) - 0.033 * meld * (137 - Na));
  }
  return { meld, na };
}

/* Dekompansasyon alt başlığı için semptom-kod bloğu üreticisi */
function dekompGrup(id, title, symptoms) {
  return {
    id, title,
    blocks: [{ id: id + "-kod", type: "symptom-code", noteHeader: title + " —",
      label: "Her bulguyu kodlayın (bilgi yoksa 'Sorgulanmalı' kalır)", symptoms }]
  };
}

const SIROZ_SEMA = {
  id: "siroz",
  title: "Siroz / Kronik Karaciğer Hastalığı Anamnezi",
  groups: [
    /* ---- 1. Başvuru ve Siroz Öyküsü ---- */
    {
      id: "sir-oyku",
      title: "Başvuru ve Siroz Öyküsü",
      blocks: [
        metinBlok("sir-basvuru", "Başvuru nedeni", "Başvuru nedeni",
          "ör. karında şişlik ve bilinç bulanıklığı", (v) => `Hasta ${v} ile başvurmuş.`),
        {
          id: "sir-tani",
          label: "Tanı zamanı ve nasıl konduğu",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2019 yılında / 4 yıl önce" },
                { name: "nasil", type: "text", label: "Nasıl konduğu", placeholder: "ör. dekompansasyon (asit) ile / insidental görüntülemede" }
              ],
              build: (v) =>
                `${buyukHarfBasla(v.zaman || "…")}` + (v.nasil ? ` ${v.nasil}` : "") +
                " kronik karaciğer hastalığı / siroz tanısı almış."
            },
            SKIP
          ]
        },
        varYokDetay("sir-takip-onceki", "Önceki düzenli takip var mı?",
          [{ name: "yer", type: "text", label: "Takip yeri", placeholder: "ör. … gastroenteroloji polikliniği" }],
          (v) => `Tanıdan bu yana ${v.yer || "…"} takibindeymiş.`,
          "Düzenli takibi olmamış / net öğrenilemedi."),
        {
          id: "sir-skor",
          label: "Child-Pugh / MELD (otomatik hesaplama)",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "bil", type: "text", label: "Total bilirubin (mg/dL)", placeholder: "ör. 3.2" },
                { name: "alb", type: "text", label: "Albümin (g/dL)", placeholder: "ör. 2.6" },
                { name: "inr", type: "text", label: "INR", placeholder: "ör. 1.8" },
                { name: "kreatinin", type: "text", label: "Kreatinin (mg/dL)", placeholder: "ör. 1.3" },
                { name: "sodyum", type: "text", label: "Sodyum (mmol/L)", placeholder: "ör. 131" },
                { name: "asit", type: "select", label: "Asit", options: ["yok", "hafif/kontrollü", "orta-şiddetli"] },
                { name: "ensf", type: "select", label: "Ensefalopati", options: ["yok", "evre 1-2", "evre 3-4"] }
              ],
              build: (v) => {
                const parts = [];
                const cp = childPugh(v);
                if (cp) parts.push(`Child-Pugh skoru ${cp.score} puan (sınıf ${cp.cls})`);
                const m = meldScore(v);
                if (m) parts.push(`MELD ${m.meld}${m.na != null ? `, MELD-Na ${m.na}` : ""}`);
                return parts.length
                  ? "Hesaplanan " + parts.join("; ") + " olarak değerlendirilmiştir."
                  : "Child-Pugh/MELD hesaplaması için bilirubin, albümin, INR, kreatinin, sodyum ve asit/ensefalopati derecesi sorgulanmalı.";
              }
            },
            SKIP
          ]
        },
        metinBlok("sir-yatis", "Önceki yatış ve dekompansasyon öyküsü", "Öykü",
          "ör. 2023'te asit ve HE nedeniyle iki kez yatış",
          (v) => `Önceki yatış ve dekompansasyon öyküsünde ${v} mevcut.`)
      ]
    },

    /* ---- 2. Etiyoloji ---- */
    {
      id: "sir-etiyoloji",
      title: "Etiyolojiye Yönelik Değerlendirme",
      blocks: [
        secimBlok("sir-etiyoloji-sec", "Düşünülen / bilinen etiyoloji",
          ["viral hepatit (HBV/HCV)", "alkol ilişkili karaciğer hastalığı",
            "metabolik disfonksiyon ilişkili steatotik karaciğer hastalığı (MASLD)",
            "otoimmün hepatit", "primer biliyer kolanjit", "primer sklerozan kolanjit",
            "Wilson hastalığı", "hemokromatozis", "ilaç/toksin ilişkili",
            "nedeni bilinmeyen (kriptojenik)", "Diğer"],
          (v) => `Etiyolojik açıdan mevcut bilgilerle ${v} ön planda değerlendirilmektedir.`, "Etiyoloji"),
        metinBlok("sir-etiyoloji-destek", "Etiyolojiyi destekleyen öykü/bulgular", "Açıklama",
          "ör. uzun süreli alkol kullanımı, HBsAg pozitifliği",
          (v) => `Bu değerlendirmeyi destekleyen öyküde ${v} mevcut.`)
      ]
    },

    /* ---- 3. Laboratuvar, Görüntüleme, Endoskopi ---- */
    {
      id: "sir-tetkik",
      title: "Laboratuvar, Görüntüleme ve Endoskopi",
      blocks: [
        {
          id: "sir-lab",
          label: "Son karaciğer/böbrek paneli",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "date", label: "Tarih" },
                { name: "ast", type: "text", label: "AST" }, { name: "alt", type: "text", label: "ALT" },
                { name: "alp", type: "text", label: "ALP" }, { name: "ggt", type: "text", label: "GGT" },
                { name: "tbil", type: "text", label: "Total bilirubin" }, { name: "dbil", type: "text", label: "Direkt bilirubin" },
                { name: "alb", type: "text", label: "Albümin" }, { name: "inr", type: "text", label: "INR" },
                { name: "plt", type: "text", label: "Trombosit" }, { name: "kre", type: "text", label: "Kreatinin" },
                { name: "na", type: "text", label: "Sodyum" }
              ],
              build: (v) => {
                const L = [
                  ["AST", v.ast], ["ALT", v.alt], ["ALP", v.alp], ["GGT", v.ggt],
                  ["total bilirubin", v.tbil], ["direkt bilirubin", v.dbil], ["albümin", v.alb],
                  ["INR", v.inr], ["trombosit", v.plt], ["kreatinin", v.kre], ["sodyum", v.na]
                ].filter((x) => x[1] != null && String(x[1]).trim() !== "").map((x) => `${x[0]} ${x[1]}`);
                return L.length
                  ? `${fmtDate(v.tarih)} tarihli tetkiklerde ${L.join(", ")} olarak saptanmış.`
                  : "Önceki laboratuvar bilgisi net öğrenilemedi.";
              }
            },
            SKIP
          ]
        },
        metinBlok("sir-etiyo-tetkik", "Etiyoloji tetkikleri", "Tetkikler",
          "ör. HBsAg/anti-HCV, ANA/AMA, ferritin/transferrin satürasyonu, seruloplazmin",
          (v) => `Etiyolojiye yönelik tetkiklerde ${v} değerlendirilmiş.`),
        metinBlok("sir-goruntuleme", "Görüntüleme (USG/Doppler/BT-MR/elastografi)", "Bulgular",
          "ör. batın USG'de nodüler karaciğer, splenomegali, portal ven açık; elastografi F4",
          (v) => `Görüntülemede ${v} saptanmış.`),
        varYokDetay("sir-endoskopi", "Endoskopi / varis taraması yapıldı mı?",
          [
            { name: "tarih", type: "text", label: "Son endoskopi tarihi", placeholder: "ör. Mart 2025" },
            { name: "varis", type: "text", label: "Varis durumu", placeholder: "ör. grade 2 özofagus varisi, kırmızı işaret yok" }
          ],
          (v) => `Son üst GİS endoskopisi ${v.tarih || "…"} tarihinde yapılmış; ${v.varis || "…"} saptanmış.`,
          "Endoskopi/varis bilgisi net öğrenilemedi.", "Yapıldı", "Yapılmadı"),
        varYokDetay("sir-hcc", "HCC taraması yapılıyor mu?",
          [{ name: "detay", type: "text", label: "Son USG/AFP", placeholder: "ör. son USG ve AFP Şubat 2025, normal" }],
          (v) => `HCC taraması yapılıyormuş (${v.detay || "…"}).`,
          "HCC tarama bilgisi net öğrenilemedi.")
      ]
    },

    /* ---- 4. Dekompanse Siroz Bulguları (alt başlıklı kodlama) ---- */
    dekompGrup("sir-asit", "Asit / sıvı retansiyonu", [
      { id: "karin-sislik", label: "Karında şişlik" },
      { id: "bacak-odem", label: "Bacaklarda ödem" },
      { id: "hizli-kilo", label: "Hızlı kilo artışı" },
      { id: "parasentez", label: "Parasentez öyküsü" },
      { id: "sbp", label: "Daha önce spontan bakteriyel peritonit öyküsü" }
    ]),
    dekompGrup("sir-gis", "Varis kanaması / GİS kanama", [
      { id: "hematemez", label: "Hematemez" },
      { id: "melena", label: "Melena" },
      { id: "rektal", label: "Rektal kanama" },
      { id: "varis-kanama", label: "Daha önce özofagus/gastrik varis kanaması" },
      { id: "ligasyon", label: "Endoskopik bant ligasyonu/skleroterapi öyküsü" },
      { id: "transfuzyon", label: "Kan transfüzyonu öyküsü" }
    ]),
    dekompGrup("sir-he", "Hepatik ensefalopati", [
      { id: "uyku", label: "Uyku-uyanıklık döngüsünde bozulma" },
      { id: "bilinc", label: "Bilinç bulanıklığı" },
      { id: "unutkanlik", label: "Unutkanlık / dikkat bozukluğu" },
      { id: "kisilik", label: "Kişilik veya davranış değişikliği" },
      { id: "asteriksis", label: "Asteriksis öyküsü" },
      { id: "laktuloz", label: "Laktüloz/rifaksimin kullanımı" }
    ]),
    dekompGrup("sir-sarilik", "Sarılık / kolestaz", [
      { id: "sararma", label: "Gözlerde veya ciltte sararma" },
      { id: "kasinti", label: "Kaşıntı" },
      { id: "koyu-idrar", label: "Koyu renkli idrar" },
      { id: "acik-diski", label: "Açık renkli dışkı" }
    ]),
    dekompGrup("sir-enf-renal", "Enfeksiyon ve renal kötüleşme", [
      { id: "ates", label: "Ateş" },
      { id: "karin-agri", label: "Karın ağrısı" },
      { id: "idrar-azalma", label: "İdrar miktarında azalma" },
      { id: "kreatinin-artis", label: "Son dönemde kreatinin artışı" },
      { id: "hipotansiyon", label: "Hipotansiyon / sıvı kaybı" }
    ]),

    /* ---- 5. Genel Siroz Semptomları ---- */
    {
      id: "sir-genel",
      title: "Genel Siroz Semptomları ve Komplikasyonlar",
      blocks: [
        {
          id: "sir-genel-kod",
          type: "symptom-code",
          label: "Her semptomu kodlayın (bilgi yoksa 'Sorgulanmalı' kalır)",
          symptoms: [
            { id: "halsizlik", label: "Halsizlik" },
            { id: "istahsizlik", label: "İştahsızlık" },
            { id: "kilo-kaybi", label: "Kilo kaybı" },
            { id: "sarkopeni", label: "Kas kaybı / sarkopeni" },
            { id: "bulanti", label: "Bulantı-kusma" },
            { id: "morarma", label: "Kolay morarma" },
            { id: "kanama", label: "Burun/diş eti kanaması" },
            { id: "libido", label: "Libido azalması" },
            { id: "jinekomasti", label: "Jinekomasti" },
            { id: "kramp", label: "Kas krampları" },
            { id: "uyku-boz", label: "Uyku bozukluğu" },
            { id: "malnutrisyon", label: "Malnütrisyon bulguları" }
          ]
        }
      ]
    },

    /* ---- 6. Tedavi ve İlaç Kullanımı ---- */
    {
      id: "sir-tedavi",
      title: "Tedavi ve İlaç Kullanımı",
      blocks: [
        checklistCustom("sir-ilac", "Kullandığı tedaviler",
          ["diüretik", "non-selektif beta bloker", "laktüloz", "rifaksimin", "antiviral tedavi",
            "ursodeoksikolik asit", "albümin", "PPI", "antibiyotik profilaksisi", "demir/vitamin desteği"],
          "kullanıyor", "kullanmıyor"),
        metinBlok("sir-ilac-detay", "Doz / detay", "Detay",
          "ör. spironolakton 100 mg + furosemid 40 mg, propranolol 20 mg 2x1",
          (v) => `Tedavi detayında ${v} mevcut.`),
        secimBlok("sir-uyum", "İlaç uyumu", ["iyi", "orta", "kötü", "net öğrenilemedi"],
          (v) => `İlaç uyumu ${v} olarak değerlendirilmiş.`, "Uyum"),
        metinBlok("sir-tedavi-not", "Doz değişikliği / yan etki / erişim", "Not",
          "ör. yüksek doz diüretikle AKI öyküsü; ilaca erişim sorunu yok",
          (v) => `Tedavi sürecinde ${v} belirtilmiş.`)
      ]
    },

    /* ---- 7. Risk Faktörleri ve Maruziyetler ---- */
    {
      id: "sir-risk",
      title: "Risk Faktörleri ve Maruziyetler",
      blocks: [
        varYokDetay("sir-alkol", "Alkol kullanımı var mı?",
          [{ name: "detay", type: "text", label: "Miktar / süre / bırakma", placeholder: "ör. 20 yıl günde 1 şişe şarap, 2 yıl önce bırakmış" }],
          (v) => `Alkol kullanım öyküsü mevcut (${v.detay || "…"}).`,
          "Alkol kullanım öyküsü yok / tariflenmiyor."),
        checklistVarYok("sir-risk-cluster", "Diğer risk faktörleri / maruziyetler",
          ["kan transfüzyonu öyküsü", "cerrahi/girişim öyküsü", "IV ilaç kullanımı",
            "dövme/piercing", "korunmasız cinsel temas", "ailede karaciğer hastalığı",
            "obezite", "diyabet", "dislipidemi", "metabolik sendrom",
            "hepatotoksik ilaç/bitkisel ürün", "toksin maruziyeti"])
      ]
    },

    /* ---- 8. Takip, Tarama ve Özel Durumlar ---- */
    {
      id: "sir-takip",
      title: "Takip, Tarama ve Özel Durumlar",
      blocks: [
        varYok("sir-varis-prof", "Varis profilaksisi var mı?",
          "Varis profilaksisi (NSBB ve/veya bant ligasyonu) uygulanıyormuş.",
          "Varis profilaksisi uygulanmıyor / net öğrenilemedi."),
        metinBlok("sir-asilama", "Aşılama durumu", "Aşılar",
          "ör. HAV ve HBV aşılı, pnömokok ve influenza yapılmış",
          (v) => `Aşılama durumunda ${v} mevcut.`),
        varYokDetay("sir-transplant", "Transplantasyon değerlendirmesi var mı?",
          [{ name: "detay", type: "text", label: "Durum", placeholder: "ör. nakil listesinde / değerlendirme aşamasında" }],
          (v) => `Karaciğer nakli açısından değerlendirilmiş (${v.detay || "…"}).`,
          "Transplantasyon değerlendirmesi yapılmamış / net öğrenilemedi."),
        varYok("sir-diyet", "Diyet / tuz kısıtlaması var mı?",
          "Tuz kısıtlı diyete uyum sağlıyormuş.", "Diyet/tuz kısıtlaması bilgisi net öğrenilemedi."),
        secimBlok("sir-alkol-birakma", "Alkol bırakma durumu",
          ["hiç kullanmamış", "aktif kullanıyor", "bırakmış", "azaltmış", "net öğrenilemedi"],
          (v) => `Alkol açısından ${v} durumda.`, "Durum"),
        varYokDetay("sir-hepatoloji", "Hepatoloji/gastroenteroloji takibi var mı?",
          [{ name: "yer", type: "text", label: "Takip yeri", placeholder: "ör. … Üniversitesi hepatoloji" }],
          (v) => `${v.yer || "…"} hepatoloji/gastroenteroloji bölümünde takipliymiş.`,
          "Düzenli hepatoloji/gastroenteroloji takibi yok / net öğrenilemedi.")
      ]
    },

    /* ---- 9. Eşlik Eden Hastalıklar ---- */
    {
      id: "sir-komorbid",
      title: "Eşlik Eden Hastalıklar ve Klinik Önemi",
      blocks: [
        checklistVarYok("sir-komorbid-cluster", "Eşlik eden hastalıklar",
          ["kronik böbrek hastalığı", "diyabet", "hipertansiyon", "koroner arter hastalığı",
            "kalp yetmezliği", "aktif/geçirilmiş enfeksiyon", "malignite", "tromboz öyküsü"]),
        varYokDetay("sir-antikoag", "Antikoagülan / antiagregan kullanımı var mı?",
          [{ name: "detay", type: "text", label: "İlaç", placeholder: "ör. portal ven trombozu nedeniyle enoksaparin" }],
          (v) => `Antikoagülan/antiagregan kullanımı mevcut (${v.detay || "…"}).`,
          "Antikoagülan/antiagregan kullanımı yok."),
        metinBlok("sir-komorbid-not", "Klinik önem / not", "Not",
          "ör. KBH nedeniyle diüretik ve kontrast dikkatli kullanılmalı",
          (v) => `Eşlik eden hastalıkların siroz yönetimi açısından önemi: ${v}.`)
      ]
    }
  ]
};
