/* =========================================================================
 * Anamnez Oluşturucu — Soru Şablonu (veri modeli)
 * -------------------------------------------------------------------------
 * Her "blok" örnek metindeki bir (Değişken) bölümüne karşılık gelir.
 *
 * Blok yapısı:
 *   id     : benzersiz anahtar
 *   label  : kullanıcıya gösterilen soru
 *   modes  : [{ key, label, fields?, build? }]
 *            - fields : o mod seçilince açılan boşluk doldurma alanları
 *            - build(v): taslağa eklenecek cümleyi üretir (v = alan değerleri)
 *            - build yoksa (ör. "Atla") o bölüm taslağa İŞLENMEZ
 *   default: ilk açılışta seçili mod (genelde 'skip')
 *
 * Özel blok: { type: 'symptoms', symptoms: [...] } → semptom matrisi
 * ====================================================================== */

/* Türkçe liste birleştirici: ["a","b","c"] -> "a, b ve c" */
function joinVe(arr) {
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(", ") + " ve " + arr[arr.length - 1];
}
/* Virgülle birleştirici (olumsuz "... yok." için): "a, b, c" */
function joinVirgul(arr) {
  return arr.join(", ");
}
/* Cümlenin ilk harfini büyütür (Türkçe i->İ dahil) */
function buyukHarfBasla(s) {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
}

/* ISO tarihi (yyyy-mm-dd) "gg.aa.yyyy" biçimine çevirir */
function fmtDate(iso) {
  if (!iso) return "…";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

/* Basit Var/Yok bloğu üreticisi (tekrarı azaltmak için) */
function varYok(id, label, varText, yokText) {
  return {
    id, label, default: "skip",
    modes: [
      { key: "yes", label: "Var", build: () => varText },
      { key: "no", label: "Yok", build: () => yokText },
      SKIP
    ]
  };
}

/* Çoklu seçim (checklist): işaretliler "mevcut", kalanlar "yok" */
function checklistVarYok(id, label, items) {
  return {
    id, label, default: "skip",
    modes: [
      {
        key: "fill", label: "Belirt",
        fields: [
          { name: "sec", type: "multi", label: "Mevcut olanları işaretleyin", options: items }
        ],
        build: (v) => {
          const sec = v.sec || [];
          const yok = items.filter((i) => !sec.includes(i));
          const parts = [];
          if (sec.length) parts.push(`${joinVe(sec)} mevcut`);
          if (yok.length) parts.push(`${joinVirgul(yok)} yok`);
          return buyukHarfBasla(parts.join("; ")) + ".";
        }
      },
      SKIP
    ]
  };
}

/* Atla modu — her blokta ortak */
const SKIP = { key: "skip", label: "Atla" };

const HIPERTANSIYON_SEMA = {
  id: "hipertansiyon",
  title: "Hipertansiyon Anamnezi",
  groups: [
    /* ---------------------------------------------------------------- */
    {
      id: "tani-tedavi",
      title: "Tanı ve Tedavi",
      blocks: [
        {
          id: "tani",
          label: "Tanı zamanı ve nasıl konulduğu biliniyor mu?",
          default: "skip",
          modes: [
            {
              key: "fill",
              label: "Doldur",
              fields: [
                { name: "sure", type: "text", label: "Ne kadar önce", placeholder: "ör. 5 yıl" },
                {
                  name: "yer", type: "select", label: "Tanı durumu",
                  options: [
                    "acil başvurusu",
                    "aile hekimliği başvurusu",
                    "rutin kontrol"
                  ]
                }
              ],
              build: (v) =>
                `${v.sure || "…"} önce ${v.yer || "…"} sırasında tanı almış.`
            },
            SKIP
          ]
        },
        {
          id: "ilac",
          label: "Düzenli antihipertansif ilaç kullanıyor mu?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Evet",
              fields: [
                {
                  name: "ilac", type: "text", label: "İlaç adı ve dozu",
                  placeholder: "ör. kandesartan/hidroklorotiyazid 1x1"
                }
              ],
              build: (v) => `Düzenli olarak ${v.ilac || "…"} kullanıyormuş.`
            },
            {
              key: "no", label: "Hayır",
              build: () => "Düzenli antihipertansif ilaç kullanmıyormuş."
            },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "kan-basinci-takibi",
      title: "Kan Basıncı Takibi ve Yaşam Tarzı",
      blocks: [
        {
          id: "evde-olcum",
          label: "Evde kan basıncı ölçümü yapıyor mu?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Evet",
              fields: [
                {
                  name: "duzen", type: "select", label: "Ölçüm düzeni",
                  options: ["düzenli", "düzensiz"]
                },
                {
                  name: "deger", type: "text", label: "Ortalama değer (mmHg)",
                  placeholder: "ör. 120/80"
                }
              ],
              build: (v) =>
                `Evde ${v.duzen || "düzenli"} kan basıncı ölçümü yapan hastanın ` +
                `ortalama kan basıncı değeri ${v.deger || "…"} mmHg geliyormuş.`
            },
            {
              key: "no", label: "Hayır",
              build: () => "Evde düzenli kan basıncı ölçümü yapmıyormuş."
            },
            SKIP
          ]
        },
        {
          id: "tuzsuz-diyet",
          label: "Tuzsuz diyet uyumu var mı?",
          default: "skip",
          modes: [
            { key: "yes", label: "Var", build: () => "Tuzsuz diyet uyumu mevcut." },
            { key: "no", label: "Yok", build: () => "Tuzsuz diyet uyumu yok." },
            SKIP
          ]
        },
        {
          id: "egzersiz",
          label: "Düzenli egzersiz yapıyor mu?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Evet",
              fields: [
                {
                  name: "siklik", type: "text", label: "Sıklık",
                  placeholder: "ör. haftada üç gün"
                },
                {
                  name: "tempo", type: "text", label: "Tempo / tür",
                  placeholder: "ör. orta tempoda yürüyüş"
                }
              ],
              build: (v) =>
                `${v.siklik || "…"} düzenli ${v.tempo || "egzersiz"} yapıyormuş.`
            },
            {
              key: "no", label: "Hayır",
              build: () => "Düzenli egzersiz yapmıyormuş."
            },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "semptomlar",
      title: "Semptomlar",
      blocks: [
        {
          id: "semptom-matrisi",
          type: "symptoms",
          label:
            "Semptomları işaretleyin. Bir semptom tariflenecekse sıklığını seçin; " +
            "yakın zamanda şiddetlendiyse ilgili kutuyu işaretleyin.",
          symptoms: [
            { id: "ense", label: "ense ağrısı" },
            { id: "bas-donmesi", label: "baş dönmesi" },
            { id: "gogus-agrisi", label: "göğüs ağrısı" },
            { id: "nefes-darligi", label: "nefes darlığı" },
            { id: "carpinti", label: "çarpıntı" },
            { id: "gorme", label: "görme bulanıklığı" }
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "hedef-organ",
      title: "Hedef Organ Hasarı ve Komorbidite",
      blocks: [
        {
          id: "ht-acil",
          label: "Hipertansif acil servis başvurusu öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                {
                  name: "detay", type: "text", label: "Detay",
                  placeholder: "ör. iki kez, son olarak Mart 2025'te"
                }
              ],
              build: (v) =>
                `Hipertansif acil servis başvurusu öyküsü mevcut${v.detay ? " (" + v.detay + ")" : ""}.`
            },
            {
              key: "no", label: "Yok",
              build: () => "Hipertansif acil servis başvurusu yok."
            },
            SKIP
          ]
        },
        {
          id: "nefropati",
          label: "Hipertansif nefropati açısından tarandı mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Evet",
              fields: [
                {
                  name: "tarih", type: "text", label: "Tarama tarihi",
                  placeholder: "ör. Kasım 2025"
                },
                {
                  name: "yontem", type: "text", label: "Tarama yöntemi",
                  placeholder: "ör. spot idrar albumin/kreatinin"
                },
                {
                  name: "sonuc", type: "select", label: "Sonuç",
                  options: ["saptanmamış", "saptanmış"]
                }
              ],
              build: (v) =>
                `Hipertansif nefropati açısından ${v.tarih || "…"}'te ` +
                `${v.yontem || "tarama"} ile taranan hastada hipertansif nefropati ` +
                `${v.sonuc || "saptanmamış"}.`
            },
            {
              key: "no", label: "Hayır",
              build: () => "Hipertansif nefropati açısından taranma öyküsü yok."
            },
            SKIP
          ]
        },
        {
          id: "retinopati",
          label: "Hipertansif retinopati için tarandı mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Evet",
              fields: [
                {
                  name: "tarih", type: "text", label: "Tarih",
                  placeholder: "ör. Ocak 2025"
                },
                {
                  name: "sonuc", type: "select", label: "Sonuç",
                  options: ["saptanmamış", "saptanmış"]
                }
              ],
              build: (v) =>
                `Hipertansif retinopati için ${v.tarih || "…"}'te ` +
                `fundoskopik muayene yapılan hastada retinopati ${v.sonuc || "saptanmamış"}.`
            },
            {
              key: "no", label: "Hayır",
              build: () => "Hipertansif retinopati için taranma öyküsü yok."
            },
            SKIP
          ]
        },
        {
          id: "kah",
          label: "Koroner anjiyografi (CAG) / koroner arter hastalığı öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "yil", type: "text", label: "Yıl", placeholder: "ör. 2019" },
                {
                  name: "endikasyon", type: "text", label: "Endikasyon",
                  placeholder: "ör. efor dispnesi"
                },
                {
                  name: "girisim", type: "text", label: "Uygulanan işlem",
                  placeholder: "ör. RCA PKG"
                }
              ],
              build: (v) =>
                `${v.yil || "…"} yılında ${v.endikasyon || "…"} tariflemesi üzerine ` +
                `CAG yapılan hastaya ${v.girisim || "…"} uygulanmış.`
            },
            {
              key: "no", label: "Yok",
              build: () => "Bilinen koroner arter hastalığı öyküsü yok."
            },
            SKIP
          ]
        },
        {
          id: "svo-pah",
          label: "SVO / PAH öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                {
                  name: "detay", type: "text", label: "Detay",
                  placeholder: "ör. 2021'de iskemik SVO"
                }
              ],
              build: (v) => `SVO/PAH öyküsü mevcut${v.detay ? " (" + v.detay + ")" : ""}.`
            },
            { key: "no", label: "Yok", build: () => "SVO/PAH öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "cabg",
          label: "CABG (baypas) öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                {
                  name: "detay", type: "text", label: "Detay",
                  placeholder: "ör. 2018'de 3 damar CABG"
                }
              ],
              build: (v) => `CABG öyküsü mevcut${v.detay ? " (" + v.detay + ")" : ""}.`
            },
            { key: "no", label: "Yok", build: () => "CABG öyküsü yok." },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "ilac-oykusu",
      title: "İlaç Öyküsü",
      blocks: [
        {
          id: "siddetlendirici-ilac",
          label: "Hipertansiyonu şiddetlendirici ilaç kullanım öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                {
                  name: "ilac", type: "text", label: "İlaç(lar)",
                  placeholder: "ör. OKS, NSAİİ"
                }
              ],
              build: (v) =>
                `Hipertansiyonu şiddetlendirici ilaç kullanım öyküsü mevcut ` +
                `(${v.ilac || "…"}).`
            },
            {
              key: "no", label: "Yok",
              build: () => "Hipertansiyonu şiddetlendirici ilaç kullanım öyküsü yok."
            },
            SKIP
          ]
        }
      ]
    }
  ]
};

/* =========================================================================
 * ÜLSERATİF KOLİT ANAMNEZİ
 * ====================================================================== */
const ULSERATIF_KOLIT_SEMA = {
  id: "ulseratif-kolit",
  title: "Ülseratif Kolit Anamnezi",
  groups: [
    /* ---------------------------------------------------------------- */
    {
      id: "uc-tani-oyku",
      title: "Tanı ve Hastalık Öyküsü",
      blocks: [
        {
          id: "uc-baslangic",
          label: "Başlangıç şikayetleri ve dönemi",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                {
                  name: "sikayetler", type: "multi", label: "Başlangıç şikayetleri",
                  options: ["kanlı ishal", "mukus", "tenesmus"]
                },
                { name: "yil", type: "text", label: "Başlangıç yılı", placeholder: "ör. 2015" },
                { name: "yas", type: "text", label: "Başlangıç yaşı", placeholder: "ör. 28" }
              ],
              build: (v) =>
                buyukHarfBasla(
                  `${v.sikayetler && v.sikayetler.length ? joinVe(v.sikayetler) : "…"} ` +
                  `şikayetleri ${v.yil || "…"} yılında ${v.yas || "…"} yaşında başlamış.`
                )
            },
            SKIP
          ]
        },
        {
          id: "uc-tani-yer",
          label: "Tanının konulduğu yer biliniyor mu?",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "hastane", type: "text", label: "Hastane", placeholder: "ör. … Üniversitesi" }
              ],
              build: (v) =>
                `Hasta şikayetleriyle ${v.hastane || "…"} hastanesine başvurusunda tanı almış.`
            },
            SKIP
          ]
        },
        {
          id: "uc-baslangic-seyir",
          label: "Başlangıç döneminde hastalık seyri",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                {
                  name: "seyir1", type: "select", label: "Seyir tipi",
                  options: ["sürekli", "ataklar halinde aralıklı"]
                },
                {
                  name: "seyir2", type: "select", label: "Şiddet seyri",
                  options: ["giderek artan", "stabil seyreden"]
                }
              ],
              build: (v) =>
                `O dönemde şikayetleri ${v.seyir1 || "…"}, ${v.seyir2 || "…"} ` +
                `vasıfta ilerliyormuş.`
            },
            SKIP
          ]
        },
        {
          id: "uc-guncel-tedavi",
          label: "Güncel medikal tedavi",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                {
                  name: "ilac", type: "select", label: "Tedavi",
                  options: ["TNF inhibitörü", "5-ASA", "Vedolizumab", "diğer"]
                },
                { name: "doz", type: "text", label: "Doz / şema", placeholder: "ör. 300 mg, 8 haftada bir" }
              ],
              build: (v) =>
                `Güncel olarak ${[v.ilac, v.doz].filter(Boolean).join(" ") || "…"} kullanıyormuş.`
            },
            { key: "no", label: "Yok", build: () => "Güncel olarak medikal tedavi almıyormuş." },
            SKIP
          ]
        },
        {
          id: "uc-ilac-uyum",
          label: "İlaç kullanım uyumu",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "duzen", type: "select", label: "Uyum", options: ["düzenli", "düzensiz"] }
              ],
              build: (v) => `İlaçlarını ${v.duzen || "düzenli"} olarak kullanıyormuş.`
            },
            SKIP
          ]
        },
        {
          id: "uc-onceki-tedavi",
          label: "Önceki medikal tedavi öyküsü",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "onceki", type: "text", label: "Önceki tedavi(ler)", placeholder: "ör. azatioprin, sistemik steroid" }
              ],
              build: (v) => `Önceki medikal tedavisinde ${v.onceki || "…"} kullanmış.`
            },
            SKIP
          ]
        },
        {
          id: "uc-atak-sayisi",
          label: "Geçmiş atak sayısı",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [{ name: "sayi", type: "text", label: "Atak sayısı", placeholder: "ör. 3" }],
              build: (v) => `Geçmişte ${v.sayi || "…"} kez atak geçirmiş.`
            },
            SKIP
          ]
        },
        {
          id: "uc-son-atak",
          label: "Son atak tarihi",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [{ name: "tarih", type: "text", label: "Son atak", placeholder: "ör. 3 ay önce / 2024" }],
              build: (v) => `Son atak tarihi ${v.tarih || "…"} olmuş.`
            },
            SKIP
          ]
        },
        {
          id: "uc-yatis",
          label: "Alevlenme nedeniyle hastaneye yatış öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "kac", type: "text", label: "Kaç kez", placeholder: "ör. 2" },
                { name: "tedavi", type: "text", label: "Verilen tedaviler", placeholder: "ör. IV steroid" },
                { name: "sure", type: "text", label: "Yatış süresi (gün)", placeholder: "ör. 7" }
              ],
              build: (v) =>
                `Ülseratif kolit alevlenmesi nedeniyle ${v.kac || "…"} kez hastaneye yatış ` +
                `öyküsü mevcut (verilen tedaviler: ${v.tedavi || "…"}; yatış süresi: ${v.sure || "…"} gün).`
            },
            {
              key: "no", label: "Yok",
              build: () => "Ülseratif kolit alevlenmesi nedeniyle hastaneye yatış öyküsü yok."
            },
            SKIP
          ]
        },
        {
          id: "uc-kolonoskopi",
          label: "Son kolonoskopi",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. Mart 2025" },
                { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. sol kolit, Mayo 2" }
              ],
              build: (v) =>
                `Son kolonoskopisi ${v.tarih || "…"} tarihinde ${v.sonuc || "…"} olarak sonuçlanmış.`
            },
            SKIP
          ]
        },
        {
          id: "uc-yayginlik",
          label: "Güncel hastalık yaygınlığı",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                {
                  name: "yayginlik", type: "select", label: "Yaygınlık",
                  options: ["proktit", "sol kolit", "pankolit"]
                }
              ],
              build: (v) => `Hastalık güncel olarak ${v.yayginlik || "…"} olarak değerlendirilmiş.`
            },
            SKIP
          ]
        },
        {
          id: "uc-kanser-tarama",
          label: "Tanı süresi 8 yılı aştığı için: kolonoskopi ile düzenli kanser taraması yapılıyor mu?",
          default: "skip",
          /* Otomatik koşul: başlangıç yılı bugünden ≥ 8 yıl öncesiyse görünür */
          visibleIf: (state) => {
            const t = state["uc-baslangic"];
            if (!t || t.mode !== "fill") return false;
            const m = String(t.values.yil || "").match(/\d{4}/);
            if (!m) return false;
            return new Date().getFullYear() - parseInt(m[0], 10) >= 8;
          },
          modes: [
            {
              key: "yes", label: "Evet",
              fields: [{ name: "tarih", type: "text", label: "Son tarama (opsiyonel)", placeholder: "ör. 2024" }],
              build: (v) =>
                `Tanı süresi 8 yılı aştığından kolonoskopi ile düzenli kanser taraması ` +
                `yapılıyormuş${v.tarih ? ` (son tarama: ${v.tarih})` : ""}.`
            },
            {
              key: "no", label: "Hayır",
              build: () =>
                "Tanı süresi 8 yılı aşmasına rağmen kolonoskopi ile düzenli kanser taraması yapılmıyormuş."
            },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "uc-guncel-semptom",
      title: "Güncel Semptom Sorgusu",
      blocks: [
        {
          id: "uc-gunluk-diski",
          label: "Günlük dışkılama sıklığı ve niteliği",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "sayi", type: "text", label: "Günlük dışkılama sayısı", placeholder: "ör. 6" },
                { name: "kanli", type: "select", label: "Kanlı mı?", options: ["kanlı", "kansız"] }
              ],
              build: (v) =>
                `Güncel olarak günde ${v.sayi || "…"} kez ${v.kanli || "…"} dışkılıyormuş.`
            },
            SKIP
          ]
        },
        {
          id: "uc-kivam",
          label: "Dışkı kıvamı",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                {
                  name: "kivam", type: "select", label: "Kıvam",
                  options: ["sulu", "yarı katı", "şekilli", "kabızlıkla dönüşümlü"]
                }
              ],
              build: (v) => `Dışkı kıvamı ${v.kivam || "…"} olarak tarifleniyor.`
            },
            SKIP
          ]
        },
        {
          id: "uc-kan-ozellik",
          label: "Kanlı dışkı özellikleri",
          default: "skip",
          /* Yalnızca dışkı 'kanlı' işaretlenmişse görünür */
          visibleIf: (state) => {
            const b = state["uc-gunluk-diski"];
            return !!(b && b.mode === "fill" && b.values.kanli === "kanlı");
          },
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "renk", type: "select", label: "Kanın rengi", options: ["açık kırmızı", "koyu kırmızı"] },
                {
                  name: "yer", type: "select", label: "Kanın yeri",
                  options: ["dışkıya karışmış", "tuvalet kağıdında"]
                }
              ],
              build: (v) =>
                `Kanama ${v.renk || "…"} renkte ve ${v.yer || "…"} şeklinde tarifleniyor.`
            },
            SKIP
          ]
        },
        varYok("uc-gece", "Gece uykudan uyandıran dışkılama var mı?",
          "Gece uykudan uyandıran dışkılaması mevcut.",
          "Gece uykudan uyandıran dışkılaması yok."),
        varYok("uc-tenesmus", "Tenesmus var mı?", "Tenesmus mevcut.", "Tenesmus yok."),
        varYok("uc-urgency", "Tuvalete yetişememe (urgency) var mı?",
          "Tuvalete yetişememe (urgency) mevcut.", "Tuvalete yetişememe (urgency) yok."),
        varYok("uc-inkontinans", "Gaita inkontinansı var mı?",
          "Gaita inkontinansı mevcut.", "Gaita inkontinansı yok."),
        varYok("uc-kabizlik", "Kabızlık var mı?", "Kabızlık mevcut.", "Kabızlık yok."),
        {
          id: "uc-karin-agri",
          label: "Karın ağrısı var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "yer", type: "text", label: "Yeri", placeholder: "ör. sol alt kadran" },
                { name: "karakter", type: "select", label: "Karakter", options: ["kramp tarzında", "sürekli"] },
                {
                  name: "iliski", type: "select", label: "Dışkılama ile ilişki",
                  options: ["dışkılamayla artıyor", "dışkılamayla azalıyor", "dışkılamayla değişmiyor"]
                }
              ],
              build: (v) =>
                `${buyukHarfBasla(v.yer || "…")} yerleşimli, ${v.karakter || "…"}, ` +
                `${v.iliski || "…"} karın ağrısı tarifliyor.`
            },
            { key: "no", label: "Yok", build: () => "Karın ağrısı yok." },
            SKIP
          ]
        },
        {
          id: "uc-febril",
          label: "Evde febril yükseklik var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [{ name: "derece", type: "text", label: "En yüksek ölçülen (°C)", placeholder: "ör. 38.5" }],
              build: (v) => `Evde febril yükseklik mevcut (en yüksek ${v.derece || "…"} °C ölçülmüş).`
            },
            { key: "no", label: "Yok", build: () => "Evde febril yükseklik yok." },
            SKIP
          ]
        },
        {
          id: "uc-kilo",
          label: "Kilo kaybı var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [{ name: "miktar", type: "text", label: "Süre ve miktar", placeholder: "ör. 3 ayda 6 kg" }],
              build: (v) => `Kilo kaybı mevcut (${v.miktar || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "Kilo kaybı yok." },
            SKIP
          ]
        },
        checklistVarYok("uc-sistemik", "Eşlik eden sistemik semptomlar",
          ["halsizlik", "iştahsızlık", "çarpıntı", "baş dönmesi"])
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "uc-komplikasyon",
      title: "Komplikasyon ve Diğer Sorgular",
      blocks: [
        checklistVarYok("uc-gis", "Bulantı-kusma / karında şişkinlik / gaz-gaita çıkaramama",
          ["bulantı-kusma", "karında şişkinlik", "gaz-gaita çıkaramama"]),
        varYok("uc-toksik-megakolon", "Toksik megakolon öyküsü var mı?",
          "Toksik megakolon öyküsü mevcut.", "Toksik megakolon öyküsü yok."),
        varYok("uc-transfuzyon", "Kan transfüzyonu öyküsü var mı?",
          "Kan transfüzyonu öyküsü mevcut.", "Kan transfüzyonu öyküsü yok.")
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "uc-ekstraintestinal",
      title: "Ekstraintestinal Bulgular",
      blocks: [
        varYok("uc-spa", "SpA (spondiloartropati) öyküsü var mı?",
          "SpA öyküsü mevcut.", "SpA öyküsü yok."),
        varYok("uc-uveit", "Üveit var mı?", "Üveit öyküsü mevcut.", "Üveit yok."),
        {
          id: "uc-oral-aft",
          label: "Oral aft var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [{ name: "sayi", type: "text", label: "Yılda kaç kez", placeholder: "ör. 4" }],
              build: (v) => `Oral aft mevcut (yılda ${v.sayi || "…"} kez).`
            },
            { key: "no", label: "Yok", build: () => "Oral aft yok." },
            SKIP
          ]
        },
        {
          id: "uc-eritema",
          label: "Eritema nodozum durumu",
          default: "skip",
          modes: [
            { key: "aktif", label: "Güncel var", build: () => "Eritema nodozum güncel olarak mevcut." },
            {
              key: "oyku", label: "Öyküsü var (güncel yok)",
              fields: [{ name: "gecmis", type: "text", label: "Geçmiş öykü", placeholder: "ör. 2022'de iki epizod" }],
              build: (v) =>
                `Eritema nodozum öyküsü mevcut, güncel olarak aktif değil (${v.gecmis || "…"}).`
            },
            { key: "yok", label: "Yok", build: () => "Eritema nodozum öyküsü yok." },
            SKIP
          ]
        },
        varYok("uc-psk", "PSK (primer sklerozan kolanjit) öyküsü var mı?",
          "PSK öyküsü mevcut.", "PSK öyküsü yok.")
      ]
    }
  ]
};

/* =========================================================================
 * TİP 2 DİYABETES MELLİTUS ANAMNEZİ
 * ====================================================================== */
const TIP2_DM_SEMA = {
  id: "tip2-dm",
  title: "Tip 2 Diabetes Mellitus Anamnezi",
  groups: [
    /* ---------------------------------------------------------------- */
    {
      id: "dm-tani-takip",
      title: "Tanı, Tedavi ve Metabolik Takip",
      blocks: [
        {
          id: "dm-tani",
          label: "Tanı zamanı ve başvuru şekli biliniyor mu?",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "yil", type: "text", label: "Tanı yılı", placeholder: "ör. 2018" },
                {
                  name: "merkez", type: "select", label: "Başvuru / tanı şekli",
                  options: [
                    "aile hekimliği",
                    "dahiliye polikliniği",
                    "acil servis",
                    "ev ölçümlerinin yüksek gelmesi"
                  ]
                }
              ],
              build: (v) =>
                `Hasta ${v.yil || "…"} yılında ${v.merkez || "…"} başvurusu sonucu tanı almış.`
            },
            SKIP
          ]
        },
        {
          id: "dm-oad",
          label: "Güncel oral antidiyabetik kullanıyor mu?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "oad", type: "text", label: "Oral antidiyabetik(ler) ve doz", placeholder: "ör. metformin 1000 mg 2x1, empagliflozin 10 mg 1x1" }
              ],
              build: (v) => `Güncel olarak ${v.oad || "…"} kullanıyormuş.`
            },
            { key: "no", label: "Yok", build: () => "Oral antidiyabetik kullanmıyormuş." },
            SKIP
          ]
        },
        {
          id: "dm-insulin",
          label: "İnsülin kullanım öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [{ name: "doz", type: "text", label: "İnsülin tipi ve dozları", placeholder: "ör. glarjin 24Ü gece, aspart 3x8Ü" }],
              build: (v) => `İnsülin kullanımı mevcut (${v.doz || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "İnsülin kullanım öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "dm-evde-takip",
          label: "Evde düzenli kan şekeri takibi yapıyor mu?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Yapıyor",
              fields: [
                { name: "acks", type: "text", label: "Açlık kan şekeri", placeholder: "ör. 110-130 mg/dL" },
                { name: "tokluk", type: "text", label: "Tokluk kan şekeri", placeholder: "ör. 160-190 mg/dL" }
              ],
              build: (v) =>
                `Evde düzenli kan şekeri takibi yapıyormuş (açlık: ${v.acks || "…"}, tokluk: ${v.tokluk || "…"}).`
            },
            { key: "no", label: "Yapmıyor", build: () => "Evde düzenli kan şekeri takibi yapmıyormuş." },
            SKIP
          ]
        },
        {
          id: "dm-hba1c",
          label: "Son HbA1c değeri",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "date", label: "Tarih" },
                { name: "deger", type: "text", label: "HbA1c (%)", placeholder: "ör. 7.8" }
              ],
              build: (v) =>
                `Son bakılan HbA1c değeri ${fmtDate(v.tarih)} tarihinde %${v.deger || "…"} olarak sonuçlanmış.`
            },
            SKIP
          ]
        },
        {
          id: "dm-hiperglisemik-acil",
          label: "Hiperglisemik acil servis başvurusu var mı?",
          default: "skip",
          modes: [
            { key: "yes", label: "Var", build: () => "Hiperglisemik acil servis başvurusu öyküsü mevcut." },
            { key: "no", label: "Yok", build: () => "Hiperglisemik acil servis başvurusu yok." },
            SKIP
          ]
        },
        {
          id: "dm-dka-hhs",
          label: "DKA / HHS öyküsü var mı?",
          default: "skip",
          visibleIf: (state) => state["dm-hiperglisemik-acil"] &&
            state["dm-hiperglisemik-acil"].mode === "yes",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "tip", type: "select", label: "Tip", options: ["DKA", "HHS"] },
                { name: "yatis", type: "select", label: "Hastane yatışı", options: ["yatış olmuş", "yatış olmamış"] },
                { name: "gun", type: "text", label: "Yatış süresi (gün)", placeholder: "ör. 5" }
              ],
              build: (v) =>
                `${v.tip || "DKA/HHS"} öyküsü mevcut; ` +
                (v.yatis === "yatış olmamış"
                  ? "bu nedenle hastane yatışı olmamış."
                  : `bu nedenle ${v.gun || "…"} günlük hastane yatışı olmuş.`)
            },
            { key: "no", label: "Yok", build: () => "DKA/HHS öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "dm-hipergli-yatis",
          label: "Hiperglisemi nedenli servis yatışı olmuş mu?",
          default: "skip",
          visibleIf: (state) =>
            state["dm-hiperglisemik-acil"] && state["dm-hiperglisemik-acil"].mode === "yes" &&
            state["dm-dka-hhs"] && state["dm-dka-hhs"].mode === "no",
          modes: [
            { key: "yes", label: "Olmuş", build: () => "Hiperglisemi nedenli servis yatışı olmuş." },
            { key: "no", label: "Olmamış", build: () => "Hiperglisemi nedenli servis yatışı olmamış." },
            SKIP
          ]
        },
        varYok("dm-diyet", "Diyabetik diyet uyumu var mı?",
          "Diyabetik diyet uyumu mevcut.", "Diyabetik diyet uyumu yok."),
        {
          id: "dm-egzersiz",
          label: "Haftalık egzersiz durumu",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [{ name: "egz", type: "text", label: "Egzersiz durumu", placeholder: "ör. Haftada 3 gün 30 dakika tempolu yürüyüş yapıyor" }],
              build: (v) => `${buyukHarfBasla(v.egz || "…")}.`
            },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "dm-goz",
      title: "Diyabetik Retinopati / Göz",
      blocks: [
        varYok("dm-sinek", "Gözlerinde sinek uçuşması var mı?",
          "Gözlerinde sinek uçuşması tarifliyor.", "Gözlerinde sinek uçuşması yok."),
        varYok("dm-elektrik", "Gözlerinde elektrik çarpması hissi var mı?",
          "Gözlerinde elektrik çarpması hissi tarifliyor.", "Gözlerinde elektrik çarpması hissi yok."),
        {
          id: "dm-goz-poliklinik",
          label: "Düzenli yıllık göz hastalıkları polikliniği başvurusu var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [{ name: "son", type: "text", label: "Son başvuru tarihi", placeholder: "ör. Mart 2025" }],
              build: (v) =>
                `Düzenli yıllık göz hastalıkları polikliniği başvurusu mevcut (son başvuru: ${v.son || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "Düzenli yıllık göz hastalıkları polikliniği başvurusu yok." },
            SKIP
          ]
        },
        {
          id: "dm-retinopati",
          label: "Bilinen diyabetik retinopati var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [{ name: "tedavi", type: "text", label: "Tedavi öyküsü", placeholder: "ör. 2023'te bilateral fokal lazer fotokoagülasyon" }],
              build: (v) => `Diyabetik retinopati mevcut (tedavi öyküsü: ${v.tedavi || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "Bilinen diyabetik retinopati yok." },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "dm-nefropati",
      title: "Diyabetik Nefropati",
      blocks: [
        {
          id: "dm-nefro-tarama",
          label: "Diyabetik nefropati açısından tarandı mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Tarandı",
              fields: [
                { name: "tarih", type: "date", label: "Tarama tarihi" },
                { name: "ac", type: "text", label: "Albümin/kreatinin (mg/g)", placeholder: "ör. 28" },
                { name: "pc", type: "text", label: "Protein/kreatinin (mg/g)", placeholder: "ör. 150" }
              ],
              build: (v) =>
                `Diyabetik nefropati açısından en son ${fmtDate(v.tarih)} tarihinde spot idrar ` +
                `albümin/kreatinin ve protein/kreatinin ile taranmış (albümin/kreatinin: ${v.ac || "…"} mg/g, ` +
                `protein/kreatinin: ${v.pc || "…"} mg/g).`
            },
            { key: "no", label: "Taranmamış", build: () => "Diyabetik nefropati açısından daha önce hiç taranmamış." },
            SKIP
          ]
        },
        {
          id: "dm-kreatinin-gfr",
          label: "Güncel kreatinin ve GFR değeri",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "kreatinin", type: "text", label: "Kreatinin", placeholder: "ör. 0.9 mg/dL" },
                { name: "gfr", type: "text", label: "GFR", placeholder: "ör. 88 mL/dk/1.73m²" }
              ],
              build: (v) => `Güncel kreatinin değeri ${v.kreatinin || "…"}, GFR ${v.gfr || "…"} olarak ölçülmüş.`
            },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "dm-noropati",
      title: "Diyabetik Nöropati",
      blocks: [
        {
          id: "dm-noropati-tani",
          label: "Bilinen diyabetik nöropati tanısı var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "yil", type: "text", label: "Tanı yılı", placeholder: "ör. 2021" },
                { name: "emg", type: "select", label: "EMG", options: ["EMG yapılmamış", "EMG yapılmış"] },
                { name: "emgTarih", type: "date", label: "EMG tarihi" },
                { name: "emgSonuc", type: "text", label: "EMG sonucu", placeholder: "ör. sensorimotor polinöropati" },
                { name: "tedavi", type: "text", label: "Nöropati tedavisi", placeholder: "ör. pregabalin 75 mg 2x1" }
              ],
              build: (v) => {
                let s = `${v.yil || "…"} yılında diyabetik nöropati tanısı almış.`;
                if (v.emg === "EMG yapılmış")
                  s += ` ${fmtDate(v.emgTarih)} tarihinde yapılan EMG ${v.emgSonuc || "…"} olarak sonuçlanmış.`;
                if (v.tedavi) s += ` Diyabetik nöropatiye yönelik ${v.tedavi} tedavisi kullanıyormuş.`;
                return s;
              }
            },
            { key: "no", label: "Yok", build: () => "Bilinen diyabetik nöropati tanısı yok." },
            SKIP
          ]
        },
        varYok("dm-yanma", "Ellerde ve ayaklarda yanma/batma/uyuşukluk var mı?",
          "Ellerde ve ayaklarda yanma/batma/uyuşukluk tarifliyor.",
          "Ellerde ve ayaklarda yanma/batma/uyuşukluk yok."),
        {
          id: "dm-eldiven-corap",
          label: "Eldiven-çorap tarzında uyuşma var mı?",
          default: "skip",
          visibleIf: (state) => state["dm-yanma"] && state["dm-yanma"].mode === "yes",
          modes: [
            { key: "yes", label: "Var", build: () => "Uyuşma eldiven-çorap tarzında dağılım gösteriyormuş." },
            { key: "no", label: "Yok", build: () => "Eldiven-çorap tarzında uyuşma yok." },
            SKIP
          ]
        },
        varYok("dm-sicak-soguk", "Sıcak-soğuk ayrımında azalma var mı?",
          "Sıcak-soğuk ayrımında azalma tarifliyor.", "Sıcak-soğuk ayrımında azalma yok."),
        varYok("dm-his-azalma", "Ayaklarda his azalması var mı?",
          "Ayaklarda his azalması mevcut.", "Ayaklarda his azalması yok.")
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "dm-ayak-otonom",
      title: "Diyabetik Ayak ve Otonom Disfonksiyon",
      blocks: [
        {
          id: "dm-ayak",
          label: "Diyabetik ayak öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "taraf", type: "select", label: "Taraf", options: ["sağ", "sol", "bilateral"] },
                { name: "sure", type: "text", label: "Kaç yıl önce", placeholder: "ör. 2 yıl" },
                { name: "tedavi", type: "text", label: "Aldığı tedavi", placeholder: "ör. debridman + antibiyoterapi" }
              ],
              build: (v) =>
                `Diyabetik ayak öyküsü mevcut (${v.taraf || "…"}, ${v.sure || "…"} önce; ` +
                `aldığı tedavi: ${v.tedavi || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "Diyabetik ayak öyküsü yok." },
            SKIP
          ]
        },
        varYok("dm-amputasyon", "Ampütasyon öyküsü var mı?",
          "Ampütasyon öyküsü mevcut.", "Ampütasyon öyküsü yok."),
        varYok("dm-ortostatizm", "Ortostatizm var mı?", "Ortostatizm mevcut.", "Ortostatizm yok."),
        varYok("dm-tasikardi", "İstirahat taşikardisi var mı?",
          "İstirahat taşikardisi mevcut.", "İstirahat taşikardisi yok."),
        varYok("dm-erken-doyma", "Erken doyma var mı?", "Erken doyma tarifliyor.", "Erken doyma yok."),
        varYok("dm-bulanti", "Bulantı-kusma var mı?", "Bulantı-kusma tarifliyor.", "Bulantı-kusma yok."),
        varYok("dm-siskinlik", "Şişkinlik var mı?", "Şişkinlik tarifliyor.", "Şişkinlik yok."),
        varYok("dm-hazimsizlik", "Hazımsızlık var mı?", "Hazımsızlık tarifliyor.", "Hazımsızlık yok."),
        {
          id: "dm-gastroparezi",
          label: "Bilinen diyabetik gastroparezi tanısı var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "tarih", type: "date", label: "Tetkik tarihi" },
                { name: "tetkik", type: "text", label: "Mide boşalma çalışması sonucu", placeholder: "ör. gecikmiş mide boşalması" }
              ],
              build: (v) =>
                `Bilinen diyabetik gastroparezi tanısı mevcut (${fmtDate(v.tarih)} tarihli mide boşalma çalışması: ${v.tetkik || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "Bilinen diyabetik gastroparezi tanısı yok." },
            SKIP
          ]
        },
        varYok("dm-gece-ishal", "Gece ishalleri var mı?", "Gece ishalleri tarifliyor.", "Gece ishalleri yok."),
        {
          id: "dm-donusumlu",
          label: "Dönüşümlü ishal ve kabızlık oluyor mu?",
          default: "skip",
          modes: [
            { key: "yes", label: "Oluyor", build: () => "Dönüşümlü ishal ve kabızlık oluyormuş." },
            { key: "no", label: "Olmuyor", build: () => "Dönüşümlü ishal ve kabızlık olmuyormuş." },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "dm-makrovaskuler",
      title: "Makrovasküler ve Kardiyak Değerlendirme",
      blocks: [
        {
          id: "dm-mi",
          label: "MI (miyokard enfarktüsü) öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "yil", type: "text", label: "CAG yılı", placeholder: "ör. 2020" },
                { name: "pkg", type: "text", label: "Uygulanan PKG", placeholder: "ör. LAD" }
              ],
              build: (v) =>
                `Miyokard enfarktüsü öyküsü mevcut; ${v.yil || "…"} yılında CAG yapılmış ve ` +
                `${v.pkg || "…"} PKG uygulanmış.`
            },
            { key: "no", label: "Yok", build: () => "Miyokard enfarktüsü öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "dm-cabg",
          label: "CABG öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [{ name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 2019" }],
              build: (v) => `CABG öyküsü mevcut (${v.tarih || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "CABG öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "dm-svo",
          label: "SVO öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "tip", type: "select", label: "Tip", options: ["iskemik", "hemorajik"] },
                { name: "sekel", type: "select", label: "Sekel", options: ["sekelsiz", "sekelli"] },
                { name: "sekelDetay", type: "text", label: "Sekel detayı", placeholder: "ör. sağ hemiparezi" }
              ],
              build: (v) =>
                `${buyukHarfBasla(v.tip || "…")} SVO öyküsü mevcut, ${v.sekel || "sekelsiz"}` +
                (v.sekel === "sekelli" ? ` (${v.sekelDetay || "…"})` : "") + "."
            },
            { key: "no", label: "Yok", build: () => "SVO öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "dm-pah",
          label: "PAH (periferik arter hastalığı) var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "kladikasyon", type: "select", label: "Kladikasyon", options: ["kladikasyon mevcut", "kladikasyon yok"] }
              ],
              build: (v) => `Periferik arter hastalığı mevcut (${v.kladikasyon || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "Periferik arter hastalığı öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "dm-periferal-girisim",
          label: "Periferik anjiyografik girişim öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 2022" },
                { name: "islem", type: "text", label: "Yapılan işlem", placeholder: "ör. SFA balon anjiyoplasti + stent" }
              ],
              build: (v) =>
                `Periferik anjiyografik girişim öyküsü mevcut (${v.tarih || "…"}, ${v.islem || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "Periferik anjiyografik girişim öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "dm-fonksiyonel",
          label: "Fonksiyonel kapasite (yastık / merdiven)",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "yastik", type: "text", label: "Kaç yastıkla uyuyor", placeholder: "ör. tek" },
                { name: "merdiven", type: "text", label: "Yorulmadan çıkabildiği kat", placeholder: "ör. 2" }
              ],
              build: (v) =>
                `Hasta ${v.yastik || "…"} yastıkla uyuyormuş. ${v.merdiven || "…"} kat merdiveni ` +
                `yorulmadan çıkabiliyormuş.`
            },
            SKIP
          ]
        },
        varYok("dm-pnd", "PND (paroksismal nokturnal dispne) var mı?",
          "Paroksismal nokturnal dispne tarifliyor.", "Paroksismal nokturnal dispne yok."),
        varYok("dm-ortopne", "Ortopne var mı?", "Ortopne tarifliyor.", "Ortopne yok."),
        varYok("dm-efor-dispne", "Efor dispnesi var mı?", "Efor dispnesi tarifliyor.", "Efor dispnesi yok."),
        {
          id: "dm-eko",
          label: "Son ekokardiyografi",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "date", label: "Tarih" },
                { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. EF %60, diyastolik disfonksiyon" }
              ],
              build: (v) =>
                `Son yapılan ekokardiyografi ${fmtDate(v.tarih)} tarihinde ${v.sonuc || "…"} olarak sonuçlanmış.`
            },
            SKIP
          ]
        }
      ]
    }
  ]
};

/* =========================================================================
 * KONJESTİF KALP YETMEZLİĞİ (KKY) ANAMNEZİ
 * ====================================================================== */
const KKY_SEMA = {
  id: "kky",
  title: "Konjestif Kalp Yetmezliği Anamnezi",
  groups: [
    /* ---------------------------------------------------------------- */
    {
      id: "kky-tani-semptom",
      title: "Tanı, Semptom ve Tedavi",
      blocks: [
        {
          id: "kky-tani",
          label: "Tanı yılı biliniyor mu?",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [{ name: "yil", type: "text", label: "Tanı yılı", placeholder: "ör. 2020" }],
              build: (v) => `${v.yil || "…"} yılında kalp yetmezliği tanısı almış.`
            },
            SKIP
          ]
        },
        {
          id: "kky-semptom",
          type: "symptoms",
          label:
            "Güncel semptomları işaretleyin. Bir semptom tariflenecekse sıklığını seçin; " +
            "yakın zamanda şiddetlendiyse ilgili kutuyu işaretleyin.",
          symptoms: [
            { id: "dispne", label: "dispne" },
            { id: "efor-dispne", label: "efor dispnesi" },
            { id: "gogus-agrisi", label: "göğüs ağrısı" },
            { id: "ortopne", label: "ortopne" },
            { id: "odem", label: "bilateral alt ekstremitede ödem" },
            { id: "pnd", label: "PND" },
            { id: "halsizlik", label: "halsizlik" },
            { id: "karin-siskinlik", label: "karında şişkinlik" },
            { id: "kilo-artisi", label: "istemsiz kilo artışı" },
            { id: "carpinti", label: "çarpıntı" }
          ]
        },
        {
          id: "kky-tedavi",
          label: "Güncel tedavi ve dozları",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                {
                  name: "tedavi", type: "text", label: "Güncel tedavi ve dozları",
                  placeholder: "ör. sakubitril/valsartan 24/26 mg 2x1, dapagliflozin 10 mg 1x1, bisoprolol 5 mg 1x1, spironolakton 25 mg 1x1"
                }
              ],
              build: (v) => `Güncel olarak ${v.tedavi || "…"} kullanıyormuş.`
            },
            SKIP
          ]
        },
        {
          id: "kky-eko",
          label: "Son ekokardiyografi tarihi ve sonucu",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "date", label: "Tarih" },
                { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. EF %30, global hipokinezi, orta MY" }
              ],
              build: (v) =>
                `Son yapılan ekokardiyografi ${fmtDate(v.tarih)} tarihinde ${v.sonuc || "…"} olarak sonuçlanmış.`
            },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "kky-alevlenme",
      title: "Alevlenme ve Yatış Öyküsü",
      blocks: [
        {
          id: "kky-yatis",
          label: "Son 1 yılda kalp yetmezliği alevlenmesi nedeniyle yatış oldu mu?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Oldu",
              fields: [
                { name: "sayi", type: "text", label: "Son 1 yıldaki yatış sayısı", placeholder: "ör. 2" },
                { name: "yer", type: "select", label: "Son yatışın yeri", options: ["yoğun bakım", "servis"] },
                { name: "gun", type: "text", label: "Kaç gün yattığı", placeholder: "ör. 6" },
                { name: "tedavi", type: "text", label: "Aldığı tedaviler", placeholder: "ör. IV diüretik ve inotrop" },
                { name: "taburcu", type: "date", label: "Taburcu tarihi" }
              ],
              build: (v) => {
                const yer = v.yer === "servis"
                  ? "servis koşullarında"
                  : "yoğun bakım ünitesinde";
                return (
                  `Son bir yılda kalp yetmezliği alevlenmesi nedeniyle ${v.sayi || "…"} kez ` +
                  `hastaneye yatışı olmuş. Son yatışı ${yer} ${v.gun || "…"} gün sürmüş; bu süreçte ` +
                  `${v.tedavi || "…"} tedavileri uygulanmış ve ${fmtDate(v.taburcu)} tarihinde taburcu edilmiş.`
                );
              }
            },
            {
              key: "no", label: "Olmadı",
              build: () =>
                "Son bir yılda kalp yetmezliği alevlenmesi nedeniyle hastaneye yatışı olmamış."
            },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "kky-komorbidite",
      title: "Makrovasküler / Komorbidite Öyküsü",
      blocks: [
        {
          id: "kky-mi",
          label: "MI (miyokard enfarktüsü) öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "yil", type: "text", label: "CAG yılı", placeholder: "ör. 2019" },
                { name: "pkg", type: "text", label: "Uygulanan PKG", placeholder: "ör. LAD" }
              ],
              build: (v) =>
                `Miyokard enfarktüsü öyküsü mevcut; ${v.yil || "…"} yılında CAG yapılmış ve ` +
                `${v.pkg || "…"} PKG uygulanmış.`
            },
            { key: "no", label: "Yok", build: () => "Miyokard enfarktüsü öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "kky-svo",
          label: "SVO öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "tip", type: "select", label: "Tip", options: ["iskemik", "hemorajik"] },
                { name: "sekel", type: "select", label: "Sekel", options: ["sekelsiz", "sekelli"] },
                { name: "sekelDetay", type: "text", label: "Sekel detayı", placeholder: "ör. sağ hemiparezi" }
              ],
              build: (v) =>
                `${buyukHarfBasla(v.tip || "…")} SVO öyküsü mevcut, ${v.sekel || "sekelsiz"}` +
                (v.sekel === "sekelli" ? ` (${v.sekelDetay || "…"})` : "") + "."
            },
            { key: "no", label: "Yok", build: () => "SVO öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "kky-pah",
          label: "PAH (periferik arter hastalığı) öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "kladikasyon", type: "select", label: "Kladikasyon", options: ["kladikasyon mevcut", "kladikasyon yok"] },
                { name: "girisim", type: "text", label: "Girişim öyküsü (varsa)", placeholder: "ör. 2022'de SFA stent" }
              ],
              build: (v) =>
                `Periferik arter hastalığı mevcut (${v.kladikasyon || "…"}` +
                (v.girisim ? `; ${v.girisim}` : "") + ")."
            },
            { key: "no", label: "Yok", build: () => "Periferik arter hastalığı öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "kky-kah",
          label: "KAH (koroner arter hastalığı) öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [{ name: "detay", type: "text", label: "Detay", placeholder: "ör. 2018'de LAD'ye PKG, bilinen 2 damar hastalığı" }],
              build: (v) => `Koroner arter hastalığı öyküsü mevcut (${v.detay || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "Bilinen koroner arter hastalığı öyküsü yok." },
            SKIP
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- */
    {
      id: "kky-cihaz-aritmi",
      title: "Cihaz ve Aritmi Öyküsü",
      blocks: [
        {
          id: "kky-cihaz",
          label: "ICD / CRT-D öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "cihaz", type: "select", label: "Cihaz", options: ["ICD", "CRT-D", "CRT-P"] },
                { name: "tarih", type: "text", label: "İmplantasyon tarihi", placeholder: "ör. 2021" },
                { name: "neden", type: "text", label: "Endikasyon (varsa)", placeholder: "ör. primer korunma" }
              ],
              build: (v) =>
                `${v.cihaz || "ICD/CRT-D"} implantasyonu öyküsü mevcut (${v.tarih || "…"}` +
                (v.neden ? `, ${v.neden}` : "") + ")."
            },
            { key: "no", label: "Yok", build: () => "ICD/CRT-D implantasyonu öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "kky-aritmi",
          label: "Hayatı tehdit eden aritmi öyküsü var mı?",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [{ name: "detay", type: "text", label: "Detay", placeholder: "ör. 2022'de VT atağı, kardiyoversiyon" }],
              build: (v) => `Hayatı tehdit eden aritmi öyküsü mevcut (${v.detay || "…"}).`
            },
            { key: "no", label: "Yok", build: () => "Hayatı tehdit eden aritmi öyküsü yok." },
            SKIP
          ]
        }
      ]
    }
  ]
};

/* Semptom matrisi cümle üreticisi */
function buildSymptoms(symptoms, state) {
  const ara = [];
  const sik = [];
  const yok = [];
  const artan = [];

  symptoms.forEach((s) => {
    const st = state[s.id];
    if (!st || st.freq === "atla" || !st.freq) return; // işaretlenmemiş → yok sayılır
    if (st.freq === "ara") ara.push(s.label);
    else if (st.freq === "sik") sik.push(s.label);
    else if (st.freq === "yok") yok.push(s.label);
    if (st.artan && (st.freq === "ara" || st.freq === "sik")) artan.push(s.label);
  });

  if (ara.length === 0 && sik.length === 0 && yok.length === 0) return null;

  const cumleler = [];

  // Mevcut semptomlar (cümle içi parçalar küçük harf; ilk harf sonda büyütülür)
  const mevcutParts = [];
  if (ara.length) mevcutParts.push(`ara sıra ${joinVe(ara)} tarifliyor`);
  if (sik.length) mevcutParts.push(`sık sık ${joinVe(sik)} tarifliyor`);

  let ilkCumle = mevcutParts.join("; ");
  if (yok.length) {
    const yokPart = `${joinVirgul(yok)} yok`;
    ilkCumle = ilkCumle ? `${ilkCumle}; ${yokPart}` : yokPart;
  }
  if (ilkCumle) cumleler.push(buyukHarfBasla(ilkCumle) + ".");

  // Yakın zamanda şiddetlenenler
  if (artan.length) {
    cumleler.push(
      `Son zamanlarda ${joinVe(artan)} şikayetlerinde artış tarifliyor.`
    );
  }

  return cumleler.join(" ");
}
