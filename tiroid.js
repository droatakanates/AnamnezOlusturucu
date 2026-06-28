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

/* =========================================================================
 * TİROİD HASTALIĞI ANAMNEZİ — HİPERTİROİDİ
 * Hipotiroidi ile aynı yapı; etyoloji/tedavi/otoantikor ve semptomlar
 * hipertiroidiye uyarlandı.
 * ====================================================================== */
const HIPERTIROIDI_SEMA = {
  id: "hipertiroidi",
  title: "Hipertiroidi Anamnezi",
  groups: [
    /* ---- 1. Başvuru ve Tiroid Hastalığı Öyküsü ---- */
    {
      id: "hiper-oyku",
      title: "Başvuru ve Tiroid Hastalığı Öyküsü",
      blocks: [
        {
          id: "hiper-tani",
          label: "Tanı zamanı ve etyoloji (tanı tipi)",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2021 yılında / 2 yıl önce" },
                { name: "etyoloji", type: "text", label: "Etyoloji / tanı tipi", placeholder: "ör. Graves hastalığı / toksik multinodüler guatr / toksik adenom / tiroidit" }
              ],
              build: (v) =>
                `${buyukHarfBasla(v.zaman || "…")} hipertiroidi tanısı almış` +
                (v.etyoloji ? `; etyoloji ${v.etyoloji} olarak değerlendirilmiş` : "") + "."
            },
            SKIP
          ]
        },
        {
          id: "hiper-tft",
          label: "Son tiroid fonksiyon testleri (TSH, sT4, sT3)",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "date", label: "Tarih" },
                { name: "tsh", type: "text", label: "TSH (µIU/mL)", placeholder: "ör. <0.01" },
                { name: "st4", type: "text", label: "sT4 (ng/dL)", placeholder: "ör. 2.8" },
                { name: "st3", type: "text", label: "sT3 (pg/mL)", placeholder: "ör: 6.4" }
              ],
              build: (v) =>
                `${fmtDate(v.tarih)} tarihli tiroid fonksiyon testlerinde TSH ${v.tsh || "…"} µIU/mL, ` +
                `sT4 ${v.st4 || "…"} ng/dL, sT3 ${v.st3 || "…"} pg/mL olarak ölçülmüş.`
            },
            SKIP
          ]
        },
        metinBlok("hiper-tedavi", "Güncel medikal tedavi (doz ile)", "Tedavi ve doz",
          "ör. metimazol 10 mg 2x1, propranolol 40 mg 2x1",
          (v) => `Güncel olarak ${v} kullanıyormuş.`),
        varYokDetay("hiper-rai", "RAI (radyoaktif iyot) öyküsü var mı?",
          [{ name: "detay", type: "text", label: "Tarih / detay", placeholder: "ör. 2022, Graves nedeniyle" }],
          (v) => `Radyoaktif iyot (RAI) tedavisi öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Radyoaktif iyot tedavisi öyküsü yok."),
        varYokDetay("hiper-cerrahi", "Tiroid cerrahisi öyküsü var mı?",
          [{ name: "detay", type: "text", label: "İşlem / tarih", placeholder: "ör. subtotal tiroidektomi, 2020" }],
          (v) => `Tiroid cerrahisi öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Tiroid cerrahisi öyküsü yok."),
        varYokDetay("hiper-usg", "Tiroid ultrasonografisi yapıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. diffüz hipervasküler parankim, multinodüler guatr" }
          ],
          (v) => `Son tiroid ultrasonografisi ${fmtDate(v.tarih)} tarihinde ${v.sonuc || "…"} olarak raporlanmış.`,
          "Tiroid ultrasonografisi yapılmamış.", "Yapıldı", "Yapılmadı"),
        varYokDetay("hiper-biyopsi", "Tiroid biyopsisi öyküsü var mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. benign (Bethesda II)" }
          ],
          (v) => `${fmtDate(v.tarih)} tarihinde yapılan tiroid ince iğne biyopsisi ${v.sonuc || "…"} olarak sonuçlanmış.`,
          "Tiroid biyopsisi öyküsü yok."),
        varYokDetay("hiper-sintigrafi", "Tiroid sintigrafisi yapıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. diffüz artmış tutulum / sıcak nodül" }
          ],
          (v) => `${fmtDate(v.tarih)} tarihli tiroid sintigrafisi ${v.sonuc || "…"} olarak raporlanmış.`,
          "Tiroid sintigrafisi yapılmamış.", "Yapıldı", "Yapılmadı"),
        varYokDetay("hiper-otoantikor", "Tiroid otoantikorları (TRAb dahil) bakıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. TRAb pozitif, anti-TPO pozitif" }
          ],
          (v) => `${fmtDate(v.tarih)} tarihinde bakılan tiroid otoantikorları ${v.sonuc || "…"} olarak saptanmış.`,
          "Tiroid otoantikorları bakılmamış.", "Bakıldı", "Bakılmadı")
      ]
    },

    /* ---- 2. Semptom Sorgusu (var / yok / sorgulanmalı) ---- */
    {
      id: "hiper-semptom",
      title: "Semptom Sorgusu",
      blocks: [
        {
          id: "hiper-semptom-kod",
          type: "symptom-code",
          label: "Her semptomu kodlayın (bilgi yoksa 'Sorgulanmalı' kalır)",
          symptoms: [
            { id: "carpinti", label: "Çarpıntı" },
            { id: "kilo-kaybi", label: "Kilo kaybı" },
            { id: "istah-artisi", label: "İştah artışı" },
            { id: "sicak-intolerans", label: "Sıcak intoleransı / aşırı terleme" },
            { id: "ishal", label: "İshal / sık dışkılama" },
            { id: "tremor", label: "El tremoru" },
            { id: "sinirlilik", label: "Sinirlilik / irritabilite" },
            { id: "uykusuzluk", label: "Uykusuzluk" },
            { id: "kas-gucsuzlugu", label: "Kas güçsüzlüğü" },
            { id: "tasikardi", label: "Taşikardi" },
            { id: "goz-bulgulari", label: "Ekzoftalmi / göz bulguları" },
            { id: "menstruel", label: "Menstrüel düzensizlik (oligomenore)" }
          ]
        }
      ]
    }
  ]
};

/* =========================================================================
 * TİROİD HASTALIĞI ANAMNEZİ — MULTİNODÜLER GUATR (MNG)
 * ====================================================================== */
const MNG_SEMA = {
  id: "mng",
  title: "Multinodüler Guatr Anamnezi",
  groups: [
    /* ---- 1. Başvuru ve Guatr Öyküsü ---- */
    {
      id: "mng-oyku",
      title: "Başvuru ve Guatr Öyküsü",
      blocks: [
        {
          id: "mng-tani",
          label: "Tanı zamanı ve nasıl saptandığı",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2019 yılında / 5 yıl önce" },
                {
                  name: "farkedilme", type: "select", label: "Nasıl saptandı",
                  options: [
                    "boyunda şişlik fark edilmesi üzerine",
                    "rutin/insidental görüntülemede",
                    "tiroid fonksiyon taramasında",
                    "başka nedenle çekilen görüntülemede"
                  ]
                }
              ],
              build: (v) =>
                `${buyukHarfBasla(v.zaman || "…")} ${v.farkedilme || "yapılan değerlendirmede"} ` +
                "multinodüler guatr saptanmış."
            },
            SKIP
          ]
        },
        {
          id: "mng-fonksiyon",
          label: "Fonksiyonel durum ve son TFT (TSH, sT4, sT3)",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                {
                  name: "durum", type: "select", label: "Fonksiyonel durum",
                  options: ["ötiroid", "subklinik hipertiroidi", "toksik (aşikâr hipertiroidi)", "subklinik hipotiroidi", "hipotiroidi"]
                },
                { name: "tarih", type: "date", label: "TFT tarihi" },
                { name: "tsh", type: "text", label: "TSH (µIU/mL)", placeholder: "ör. 0.3" },
                { name: "st4", type: "text", label: "sT4 (ng/dL)", placeholder: "ör. 1.4" },
                { name: "st3", type: "text", label: "sT3 (pg/mL)", placeholder: "ör. 3.2" }
              ],
              build: (v) =>
                (v.durum ? `Fonksiyonel olarak ${v.durum} durumda; ` : "") +
                `${fmtDate(v.tarih)} tarihli tiroid fonksiyon testlerinde TSH ${v.tsh || "…"} µIU/mL, ` +
                `sT4 ${v.st4 || "…"} ng/dL, sT3 ${v.st3 || "…"} pg/mL olarak ölçülmüş.`
            },
            SKIP
          ]
        },
        varYokDetay("mng-usg", "Tiroid ultrasonografisi yapıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "enbuyuk", type: "text", label: "En büyük nodül", placeholder: "ör. sağ lobda 28 mm" },
            { name: "bulgu", type: "text", label: "Bulgu / TIRADS", placeholder: "ör. multipl nodül, dominant nodül EU-TIRADS 3" }
          ],
          (v) =>
            `Son tiroid ultrasonografisi ${fmtDate(v.tarih)} tarihinde yapılmış; ` +
            `en büyük nodül ${v.enbuyuk || "…"}, ${v.bulgu || "…"} olarak raporlanmış.`,
          "Tiroid ultrasonografisi yapılmamış.", "Yapıldı", "Yapılmadı"),
        varYokDetay("mng-iiab", "İnce iğne aspirasyon biyopsisi (İİAB) yapıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç (Bethesda)", placeholder: "ör. benign (Bethesda II)" }
          ],
          (v) => `${fmtDate(v.tarih)} tarihinde yapılan tiroid ince iğne biyopsisi ${v.sonuc || "…"} olarak sonuçlanmış.`,
          "Tiroid ince iğne biyopsisi yapılmamış.", "Yapıldı", "Yapılmadı"),
        varYokDetay("mng-sintigrafi", "Tiroid sintigrafisi yapıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. sağ lobda sıcak nodül, kalan parankim baskılı" }
          ],
          (v) => `${fmtDate(v.tarih)} tarihli tiroid sintigrafisi ${v.sonuc || "…"} olarak raporlanmış.`,
          "Tiroid sintigrafisi yapılmamış.", "Yapıldı", "Yapılmadı"),
        varYokDetay("mng-otoantikor", "Tiroid otoantikorları bakıldı mı?",
          [
            { name: "tarih", type: "date", label: "Tarih" },
            { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. anti-TPO negatif, TRAb negatif" }
          ],
          (v) => `${fmtDate(v.tarih)} tarihinde bakılan tiroid otoantikorları ${v.sonuc || "…"} olarak saptanmış.`,
          "Tiroid otoantikorları bakılmamış.", "Bakıldı", "Bakılmadı"),
        metinBlok("mng-tedavi", "Güncel yaklaşım / medikal tedavi", "Tedavi / takip",
          "ör. ötiroid, aralıklı USG ile takip / levotiroksin supresyonu / antitiroid tedavi",
          (v) => `Güncel olarak ${v} şeklinde yönetiliyormuş.`),
        varYokDetay("mng-rai", "RAI (radyoaktif iyot) öyküsü var mı?",
          [{ name: "detay", type: "text", label: "Tarih / detay", placeholder: "ör. 2022, toksik nodül nedeniyle" }],
          (v) => `Radyoaktif iyot (RAI) tedavisi öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Radyoaktif iyot tedavisi öyküsü yok."),
        varYokDetay("mng-cerrahi", "Tiroid cerrahisi öyküsü var mı?",
          [{ name: "detay", type: "text", label: "İşlem / tarih", placeholder: "ör. total tiroidektomi, 2021" }],
          (v) => `Tiroid cerrahisi öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Tiroid cerrahisi öyküsü yok.")
      ]
    },

    /* ---- 2. Malignite Risk Değerlendirmesi ---- */
    {
      id: "mng-risk",
      title: "Malignite Risk Değerlendirmesi",
      blocks: [
        varYok("mng-radyasyon", "Baş-boyun bölgesine radyasyon/radyoterapi öyküsü var mı?",
          "Baş-boyun bölgesine radyasyon/radyoterapi öyküsü mevcut.",
          "Baş-boyun bölgesine radyasyon/radyoterapi öyküsü yok."),
        varYok("mng-aile-ca", "Ailede tiroid kanseri öyküsü var mı?",
          "Ailede tiroid kanseri öyküsü mevcut.", "Ailede tiroid kanseri öyküsü yok."),
        varYok("mng-hizli-buyume", "Son dönemde nodülde/guatrda hızlı büyüme var mı?",
          "Son dönemde nodülde/guatrda hızlı büyüme tarifliyormuş.",
          "Son dönemde belirgin hızlı büyüme tariflenmemiş.")
      ]
    },

    /* ---- 3. Semptom / Bası Sorgusu (var / yok / sorgulanmalı) ---- */
    {
      id: "mng-semptom",
      title: "Semptom / Bası Sorgusu",
      blocks: [
        {
          id: "mng-semptom-kod",
          type: "symptom-code",
          label: "Her semptomu kodlayın (bilgi yoksa 'Sorgulanmalı' kalır)",
          symptoms: [
            { id: "sislik", label: "Boyunda şişlik / kitle" },
            { id: "dolgunluk", label: "Boyunda basınç / dolgunluk hissi" },
            { id: "disfaji", label: "Disfaji (yutma güçlüğü)" },
            { id: "dispne", label: "Nefes darlığı (özellikle sırtüstü)" },
            { id: "stridor", label: "Stridor" },
            { id: "ses-kisikligi", label: "Ses kısıklığı" },
            { id: "oksuruk", label: "Öksürük" },
            { id: "boyun-agri", label: "Boyunda ağrı" },
            { id: "carpinti", label: "Çarpıntı" },
            { id: "kilo-kaybi", label: "Kilo kaybı" },
            { id: "sicak-intolerans", label: "Sıcak intoleransı" }
          ]
        }
      ]
    }
  ]
};
