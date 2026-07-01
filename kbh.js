/* =========================================================================
 * KRONİK BÖBREK HASTALIĞI (KBH) ANAMNEZİ
 * schema.js yardımcılarına bağlıdır (varYok, varYokDetay, metinBlok, durumBlok,
 * fmtDate, buyukHarfBasla, joinVe ...). + GFR'den otomatik KDIGO evrelemesi.
 * ====================================================================== */

/* GFR (mL/dk/1.73m²) -> KDIGO evresi */
function kdigoEvre(gfrText) {
  const g = parseFloat(String(gfrText).replace(",", "."));
  if (isNaN(g)) return null;
  if (g >= 90) return "G1";
  if (g >= 60) return "G2";
  if (g >= 45) return "G3a";
  if (g >= 30) return "G3b";
  if (g >= 15) return "G4";
  return "G5";
}

const KBH_SEMA = {
  id: "kbh",
  title: "Kronik Böbrek Hastalığı Anamnezi",
  groups: [
    /* ---- 1. Tanı ve Böbrek Fonksiyonu ---- */
    {
      id: "kbh-tani-fonksiyon",
      title: "Tanı ve Böbrek Fonksiyonu",
      blocks: [
        {
          id: "kbh-tani",
          label: "KBH tanısı: zaman ve etyoloji",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2015 yılında / 8 yıl önce" },
                { name: "etyoloji", type: "text", label: "Etyoloji", placeholder: "ör. diyabetik nefropati / hipertansif nefroskleroz" }
              ],
              build: (v) =>
                `${zamanBasla(v.zaman)}` +
                (v.etyoloji ? ` ${v.etyoloji} zemininde` : "") +
                " kronik böbrek hastalığı tanısı almış."
            },
            SKIP
          ]
        },
        {
          id: "kbh-fonksiyon",
          label: "Bazal kreatinin ve GFR (KDIGO otomatik)",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "kreatinin", type: "text", label: "Bazal kreatinin (mg/dL)", placeholder: "ör. 2.4" },
                { name: "gfr", type: "text", label: "GFR (mL/dk/1.73m²)", placeholder: "ör. 28" }
              ],
              build: (v) => {
                const evre = kdigoEvre(v.gfr);
                return `Bazal kreatinin değeri ${v.kreatinin || "…"} mg/dL, GFR ${v.gfr || "…"} mL/dk/1.73m²` +
                  (evre ? ` olup KDIGO sınıflamasına göre evre ${evre} kronik böbrek hastalığı ile uyumludur.`
                        : " olarak ölçülmüş.");
              }
            },
            SKIP
          ]
        },
        {
          id: "kbh-spot",
          label: "Spot idrar proteinüri",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "pk", type: "text", label: "Protein/kreatinin (mg/g)", placeholder: "ör. 1800" },
                { name: "ak", type: "text", label: "Albümin/kreatinin (mg/g)", placeholder: "ör. 1200" }
              ],
              build: (v) =>
                `Son spot idrar tetkikinde protein/kreatinin oranı ${v.pk || "…"} mg/g, ` +
                `albümin/kreatinin oranı ${v.ak || "…"} mg/g olarak ölçülmüş.`
            },
            SKIP
          ]
        },
        {
          id: "kbh-24saat",
          label: "24 saatlik idrar proteinüri",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "protein", type: "text", label: "Protein (mg/gün)", placeholder: "ör. 2400" },
                { name: "albumin", type: "text", label: "Albümin (mg/gün)", placeholder: "ör. 1600" }
              ],
              build: (v) =>
                `24 saatlik idrarda protein ${v.protein || "…"} mg/gün, ` +
                `albümin ${v.albumin || "…"} mg/gün olarak ölçülmüş.`
            },
            SKIP
          ]
        }
      ]
    },

    /* ---- 2. Tedavi ve Görüntüleme ---- */
    {
      id: "kbh-tedavi-goruntuleme",
      title: "Medikal Tedavi ve Görüntüleme",
      blocks: [
        metinBlok("kbh-tedavi", "KBH'a yönelik medikal tedavi", "Tedaviler",
          "ör. ramipril, sodyum bikarbonat, statin, fosfor bağlayıcı",
          (v) => `Kronik böbrek hastalığına yönelik ${v} kullanıyormuş.`),
        {
          id: "kbh-usg",
          label: "Son böbrek ultrasonografisi",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "date", label: "Tarih" },
                { name: "bulgu", type: "text", label: "Bulgu", placeholder: "ör. bilateral grade 2 parankim ekojenite artışı, boyutlar küçülmüş" }
              ],
              build: (v) =>
                `Son böbrek ultrasonografisi ${fmtDate(v.tarih)} tarihinde ${v.bulgu || "…"} olarak raporlanmış.`
            },
            SKIP
          ]
        },
        {
          id: "kbh-bt",
          label: "Son bilgisayarlı tomografi",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "date", label: "Tarih" },
                { name: "bulgu", type: "text", label: "Bulgu", placeholder: "ör. atrofik böbrekler, taş/kitle saptanmadı" }
              ],
              build: (v) =>
                `Son bilgisayarlı tomografi tetkiki ${fmtDate(v.tarih)} tarihinde ${v.bulgu || "…"} olarak raporlanmış.`
            },
            SKIP
          ]
        }
      ]
    },

    /* ---- 3. Komplikasyonlar ---- */
    {
      id: "kbh-komplikasyon",
      title: "Komplikasyonlar",
      blocks: [
        varYok("kbh-abh", "ABH on KBH (zeminde akut böbrek hasarı) öyküsü var mı?",
          "Kronik böbrek hastalığı zemininde akut böbrek hasarı (ABH on KBH) öyküsü mevcut.",
          "Kronik böbrek hastalığı zemininde akut böbrek hasarı öyküsü yok."),
        varYokDetay("kbh-anemi", "KBH anemisine yönelik tedavi öyküsü var mı?",
          [{ name: "detay", type: "text", label: "Tedavi(ler)", placeholder: "ör. eritropoietin 1x haftada, IV demir" }],
          (v) => `KBH anemisine yönelik tedavi öyküsü mevcut (${v.detay || "…"}).`,
          "KBH anemisine yönelik tedavi öyküsü yok."),
        {
          id: "kbh-pth-d",
          label: "Son PTH ve 25-OH vitamin D değerleri",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "pth", type: "text", label: "PTH (pg/mL)", placeholder: "ör. 420" },
                { name: "d", type: "text", label: "25-OH vitamin D (ng/mL)", placeholder: "ör. 14" }
              ],
              build: (v) =>
                `Son bakılan PTH değeri ${v.pth || "…"} pg/mL, ` +
                `25-OH vitamin D değeri ${v.d || "…"} ng/mL olarak ölçülmüş.`
            },
            SKIP
          ]
        },
        varYokDetay("kbh-shpt", "Sekonder hiperparatiroidi öyküsü var mı?",
          [{ name: "tedavi", type: "text", label: "Tedavi (varsa)", placeholder: "ör. sevelamer, kalsitriol, sinakalset" }],
          (v) => `Sekonder hiperparatiroidi mevcut` +
            (v.tedavi ? `; bu nedenle ${v.tedavi} tedavisi alıyormuş.` : "."),
          "Sekonder hiperparatiroidi öyküsü yok.")
      ]
    },

    /* ---- 4. Takip, Diyaliz ve Diyet ---- */
    {
      id: "kbh-takip-diyaliz",
      title: "Takip, Diyaliz ve Diyet",
      blocks: [
        varYokDetay("kbh-nefro-takip", "Nefroloji takibi var mı?",
          [{ name: "yer", type: "text", label: "Takip yeri", placeholder: "ör. … Üniversitesi nefroloji polikliniği" }],
          (v) => `${v.yer || "…"} nefroloji polikliniğinde düzenli takipliymiş.`,
          "Düzenli nefroloji takibi yok."),
        {
          id: "kbh-hd",
          label: "Hemodiyaliz öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                {
                  name: "gunler", type: "multi", label: "Diyaliz günleri",
                  options: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
                }
              ],
              build: (v) => {
                const g = v.gunler || [];
                if (!g.length) return "Hemodiyalize giriyormuş.";
                const gun = g.map((x) => x.toLocaleLowerCase("tr-TR")).join("-");
                return `Haftada ${g.length} gün (${gun}; ${g.length}/7) hemodiyalize giriyormuş.`;
              }
            },
            { key: "no", label: "Yok", build: () => "Hemodiyaliz öyküsü yok." },
            SKIP
          ]
        },
        varYok("kbh-tuzsuz", "Tuzsuz diyet uyumu var mı?",
          "Tuzsuz diyete uyum sağlıyormuş.", "Tuzsuz diyet uyumu yok."),
        varYok("kbh-fosfor-potasyum", "Fosfor ve potasyum kısıtlı diyet uyumu var mı?",
          "Fosfor ve potasyumdan kısıtlı diyete uyum sağlıyormuş.",
          "Fosfor ve potasyum kısıtlı diyet uyumu yok.")
      ]
    },

    /* ---- 5. Nakil ve Biyopsi ---- */
    {
      id: "kbh-nakil-biyopsi",
      title: "Nakil ve Böbrek Biyopsisi",
      blocks: [
        {
          id: "kbh-nakil",
          label: "Böbrek nakli öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "tip", type: "select", label: "Nakil tipi", options: ["canlı vericiden", "kadavradan"] },
                { name: "verici", type: "text", label: "Verici (canlı ise kim)", placeholder: "ör. anne / baba / kardeş / eş" },
                { name: "tarih", type: "date", label: "Nakil tarihi" },
                { name: "merkez", type: "text", label: "Nakil merkezi", placeholder: "ör. … Üniversitesi Hastanesi" },
                { name: "immun", type: "text", label: "İmmünsüpresif ajanlar", placeholder: "ör. takrolimus, mikofenolat mofetil, prednizolon" },
                { name: "duzey", type: "text", label: "Son siklosporin/takrolimus düzeyi", placeholder: "ör. takrolimus 6.5 ng/mL" }
              ],
              build: (v) => {
                const kaynak = v.tip === "kadavradan"
                  ? "kadavra donörden"
                  : `canlı vericiden${v.verici ? ` (${v.verici})` : ""}`;
                let str = `${fmtDate(v.tarih)} tarihinde ${v.merkez || "…"} merkezinde ${kaynak} böbrek nakli olmuş.`;
                if (v.immun) {
                  str += ` Nakil sonrası immünsüpresif olarak ${v.immun} kullanıyormuş`;
                  str += v.duzey ? `; son ${v.duzey} ölçülmüş.` : ".";
                } else if (v.duzey) {
                  str += ` Son immünsüpresif düzeyi: ${v.duzey}.`;
                }
                return str;
              }
            },
            { key: "no", label: "Yok", build: () => "Böbrek nakli öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "kbh-biyopsi",
          label: "Böbrek biyopsisi öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "tarih", type: "date", label: "Biyopsi tarihi" },
                { name: "merkez", type: "text", label: "Merkez", placeholder: "ör. … Hastanesi" },
                { name: "sonuc", type: "text", label: "Sonuç (elle girilecek)", placeholder: "patoloji sonucunu buraya yazın" }
              ],
              build: (v) =>
                `${fmtDate(v.tarih)} tarihinde ${v.merkez || "…"} merkezinde böbrek biyopsisi yapılmış` +
                (v.sonuc ? `; sonucu ${v.sonuc} olarak raporlanmış.` : " (sonuç: …).")
            },
            { key: "no", label: "Yok", build: () => "Böbrek biyopsisi öyküsü yok." },
            SKIP
          ]
        }
      ]
    }
  ]
};
