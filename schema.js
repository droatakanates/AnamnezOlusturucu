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
