/* =========================================================================
 * TİROİD HASTALIĞI ANAMNEZİ — HİPOTİROİDİ
 * schema.js yardımcılarına bağlıdır (varYok, varYokDetay, metinBlok, fmtDate,
 * buyukHarfBasla, buildSymptomCode ...).
 * ====================================================================== */
const HIPOTIROIDI_SEMA = {
  id: "hipotiroidi",
  title: "Hipotiroidi Anamnezi",
  groups: [
    /* ---- 1. Başvuru ve Tiroid Hastalığı Öyküsü ---- */
    {
      id: "hipo-oyku",
      title: "Başvuru ve Tiroid Hastalığı Öyküsü",
      blocks: [
        {
          id: "hipo-tani",
          label: "Tanı zamanı ve etyoloji (tanı tipi)",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2018 yılında / 6 yıl önce" },
                { name: "etyoloji", type: "text", label: "Etyoloji / tanı tipi", placeholder: "ör. Hashimoto tiroiditi / postoperatif / RAI sonrası" }
              ],
              build: (v) =>
                `${buyukHarfBasla(v.zaman || "…")} hipotiroidi tanısı almış` +
                (v.etyoloji ? `; etyoloji ${v.etyoloji} olarak değerlendirilmiş` : "") + "."
            },
            SKIP
          ]
        },
        {
          id: "hipo-tft",
          label: "Son tiroid fonksiyon testleri (TSH, sT4, sT3)",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "date", label: "Tarih" },
                { name: "tsh", type: "text", label: "TSH (µIU/mL)", placeholder: "ör. 8.4" },
                { name: "st4", type: "text", label: "sT4 (ng/dL)", placeholder: "ör. 0.7" },
                { name: "st3", type: "text", label: "sT3 (pg/mL)", placeholder: "ör. 2.1" }
              ],
              build: (v) =>
                `${fmtDate(v.tarih)} tarihli tiroid fonksiyon testlerinde TSH ${v.tsh || "…"} µIU/mL, ` +
                `sT4 ${v.st4 || "…"} ng/dL, sT3 ${v.st3 || "…"} pg/mL olarak ölçülmüş.`
            },
            SKIP
          ]
        },
        metinBlok("hipo-tedavi", "Güncel medikal tedavi (doz ile)", "Tedavi ve doz",
          "ör. levotiroksin 100 mcg 1x1",
          (v) => `Güncel olarak ${v} kullanıyormuş.`),
        varYokDetay("hipo-rai", "RAI (radyoaktif iyot) öyküsü var mı?",
          [{ name: "detay", type: "text", label: "Tarih / detay", placeholder: "ör. 2016, hipertiroidi nedeniyle" }],
          (v) => `Radyoaktif iyot (RAI) tedavisi öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Radyoaktif iyot tedavisi öyküsü yok."),
        varYokDetay("hipo-cerrahi", "Tiroid cerrahisi öyküsü var mı?",
          [{ name: "detay", type: "text", label: "İşlem / tarih", placeholder: "ör. total tiroidektomi, 2017" }],
          (v) => `Tiroid cerrahisi öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Tiroid cerrahisi öyküsü yok."),
        varYokDetay("hipo-usg", "Tiroid ultrasonografisi yapıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. heterojen parankim, sağ lobda 8 mm nodül" }
          ],
          (v) => `Son tiroid ultrasonografisi ${fmtDate(v.tarih)} tarihinde ${v.sonuc || "…"} olarak raporlanmış.`,
          "Tiroid ultrasonografisi yapılmamış.", "Yapıldı", "Yapılmadı"),
        varYokDetay("hipo-biyopsi", "Tiroid biyopsisi öyküsü var mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. benign (Bethesda II)" }
          ],
          (v) => `${fmtDate(v.tarih)} tarihinde yapılan tiroid ince iğne biyopsisi ${v.sonuc || "…"} olarak sonuçlanmış.`,
          "Tiroid biyopsisi öyküsü yok."),
        varYokDetay("hipo-sintigrafi", "Tiroid sintigrafisi yapıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. diffüz azalmış tutulum" }
          ],
          (v) => `${fmtDate(v.tarih)} tarihli tiroid sintigrafisi ${v.sonuc || "…"} olarak raporlanmış.`,
          "Tiroid sintigrafisi yapılmamış.", "Yapıldı", "Yapılmadı"),
        varYokDetay("hipo-otoantikor", "Tiroid otoantikorları bakıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. anti-TPO pozitif, anti-Tg negatif" }
          ],
          (v) => `${fmtDate(v.tarih)} tarihinde bakılan tiroid otoantikorları ${v.sonuc || "…"} olarak saptanmış.`,
          "Tiroid otoantikorları bakılmamış.", "Bakıldı", "Bakılmadı")
      ]
    },

    /* ---- 2. Semptom Sorgusu (var / yok / sorgulanmalı) ---- */
    {
      id: "hipo-semptom",
      title: "Semptom Sorgusu",
      blocks: [
        {
          id: "hipo-semptom-kod",
          type: "symptom-code",
          label: "Her semptomu kodlayın (bilgi yoksa 'Sorgulanmalı' kalır)",
          symptoms: [
            { id: "halsizlik", label: "Halsizlik" },
            { id: "kilo-artisi", label: "Kilo artışı" },
            { id: "usume", label: "Üşüme / soğuk intoleransı" },
            { id: "kabizlik", label: "Kabızlık" },
            { id: "cilt-kurulugu", label: "Cilt kuruluğu" },
            { id: "sac-dokulmesi", label: "Saç dökülmesi" },
            { id: "uyku-hali", label: "Uyku hali" },
            { id: "konsantrasyon", label: "Konsantrasyon güçlüğü" },
            { id: "ses-kalinlasmasi", label: "Ses kalınlaşması" },
            { id: "bradikardi", label: "Bradikardi" },
            { id: "menstruel", label: "Menstrüel düzensizlik" }
          ]
        }
      ]
    }
  ]
};
