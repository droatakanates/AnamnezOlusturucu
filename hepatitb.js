/* =========================================================================
 * KRONİK HEPATİT B ANAMNEZİ
 * schema.js yardımcıları: zamanIfade, buyukHarfBasla, joinVe, secimBlok,
 * varYokDetay, metinBlok, durumBlok, SKIP.
 * ====================================================================== */

/* HBV seroloji panel alanları (tanı anı ve son bakılan için ortak) */
const HBV_SERO = [
  { name: "hbsag", label: "HBsAg", ph: "pozitif / negatif" },
  { name: "hbeag", label: "HBeAg", ph: "pozitif / negatif" },
  { name: "antihbe", label: "Anti-HBe", ph: "pozitif / negatif" },
  { name: "antihbcigm", label: "Anti-HBc IgM", ph: "pozitif / negatif" },
  { name: "antihbs", label: "Anti-HBs", ph: "pozitif / negatif" },
  { name: "hbvdna", label: "HBV DNA", ph: "ör. 2000 IU/mL" },
  { name: "alt", label: "ALT", ph: "ör. 45 U/L" }
];
function hbvSeroInputs() {
  return HBV_SERO.map((f) => ({ name: f.name, type: "text", label: f.label, placeholder: f.ph }));
}
function hbvSeroList(v) {
  return HBV_SERO.filter((f) => v[f.name] && String(v[f.name]).trim() !== "")
    .map((f) => `${f.label} ${v[f.name]}`);
}

const HEPATIT_B_SEMA = {
  id: "hepatit-b",
  title: "Kronik Hepatit B Anamnezi",
  groups: [
    /* ===== 1. Tanı, Seroloji ve Takip ===== */
    {
      id: "hbv-tani-grup",
      title: "Tanı, Seroloji ve Takip",
      blocks: [
        {
          id: "hbv-tani", label: "Tanı zamanı", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [{ name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2016 yılında / 8 yıl önce" }],
              build: (v) => `Hasta kronik hepatit B tanısını ${zamanIfade(v.zaman)} almış.`
            },
            SKIP
          ]
        },
        durumBlok("hbv-tani-sero", "Tanı anındaki seroloji", [
          {
            key: "var", label: "Değerleri gir",
            fields: [{ name: "tarih", type: "text", label: "Tarih (ay/yıl)", placeholder: "ör. 05/2016" }].concat(hbvSeroInputs()),
            build: (v) => {
              const L = hbvSeroList(v);
              return L.length
                ? `Tanı anında (${v.tarih || "…"}) bakılan serolojide ${L.join(", ")} olarak saptanmış.`
                : "Tanı anındaki seroloji değerleri girilmemiş.";
            }
          },
          { key: "yok", label: "Ulaşılamadı", build: () => "Tanı aldığı zamanki serolojisine ulaşılamadı." }
        ]),
        metinBlok("hbv-takip", "Takip merkezi", "Merkez", "ör. Hacettepe Üniversitesi Hastanesi",
          (v) => `Hasta ${v} takibindeymiş.`),
        metinBlok("hbv-ilac", "Düzenli kullandığı antiviral", "İlaç", "ör. tenofovir 245 mg 1x1",
          (v) => `Düzenli olarak ${v} kullanıyormuş.`),
        {
          id: "hbv-gecmis-ilac", label: "Geçmiş ilaç kullanım öyküsü (opsiyonel — boş parantez bırakılabilir)", default: "fill",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [{ name: "v", type: "text", label: "Geçmiş ilaçlar", placeholder: "(boş bırakılabilir)" }],
              build: (v) => `Geçmiş antiviral/ilaç kullanım öyküsü: (${v.v && v.v.trim() ? v.v.trim() : " "})`
            },
            SKIP
          ]
        },
        {
          id: "hbv-son-sero", label: "Son bakılan hepatit serolojisi", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [{ name: "tarih", type: "text", label: "Tarih (ay/yıl)", placeholder: "ör. 04/2026" }].concat(hbvSeroInputs()),
              build: (v) => {
                const L = hbvSeroList(v);
                return L.length
                  ? `Son bakılan hepatit serolojisinde (${v.tarih || "…"}) ${L.join(", ")} olarak saptanmış.`
                  : "Son hepatit serolojisi değerleri girilmemiş.";
              }
            },
            SKIP
          ]
        }
      ]
    },

    /* ===== 2. Bulaş Yolu ve Soygeçmiş ===== */
    {
      id: "hbv-bulas-grup",
      title: "Bulaş Yolu ve Soygeçmiş",
      blocks: [
        secimBlok("hbv-bulas", "HBV bulaş yolu",
          ["prenatal/doğum yoluyla", "şüpheli cinsel ilişki yoluyla", "transfüzyon yoluyla",
            "intravenöz ilaç kullanımı yoluyla", "Diğer"],
          (v) => `Hastaya HBV bulaşının ${v} olduğu değerlendirildi.`, "Bulaş yolu"),
        varYokDetay("hbv-aile-hbv", "Ailede / akrabalarda HBV öyküsü var mı?",
          [{ name: "detay", type: "text", label: "Açıklama", placeholder: "ör. annesinde kronik HBV" }],
          (v) => `Soygeçmişinde ailede HBV öyküsü mevcut${v.detay ? ` (${v.detay} olduğu değerlendirildi)` : ""}.`,
          "Soygeçmişinde ailede HBV öyküsü yok."),
        varYokDetay("hbv-aile-siroz", "Ailede siroz öyküsü var mı?",
          [{ name: "detay", type: "text", label: "Açıklama", placeholder: "ör. babasında siroz" }],
          (v) => `Ailede siroz öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Ailede siroz öyküsü yok."),
        varYokDetay("hbv-aile-hcc", "Ailede karaciğer kanseri öyküsü var mı?",
          [{ name: "detay", type: "text", label: "Açıklama", placeholder: "ör. amcasında HCC" }],
          (v) => `Ailede karaciğer kanseri (HCC) öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Ailede karaciğer kanseri öyküsü yok.")
      ]
    },

    /* ===== 3. Siroz ve Dekompansasyon ===== */
    {
      id: "hbv-siroz-grup",
      title: "Siroz ve Dekompansasyon",
      blocks: [
        varYokDetay("hbv-siroz", "Siroz öyküsü var mı?",
          [
            { name: "childpugh", type: "select", label: "Child-Pugh", options: ["A", "B", "C", "bilinmiyor"] },
            { name: "detay", type: "text", label: "Detay (opsiyonel)", placeholder: "ör. HBV'ye bağlı, 2021 tanı" }
          ],
          (v) => `Siroz öyküsü mevcut` +
            (v.childpugh || v.detay
              ? ` (${[v.childpugh ? `Child-Pugh ${v.childpugh}` : "", v.detay].filter(Boolean).join(", ")})`
              : "") + ".",
          "Siroz öyküsü yok."),
        varYokDetay("hbv-dekomp", "Dekompanzasyon öyküsü var mı?",
          [{
            name: "tur", type: "multi", label: "Dekompanzasyon bulguları",
            options: ["asit", "hepatik ensefalopati", "varis kanaması", "spontan bakteriyel peritonit", "sarılık"]
          }],
          (v) => `Dekompanzasyon öyküsü mevcut${v.tur && v.tur.length ? ` (${joinVe(v.tur)})` : ""}.`,
          "Dekompanzasyon öyküsü yok.")
      ]
    },

    /* ===== 4. HCC Taraması ===== */
    {
      id: "hbv-hcc-grup",
      title: "HCC Taraması",
      blocks: [
        varYokDetay("hbv-hcc", "HCC açısından taranma öyküsü var mı?",
          [
            { name: "afpTarih", type: "text", label: "Son AFP tarihi", placeholder: "ör. 03/2025" },
            { name: "afpSonuc", type: "text", label: "AFP sonucu", placeholder: "ör. 4 ng/mL" },
            { name: "goruntuleme", type: "select", label: "Görüntüleme çeşidi", options: ["USG", "BT", "MR", "diğer"] },
            { name: "gorTarih", type: "text", label: "Görüntüleme tarihi", placeholder: "ör. 03/2025" },
            { name: "gorSonuc", type: "text", label: "Görüntüleme sonucu (yapıştırılacak)", placeholder: "(buraya yapıştırılacak)" },
            { name: "sonTarama", type: "text", label: "Son tarama tarihi", placeholder: "ör. 03/2025" }
          ],
          (v) => {
            const b = [];
            if (v.afpTarih || v.afpSonuc) b.push(`son AFP ${v.afpTarih || "…"}: ${v.afpSonuc || "…"}`);
            if (v.goruntuleme || v.gorTarih || v.gorSonuc)
              b.push(`${v.goruntuleme || "görüntüleme"} (${v.gorTarih || "…"}): ${v.gorSonuc || "…"}`);
            if (v.sonTarama) b.push(`son tarama ${v.sonTarama}`);
            return "HCC açısından taranıyormuş" + (b.length ? ` (${b.join("; ")})` : "") + ".";
          },
          "HCC açısından taranma öyküsü yok.")
      ]
    },

    /* ===== 5. İmmünsüpresyon ===== */
    {
      id: "hbv-immun-grup",
      title: "İmmünsüpresyon",
      blocks: [
        varYokDetay("hbv-immun", "İmmünsüpresyon öyküsü var mı?",
          [{ name: "tedavi", type: "text", label: "Aldığı medikal tedavi", placeholder: "ör. kemoterapi, rituksimab, uzun süreli steroid" }],
          (v) => `İmmünsüpresyon öyküsü mevcut${v.tedavi ? ` (${v.tedavi})` : ""}.`,
          "İmmünsüpresyon öyküsü yok.")
      ]
    },

    /* ===== 6. Risk Faktörleri ===== */
    {
      id: "hbv-risk-grup",
      title: "Risk Faktörleri",
      blocks: [
        {
          id: "hbv-risk-kod", type: "symptom-code", noteHeader: "Risk faktörleri —",
          label: "Her risk faktörünü kodlayın (bilgi yoksa 'Sorgulanmalı' kalır)",
          symptoms: [
            { id: "transfuzyon", label: "Kan transfüzyonu öyküsü" },
            { id: "hemodiyaliz", label: "Hemodiyaliz öyküsü" },
            { id: "cerrahi", label: "Cerrahi öyküsü" },
            { id: "dovme", label: "Dövme" },
            { id: "piercing", label: "Piercing" },
            { id: "jilet", label: "Ortak jilet kullanımı" },
            { id: "dis-fircasi", label: "Ortak diş fırçası kullanımı" },
            { id: "iv-ilac", label: "İntravenöz ilaç kullanımı" },
            { id: "cinsel", label: "Riskli cinsel temas" }
          ]
        },
        varYokDetay("hbv-igne", "Şüpheli iğne batması var mı?",
          [{ name: "saglik", type: "select", label: "Sağlık çalışanı mı?", options: ["sağlık çalışanı", "sağlık çalışanı değil"] }],
          (v) => `Şüpheli iğne batması öyküsü mevcut (${v.saglik || "…"}).`,
          "Şüpheli iğne batması öyküsü yok.")
      ]
    }
  ]
};
