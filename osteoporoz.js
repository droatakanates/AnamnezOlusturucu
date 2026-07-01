/* =========================================================================
 * OSTEOPOROZ ANAMNEZİ
 * schema.js yardımcıları: zamanIfade, varYok, varYokDetay, metinBlok,
 * durumBlok, SKIP.
 * ====================================================================== */
const OSTEOPOROZ_SEMA = {
  id: "osteoporoz",
  title: "Osteoporoz Anamnezi",
  groups: [
    /* ===== 1. Tanı ve Klinik ===== */
    {
      id: "osteo-tani-grup",
      title: "Tanı ve Klinik",
      blocks: [
        {
          id: "osteo-tani", label: "Tanı zamanı ve tanı anı KMD", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2019 yılında / 5 yıl önce" },
                { name: "kmdTarih", type: "text", label: "Tanı anı KMD tarihi", placeholder: "ör. 2019" },
                { name: "kmdSonuc", type: "text", label: "KMD sonucu (manuel)", placeholder: "(T-skoru buraya girilecek)" }
              ],
              build: (v) => {
                let s = `Osteoporoz tanısını ${zamanIfade(v.zaman)} almış.`;
                if (v.kmdTarih || v.kmdSonuc)
                  s += ` Tanı anındaki KMD tetkiki ${v.kmdTarih || "…"} tarihinde ${v.kmdSonuc || "…"} olarak sonuçlanmış.`;
                return s;
              }
            },
            SKIP
          ]
        },
        varYokDetay("osteo-boy", "Boy kısalması var mı?",
          [
            { name: "from", type: "text", label: "Önceki boy (cm)", placeholder: "ör. 168" },
            { name: "to", type: "text", label: "Güncel boy (cm)", placeholder: "ör. 162" }
          ],
          (v) => `Boy kısalması mevcut olup ${v.from || "…"} cm'den ${v.to || "…"} cm'ye düşmüş.`,
          "Boy kısalması tariflemiyormuş."),
        varYok("osteo-agri", "Kemik ağrıları var mı?",
          "Kemik ağrıları mevcutmuş.", "Kemik ağrıları tariflemiyormuş."),
        metinBlok("osteo-katki", "Osteoporoza katkıda bulunan hastalıklar", "Hastalıklar", "(manuel girilecek)",
          (v) => `Osteoporoza katkıda bulunan ${v} hastalıkları mevcutmuş.`),
        varYokDetay("osteo-fraktur", "Fraktür öyküsü var mı?",
          [{ name: "detay", type: "text", label: "Detay (opsiyonel)", placeholder: "ör. vertebra kompresyon fraktürü, 2022" }],
          (v) => `Fraktür öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Fraktür öyküsü yok.")
      ]
    },

    /* ===== 2. Tedavi ve Takip ===== */
    {
      id: "osteo-tedavi-grup",
      title: "Tedavi ve Takip",
      blocks: [
        metinBlok("osteo-tedavi", "Tanı sonrası tedavi", "Tedavi", "(manuel girilecek)",
          (v) => `Tanı konulduktan sonra ${v} tedavisiyle izlenmiş.`),
        {
          id: "osteo-son-kmd", label: "Son KMD tetkiki", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 03/2025" },
                { name: "sonuc", type: "text", label: "Sonuç (manuel)", placeholder: "(buraya girilecek)" }
              ],
              build: (v) => `Son yapılan KMD tetkiki ${v.tarih || "…"} tarihinde ${v.sonuc || "…"} olarak sonuçlanmış.`
            },
            SKIP
          ]
        },
        durumBlok("osteo-takip", "Osteoporoz takibi", [
          {
            key: "takip", label: "Takipli",
            fields: [{ name: "bolum", type: "select", label: "Bölüm", options: ["Dahiliye", "Geriatri", "Endokrinoloji"] }],
            build: (v) => `${v.bolum || "…"} takibindeymiş.`
          },
          { key: "yok", label: "Takipli değil", build: () => "Osteoporoz açısından takipli değilmiş." }
        ])
      ]
    }
  ]
};
