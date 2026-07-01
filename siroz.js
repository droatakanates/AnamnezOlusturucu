/* =========================================================================
 * SİROZ / KRONİK KARACİĞER HASTALIĞI ANAMNEZİ (Gastroenteroloji sürümü)
 * schema.js yardımcıları + otomatik Child-Pugh ve MELD/MELD-Na hesaplaması.
 * Tetkik tarihleri ay/yıl olarak sorgulanır; ilaç dozları barem ile alınır.
 * ====================================================================== */

function sirozNum(v) { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; }

/* Child-Pugh: bilirubin, albümin, INR, asit, ensefalopati -> {score, cls} | null
   asit: yok/hafif/orta-ağır ; ensefalopati: yok/evre 1..4 */
function childPugh(v) {
  const bil = sirozNum(v.bil), alb = sirozNum(v.alb), inr = sirozNum(v.inr);
  if (bil == null || alb == null || inr == null || !v.asit || !v.ensf) return null;
  const pBil = bil < 2 ? 1 : bil <= 3 ? 2 : 3;
  const pAlb = alb > 3.5 ? 1 : alb >= 2.8 ? 2 : 3;
  const pInr = inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3;
  const pAsit = v.asit === "yok" ? 1 : v.asit === "hafif" ? 2 : 3;
  const pEnsf = v.ensf === "yok" ? 1 : (v.ensf === "evre 1" || v.ensf === "evre 2") ? 2 : 3;
  const score = pBil + pAlb + pInr + pAsit + pEnsf;
  return { score, cls: score <= 6 ? "A" : score <= 9 ? "B" : "C" };
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

/* Pure semptom-kod grubu üreticisi (var/yok/sorgulanmalı) */
function symGrup(id, title, symptoms, noteHeader) {
  return {
    id, title,
    blocks: [{
      id: id + "-kod", type: "symptom-code",
      noteHeader: noteHeader || (title + " —"),
      label: "Her bulguyu kodlayın (bilgi yoksa 'Sorgulanmalı' kalır)", symptoms
    }]
  };
}

const SIROZ_SEMA = {
  id: "siroz",
  title: "Siroz / Kronik Karaciğer Hastalığı Anamnezi",
  groups: [
    /* ===== 1. Başvuru Şikayeti ve Kısa Öykü ===== */
    {
      id: "sir-basvuru",
      title: "Başvuru Şikayeti ve Kısa Öykü",
      blocks: [
        {
          id: "sir-basvuru-detay", label: "Başvuru bilgileri", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Başvuru tarihi", placeholder: "ör. 05.06.2026" },
                { name: "yer", type: "text", label: "Başvuru yeri", placeholder: "ör. acil servise / dahiliye polikliniğine" },
                { name: "sikayet", type: "text", label: "Ana şikayetler", placeholder: "ör. karında şişlik ve bilinç bulanıklığı" }
              ],
              build: (v) => {
                let s = "Hasta";
                if (v.tarih) s += ` ${v.tarih} tarihinde`;
                if (v.yer) s += ` ${v.yer}`;
                return s + ` ${v.sikayet || "…"} şikayetleriyle başvurmuş.`;
              }
            }, SKIP
          ]
        },
        {
          id: "sir-basvuru-seyir", label: "Şikayetlerin başlangıcı ve seyri", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Başlangıç zamanı", placeholder: "ör. yaklaşık 1 hafta önce" },
                { name: "sekil", type: "select", label: "Başlangıç şekli", options: ["ani", "sinsi", "dalgalı", "bilinmiyor"] },
                { name: "seyir", type: "select", label: "Seyir", options: ["artıyor", "azalıyor", "stabil", "tekrarlayıcı"] }
              ],
              build: (v) => {
                let s = "Şikayetleri";
                if (v.zaman) s += ` ${v.zaman}`;
                s += " başlamış";
                if (v.sekil) s += `, başlangıcı ${v.sekil}`;
                if (v.seyir) s += ` ve seyri ${v.seyir}`;
                return s + ".";
              }
            }, SKIP
          ]
        },
        secimBlok("sir-artiran", "Artıran-azaltan faktörler", ["yok", "var", "bilinmiyor"],
          (v) => `Şikayetleri artıran-azaltan faktör ${v === "var" ? "tarifleniyor" : v === "yok" ? "tariflenmiyor" : "bilinmiyor"}.`,
          "Durum"),
        {
          id: "sir-on-degerlendirme", label: "Başvurunun ön değerlendirmesi", default: "skip",
          modes: [
            {
              key: "fill", label: "Belirt",
              fields: [{
                name: "sec", type: "multi", label: "Ön planda değerlendirilenler",
                options: ["hepatik ensefalopati", "enfeksiyon", "GİS kanama", "elektrolit bozukluğu", "nörolojik olay", "ilaç yan etkisi", "diğer nedenler"]
              }],
              build: (v) => `Mevcut başvuru, ön planda ${v.sec && v.sec.length ? joinVe(v.sec) : "…"} açısından değerlendirildi.`
            }, SKIP
          ]
        }
      ]
    },

    /* ===== Eşlik eden semptomlar ===== */
    symGrup("sir-eslik", "Eşlik Eden Semptomlar", [
      { id: "halsizlik", label: "Halsizlik" },
      { id: "bas-donmesi", label: "Baş dönmesi" },
      { id: "yuruyememe", label: "Yürüyememe / dengesizlik" },
      { id: "bilinc", label: "Bilinç bulanıklığı" },
      { id: "uyku-ritim", label: "Uyku-uyanıklık ritminde bozulma" },
      { id: "konfuzyon", label: "Konfüzyon / unutkanlık" },
      { id: "asteriksis", label: "Asteriksis" },
      { id: "ates-enf", label: "Ateş / enfeksiyon bulgusu" },
      { id: "hematemez", label: "Hematemez" },
      { id: "melena", label: "Melena" },
      { id: "hematokezya", label: "Hematokezya" },
      { id: "kabizlik", label: "Kabızlık" },
      { id: "ishal", label: "İshal" },
      { id: "kusma", label: "Kusma" },
      { id: "karin-agri", label: "Karın ağrısı" },
      { id: "karin-sislik", label: "Karında şişlik" },
      { id: "bacak-sislik", label: "Bacaklarda şişlik" }
    ]),

    /* ===== 2. Siroz Tanısının Öyküsü ===== */
    {
      id: "sir-tani",
      title: "Siroz Tanısının Öyküsü",
      blocks: [
        {
          id: "sir-tani-detay", label: "Tanı öyküsü", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "yil", type: "text", label: "Tanı yılı", placeholder: "ör. 2019" },
                { name: "yer", type: "text", label: "Tanı yeri", placeholder: "ör. … Üniversitesi Hastanesi" },
                { name: "sikayet", type: "multi", label: "Tanı sırasındaki şikayetler", options: ["iştahsızlık", "kilo kaybı", "sarılık", "karında şişlik", "ödem", "halsizlik", "kas krampları"] },
                { name: "bulgu", type: "text", label: "Saptanan lab/görüntüleme bulgusu", placeholder: "ör. trombositopeni, USG'de nodüler karaciğer" },
                { name: "merkez", type: "text", label: "Takipli olduğu merkez/bölüm", placeholder: "ör. gastroenteroloji" }
              ],
              build: (v) => {
                let s = `Hastaya ${v.yil || "…"} yılında`;
                if (v.sikayet && v.sikayet.length) s += ` ${joinVe(v.sikayet)} şikayetleriyle başvurduğu`;
                s += ` ${v.yer || "…"} merkezinde yapılan değerlendirmeler sonucunda siroz tanısı konulmuş.`;
                if (v.bulgu) s += ` Tanı sürecinde ${v.bulgu} saptanmış.`;
                if (v.merkez) s += ` Hasta ${v.merkez} bölümü tarafından takipliymiş.`;
                return s;
              }
            }, SKIP
          ]
        },
        durumBlok("sir-biyopsi", "Karaciğer biyopsisi yapıldı mı?", [
          { key: "yes", label: "Yapıldı", fields: [{ name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. evre 4 fibrozis" }], build: (v) => `Karaciğer biyopsisi yapılmış${v.sonuc ? ` (${v.sonuc})` : ""}.` },
          { key: "no", label: "Yapılmadı", build: () => "Karaciğer biyopsisi yapılmamış." },
          { key: "bil", label: "Bilinmiyor", build: () => "Karaciğer biyopsisi yapılıp yapılmadığı bilinmiyor." }
        ]),
        metinBlok("sir-goruntuleme", "Önceki USG / BT / MR bulguları", "Bulgular",
          "ör. nodüler karaciğer, splenomegali, portal ven açık",
          (v) => `Önceki görüntülemelerde ${v} saptanmış.`)
      ]
    },

    /* ===== 3. Siroz Etiyolojisi — Genel ===== */
    {
      id: "sir-etiyoloji",
      title: "Siroz Etiyolojisi",
      blocks: [
        {
          id: "sir-viral", label: "Viral hepatit belirteçleri", default: "skip",
          modes: [
            {
              key: "fill", label: "Belirt",
              fields: [
                { name: "hbv", type: "select", label: "HBV", options: ["bilinmiyor", "negatif", "pozitif"] },
                { name: "hcv", type: "select", label: "HCV", options: ["bilinmiyor", "negatif", "pozitif"] },
                { name: "hdv", type: "select", label: "HDV", options: ["bilinmiyor", "negatif", "pozitif"] },
                { name: "hiv", type: "select", label: "HIV", options: ["bilinmiyor", "negatif", "pozitif"] }
              ],
              build: (v) => `Viral belirteçlerden HBV ${v.hbv || "bilinmiyor"}, HCV ${v.hcv || "bilinmiyor"}, HDV ${v.hdv || "bilinmiyor"}, HIV ${v.hiv || "bilinmiyor"} olarak öğrenilmiş.`
            }, SKIP
          ]
        },
        metinBlok("sir-demir", "Hemokromatozis / demir yükü değerlendirmesi", "Değerler",
          "ör. ferritin, transferrin satürasyonu, HFE",
          (v) => `Demir yükü açısından ${v} değerlendirilmiş.`),
        secimBlok("sir-herediter", "Wilson / alfa-1 antitripsin / ilaç-toksin maruziyeti",
          ["sorgulanmalı", "dışlanmış", "bilinmiyor"],
          (v) => `Wilson hastalığı, alfa-1 antitripsin eksikliği ve ilaç/toksin maruziyeti açısından durum: ${v}.`, "Durum"),
        secimBlok("sir-aile-kc", "Ailede karaciğer hastalığı", ["yok", "var", "bilinmiyor"],
          (v) => `Ailede karaciğer hastalığı öyküsü ${v}.`, "Durum"),
        secimBlok("sir-etiyoloji-ozet", "Öne çıkan etiyoloji",
          ["alkol ilişkili karaciğer hastalığı", "viral hepatit (HBV/HCV)", "MASLD/MASH",
            "otoimmün hepatit", "PBC/PSC", "herediter/metabolik neden", "nedeni bilinmeyen (kriptojenik)", "Diğer"],
          (v) => `Hastanın siroz etyolojisi mevcut bilgilerle ${v} ile ilişkili olarak değerlendirilmiş; ancak viral hepatit, metabolik karaciğer hastalığı, otoimmün/kolestatik hastalıklar ve herediter nedenlere yönelik dışlama süreci ayrıca sorgulanmalıdır.`,
          "Etiyoloji")
      ]
    },
    symGrup("sir-metabolik", "Metabolik Risk", [
      { id: "obezite", label: "Obezite" },
      { id: "dm", label: "Tip 2 DM" },
      { id: "dislipidemi", label: "Dislipidemi" },
      { id: "masld", label: "MASLD/MASH düşündüren öykü" }
    ]),
    symGrup("sir-otoimmun", "Otoimmün / Kolestatik Hastalık", [
      { id: "aih", label: "Otoimmün hepatit" },
      { id: "pbc-psc", label: "PBC / PSC" }
    ]),

    /* ===== 4.1 Hepatik Ensefalopati ===== */
    {
      id: "sir-he",
      title: "Hepatik Ensefalopati — Öykü",
      blocks: [
        varYokDetay("sir-he-atak", "Daha önce HE atağı var mı?",
          [
            { name: "tarih", type: "text", label: "Atak tarihi (ay/yıl)", placeholder: "ör. 03/2025" },
            { name: "sekil", type: "multi", label: "Başvuru şekli", options: ["bilinç bulanıklığı", "uykuya meyil", "konfüzyon", "dengesizlik", "kişilik değişikliği", "asteriksis", "koma"] },
            { name: "yatis", type: "select", label: "Hastane yatışı", options: ["olmuş", "olmamış"] }
          ],
          (v) => `Daha önce hepatik ensefalopati atağı öyküsü mevcut${v.tarih ? ` (${v.tarih})` : ""}` +
            (v.sekil && v.sekil.length ? `; ${joinVe(v.sekil)} şeklinde başvurmuş` : "") +
            `; bu nedenle hastane yatışı ${v.yatis || "…"}.`,
          "Daha önce hepatik ensefalopati atağı tariflenmiyor."),
        metinBlok("sir-he-diski", "Güncel günlük dışkılama sayısı", "Sayı", "ör. 3",
          (v) => `Güncel günlük dışkılama sayısı ${v} kez/gün olarak tarifleniyor.`),
        secimBlok("sir-he-laktuloz", "Laktüloz kullanımı", ["düzenli", "düzensiz", "kullanmıyor"],
          (v) => `Laktülozu ${v} kullanıyormuş.`, "Kullanım"),
        secimBlok("sir-he-rifaksimin", "Rifaksimin kullanımı", ["düzenli", "düzensiz", "kullanmıyor"],
          (v) => `Rifaksimini ${v} kullanıyormuş.`, "Kullanım"),
        {
          id: "sir-he-ozet", label: "HE öyküsü özeti", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "uyum", type: "select", label: "HE ile uyum", options: ["uyumlu", "kısmen uyumlu", "uyumlu değil"] },
                { name: "tetik", type: "text", label: "Öne çıkan tetikleyici(ler)", placeholder: "ör. kabızlık ve enfeksiyon" }
              ],
              build: (v) => `Hastanın öyküsü hepatik ensefalopati açısından ${v.uyum || "…"}` +
                (v.tetik ? `; olası tetikleyiciler arasında ${v.tetik} öne çıkmaktadır` : "") + "."
            }, SKIP
          ]
        }
      ]
    },
    symGrup("sir-he-tetik", "HE Tetikleyicileri", [
      { id: "t-kabizlik", label: "Kabızlık" },
      { id: "t-gis", label: "GİS kanama" },
      { id: "t-enf", label: "Enfeksiyon" },
      { id: "t-dehidr", label: "Dehidratasyon" },
      { id: "t-elektrolit", label: "Hipokalemi / hiponatremi / metabolik bozukluk" },
      { id: "t-sedatif", label: "Sedatif/benzodiazepin/antipsikotik/opioid kullanımı" },
      { id: "t-uyumsuz", label: "Laktüloz/rifaksimin uyumsuzluğu" },
      { id: "t-protein", label: "Aşırı protein kısıtlaması" },
      { id: "t-bilinmeyen", label: "Bilinmeyen tetikleyici" }
    ]),

    /* ===== 4.2 Assit ve SBP ===== */
    {
      id: "sir-assit",
      title: "Assit ve Spontan Bakteriyel Peritonit — Öykü",
      blocks: [
        varYokDetay("sir-assit-oyku", "Assit öyküsü var mı?",
          [{ name: "ilk", type: "text", label: "İlk saptanma (ay/yıl)", placeholder: "ör. 06/2023" }],
          (v) => `Assit öyküsü mevcut${v.ilk ? ` (ilk ${v.ilk} tarihinde saptanmış)` : ""}.`,
          "Assit öyküsü yok."),
        varYok("sir-parasentez", "Parasentez öyküsü var mı?", "Parasentez öyküsü mevcut.", "Parasentez öyküsü yok."),
        varYok("sir-sbp", "SBP öyküsü var mı?", "Spontan bakteriyel peritonit öyküsü mevcut.", "Spontan bakteriyel peritonit öyküsü yok."),
        {
          id: "sir-diuretik", label: "Diüretik kullanımı", default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "ilac", type: "multi", label: "İlaç(lar)", options: ["spironolakton", "furosemid"] },
                { name: "uyum", type: "select", label: "Uyum", options: ["düzenli", "düzensiz"] }
              ],
              build: (v) => `Diüretik olarak ${v.ilac && v.ilac.length ? joinVe(v.ilac) : "…"} kullanıyormuş; uyumu ${v.uyum || "…"}.`
            },
            { key: "no", label: "Yok", build: () => "Diüretik kullanmıyormuş." }, SKIP
          ]
        },
        secimBlok("sir-tuz", "Tuz kısıtlaması uyumu", ["iyi", "kötü", "bilinmiyor"],
          (v) => `Tuz kısıtlamasına uyumu ${v}.`, "Uyum")
      ]
    },
    symGrup("sir-assit-son", "Assit — Son Dönem Bulguları", [
      { id: "sislik-artis", label: "Son dönemde karında şişlik artışı" },
      { id: "ates", label: "Ateş" },
      { id: "karin-agrisi", label: "Karın ağrısı" },
      { id: "ensef-artis", label: "Ensefalopati artışı" }
    ]),

    /* ===== 4.3 Varis ve GİS Kanama ===== */
    {
      id: "sir-varis",
      title: "Varis ve GİS Kanama — Öykü",
      blocks: [
        varYokDetay("sir-endoskopi", "Daha önce endoskopi yapıldı mı?",
          [
            { name: "tarih", type: "text", label: "Tarih (ay/yıl)", placeholder: "ör. 03/2025" },
            { name: "bulgu", type: "multi", label: "Bulgular", options: ["özofagus varisi", "gastrik varis", "portal hipertansif gastropati", "bulgu yok"] },
            { name: "derece", type: "text", label: "Varis derecesi", placeholder: "ör. grade 2" }
          ],
          (v) => `Son üst GİS endoskopisi ${v.tarih || "…"} tarihinde yapılmış` +
            (v.bulgu && v.bulgu.length ? `; ${joinVe(v.bulgu)} saptanmış` : "") +
            (v.derece ? ` (varis derecesi: ${v.derece})` : "") + ".",
          "Daha önce endoskopi yapılmamış / bilinmiyor.", "Yapıldı", "Yapılmadı"),
        {
          id: "sir-nsbb", label: "Non-selektif beta bloker kullanımı", default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "ilac", type: "select", label: "İlaç", options: ["karvedilol", "propranolol", "nadolol"] },
                { name: "uyum", type: "select", label: "Uyum", options: ["düzenli", "düzensiz"] }
              ],
              build: (v) => `Varis profilaksisi için ${v.ilac || "NSBB"} kullanıyormuş; uyumu ${v.uyum || "…"} (doz için medikal tedavi bölümüne bakınız).`
            },
            { key: "no", label: "Yok", build: () => "Non-selektif beta bloker kullanmıyormuş." }, SKIP
          ]
        },
        metinBlok("sir-planli-endoskopi", "Planlı endoskopi tarihi (ay/yıl)", "Tarih", "ör. 09/2026",
          (v) => `Planlı kontrol endoskopisi ${v} olarak planlanmış.`)
      ]
    },
    symGrup("sir-gis-bulgu", "Varis / GİS Kanama Bulguları", [
      { id: "ust-gis", label: "Üst GİS kanama öyküsü" },
      { id: "hematemez", label: "Hematemez" },
      { id: "melena", label: "Melena" },
      { id: "hematokezya", label: "Hematokezya" },
      { id: "ligasyon", label: "Band ligasyonu / skleroterapi öyküsü" }
    ]),

    /* ===== 4.4 Sarılık, Kolestaz, Kaşıntı ===== */
    symGrup("sir-sarilik", "Sarılık / Kolestaz", [
      { id: "sarilik", label: "Sarılık" },
      { id: "ikter", label: "Skleralarda ikter" },
      { id: "kasinti", label: "Kaşıntı" },
      { id: "koyu-idrar", label: "Koyu idrar" },
      { id: "acik-diski", label: "Açık renkli dışkı" },
      { id: "bilirubin-artis", label: "Son dönemde bilirubin artışı" }
    ]),
    {
      id: "sir-safra",
      title: "Safra Yolu ve Kolanjit — Öykü",
      blocks: [
        secimBlok("sir-safra-yolu", "Safra yolu patolojisi / taş öyküsü", ["yok", "var", "bilinmiyor"],
          (v) => `Safra yolu patolojisi / taş öyküsü ${v}.`, "Durum")
      ]
    },
    symGrup("sir-kolanjit", "Kolanjit Bulguları", [
      { id: "ates", label: "Ateş" },
      { id: "sag-ust-agri", label: "Sağ üst kadran ağrısı" },
      { id: "titreme", label: "Titreme" }
    ]),

    /* ===== 4.5 HCC Taraması ===== */
    {
      id: "sir-hcc",
      title: "Hepatosellüler Karsinom Taraması",
      blocks: [
        metinBlok("sir-hcc-usg", "Son karaciğer USG tarihi (ay/yıl)", "Tarih", "ör. 02/2025",
          (v) => `Son karaciğer ultrasonografisi ${v} tarihinde yapılmış.`),
        {
          id: "sir-hcc-afp", label: "Son AFP tarihi ve değeri", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih (ay/yıl)", placeholder: "ör. 02/2025" },
                { name: "deger", type: "text", label: "AFP değeri", placeholder: "ör. 4 ng/mL" }
              ],
              build: (v) => `Son AFP değeri ${v.tarih || "…"} tarihinde ${v.deger || "…"} olarak sonuçlanmış.`
            }, SKIP
          ]
        },
        secimBlok("sir-hcc-lezyon", "USG/BT/MR'da fokal lezyon", ["yok", "var", "bilinmiyor"],
          (v) => `Görüntülemede fokal lezyon ${v}.`, "Durum"),
        secimBlok("sir-hcc-duzen", "HCC taraması düzenli mi?", ["evet", "hayır", "bilinmiyor"],
          (v) => `HCC taramasının düzenli olup olmadığı: ${v}.`, "Durum"),
        varYok("sir-hcc-eksik", "Eksik tetkik / kaçırılan randevu var mı?",
          "Eksik tetkik veya kaçırılan randevu öyküsü mevcut.", "Eksik tetkik veya kaçırılan randevu tariflenmiyor.")
      ]
    },

    /* ===== 5. Portal Hipertansiyon ve KKH Bulguları ===== */
    symGrup("sir-portal", "Portal Hipertansiyon ve Kronik Karaciğer Hastalığı Bulguları", [
      { id: "splenomegali", label: "Splenomegali" },
      { id: "trombositopeni", label: "Trombositopeni" },
      { id: "caput", label: "Caput medusae / abdominal kollateraller" },
      { id: "spider", label: "Spider anjiom" },
      { id: "palmar", label: "Palmar eritem" },
      { id: "jinekomasti", label: "Jinekomasti" },
      { id: "testis", label: "Testiküler atrofi / libido azalması" },
      { id: "sarkopeni", label: "Kas kaybı / sarkopeni" },
      { id: "kilo-kaybi", label: "Kilo kaybı" },
      { id: "kramp", label: "Kas krampları" },
      { id: "malnutrisyon", label: "Malnütrisyon bulguları" }
    ]),

    /* ===== 6. İlaç Öyküsü ve Tedavi Uyumu (doz barem ile) ===== */
    {
      id: "sir-medikal",
      title: "İlaç Öyküsü ve Tedavi Uyumu",
      blocks: [
        {
          id: "sir-medikal-doz", label: "Medikal tedavi (doz ile)", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "laktuloz", type: "text", label: "Laktüloz", placeholder: "barem: 3x30 mL, günde 2-3 yumuşak dışkı olacak şekilde titre" },
                { name: "rifaksimin", type: "text", label: "Rifaksimin", placeholder: "barem: 550 mg 2x1" },
                { name: "nsbb", type: "text", label: "NSBB (karvedilol/propranolol/nadolol)", placeholder: "barem: karvedilol 6.25 mg 2x1 / propranolol 20-40 mg 2x1 / nadolol 20-40 mg 1x1" },
                { name: "diuretik", type: "text", label: "Diüretik (spironolakton/furosemid)", placeholder: "barem: spironolakton 100 mg + furosemid 40 mg (100:40 oranı)" },
                { name: "ppi", type: "text", label: "PPI", placeholder: "barem: pantoprazol 40 mg 1x1" },
                { name: "vitamin", type: "text", label: "Vitamin destekleri", placeholder: "ör. tiamin, folik asit, D vitamini" },
                { name: "psikiyatri", type: "text", label: "Psikiyatrik ilaçlar", placeholder: "ör. ketiapin 25 mg gece" },
                { name: "parasetamol", type: "text", label: "Parasetamol", placeholder: "barem: ≤2 g/gün" }
              ],
              build: (v) => {
                const L = [
                  ["laktüloz", v.laktuloz], ["rifaksimin", v.rifaksimin], ["NSBB", v.nsbb],
                  ["diüretik", v.diuretik], ["PPI", v.ppi], ["vitamin desteği", v.vitamin],
                  ["psikiyatrik ilaç", v.psikiyatri], ["parasetamol", v.parasetamol]
                ].filter((x) => x[1] != null && String(x[1]).trim() !== "").map((x) => `${x[0]} ${x[1]}`);
                return L.length ? `Güncel medikal tedavisinde ${joinVe(L)} mevcut.` : "Güncel medikal tedavi bilgisi net öğrenilemedi.";
              }
            }, SKIP
          ]
        },
        {
          id: "sir-uyum", label: "Tedavi uyumu değerlendirmesi", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "uyum", type: "select", label: "Laktüloz/rifaksimin/NSBB/diüretik uyumu", options: ["düzenli", "düzensiz", "kısmen", "net öğrenilemedi"] },
                { name: "tetik", type: "select", label: "Uyumsuzluk tetikleyici mi?", options: ["mevcut tabloyu tetiklemiş olabilir", "tetikleyici olarak düşünülmedi"] }
              ],
              build: (v) => `Siroza yönelik önerilen tedavilere (laktüloz/rifaksimin/NSBB/diüretik) uyumu ${v.uyum || "…"} olarak değerlendirilmiş; ilaç uyumsuzluğu ${v.tetik || "…"}.`
            }, SKIP
          ]
        }
      ]
    },
    symGrup("sir-ilac-diger", "Diğer İlaç / Madde Kullanımı", [
      { id: "benzo", label: "Benzodiazepin / sedatif kullanımı" },
      { id: "nsaii", label: "NSAİİ kullanımı" },
      { id: "bitkisel", label: "Bitkisel ürün / takviye" },
      { id: "antibiyotik", label: "Antibiyotik kullanımı" }
    ]),

    /* ===== 7. Enfeksiyon ve Tetikleyici Sorgusu ===== */
    symGrup("sir-enfeksiyon", "Enfeksiyon ve Tetikleyici Sorgusu", [
      { id: "ates", label: "Ateş" },
      { id: "solunum", label: "Öksürük / balgam / dispne" },
      { id: "dizuri", label: "Dizüri / sık idrara çıkma" },
      { id: "karin-agri", label: "Karın ağrısı" },
      { id: "diyare", label: "Diyare" },
      { id: "cilt-enf", label: "Cilt-yumuşak doku enfeksiyonu bulgusu" },
      { id: "gis-kanama", label: "Son günlerde GİS kanama" },
      { id: "kabizlik", label: "Kabızlık" },
      { id: "dehidr", label: "Dehidratasyon / az oral alım" },
      { id: "yeni-ilac", label: "Yeni başlanan ilaç" },
      { id: "alkol-relaps", label: "Alkol relapsı" },
      { id: "travma", label: "Travma / düşme / nörolojik semptom" }
    ]),
    {
      id: "sir-enf-ozet",
      title: "Enfeksiyon / Tetikleyici — Özet",
      blocks: [
        metinBlok("sir-enf-ozet-metin", "Tetikleyici değerlendirme özeti", "Özet",
          "ör. idrar yolu enfeksiyonu ve kabızlık",
          (v) => `Akut dekompansasyonu tetikleyebilecek enfeksiyon, kanama, kabızlık, elektrolit bozukluğu, ilaç kullanımı ve alkol relapsı açısından öyküde ${v} saptandı.`)
      ]
    },

    /* ===== 8. Alkol ve Madde Kullanımı ===== */
    {
      id: "sir-alkol",
      title: "Alkol ve Madde Kullanımı",
      blocks: [
        {
          id: "sir-alkol-detay", label: "Alkol / madde / sigara öyküsü", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "sure", type: "text", label: "Kullanım süresi", placeholder: "ör. 20 yıl" },
                { name: "miktar", type: "text", label: "Günlük/haftalık miktar", placeholder: "ör. günde 1 şişe şarap" },
                { name: "tur", type: "text", label: "İçki türü", placeholder: "ör. şarap / rakı" },
                { name: "son", type: "text", label: "Son kullanım", placeholder: "ör. 2 yıl önce / 03/2024" },
                { name: "birakma", type: "select", label: "Bırakma girişimi", options: ["var", "yok", "bilinmiyor"] },
                { name: "amatem", type: "select", label: "AMATEM / psikiyatri takibi", options: ["var", "yok"] },
                { name: "yoksunluk", type: "select", label: "Yoksunluk öyküsü", options: ["var", "yok"] },
                { name: "dt", type: "select", label: "Deliryum tremens / nöbet", options: ["var", "yok"] },
                { name: "madde", type: "select", label: "Madde kullanımı", options: ["yok", "var"] },
                { name: "sigara", type: "text", label: "Sigara (paket-yıl)", placeholder: "ör. 20 paket-yıl / yok" }
              ],
              build: (v) => {
                const p = [];
                if (v.sure || v.miktar || v.tur)
                  p.push(`Hastanın ${[v.sure, "süreyle", v.miktar, v.tur, "alkol"].filter(Boolean).join(" ")} kullanım öyküsü mevcut`);
                if (v.son) p.push(`son kullanımı ${v.son}`);
                if (v.birakma) p.push(`bırakma girişimi ${v.birakma}`);
                if (v.amatem) p.push(`AMATEM/psikiyatri takibi ${v.amatem}`);
                if (v.yoksunluk) p.push(`yoksunluk öyküsü ${v.yoksunluk}`);
                if (v.dt) p.push(`deliryum tremens/nöbet ${v.dt}`);
                let s = p.length ? buyukHarfBasla(p.join("; ")) + "." : "";
                const ek = [];
                if (v.madde) ek.push(`madde kullanımı ${v.madde}`);
                if (v.sigara) ek.push(`sigara ${v.sigara}`);
                if (ek.length) s += (s ? " " : "") + buyukHarfBasla(ek.join(", ")) + ".";
                return s || "Alkol ve madde kullanım bilgisi net öğrenilemedi.";
              }
            }, SKIP
          ]
        }
      ]
    },

    /* ===== 9. Beslenme, Fonksiyonel Durum ve Sosyal Öykü ===== */
    {
      id: "sir-beslenme",
      title: "Beslenme, Fonksiyonel Durum ve Sosyal Öykü",
      blocks: [
        {
          id: "sir-beslenme-detay", label: "Beslenme durumu", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "kilo", type: "text", label: "Son 6 ayda kilo kaybı", placeholder: "ör. 6 kg / yok" },
                { name: "istah", type: "select", label: "İştah", options: ["iyi", "azalmış"] },
                { name: "protein", type: "select", label: "Günlük protein alımı", options: ["yeterli", "yetersiz", "bilinmiyor"] },
                { name: "tuz", type: "select", label: "Tuz kısıtlaması", options: ["uyuyor", "uymuyor", "bilinmiyor"] }
              ],
              build: (v) => {
                const p = [];
                if (v.kilo) p.push(`son 6 ayda kilo kaybı: ${v.kilo}`);
                if (v.istah) p.push(`iştah ${v.istah}`);
                if (v.protein) p.push(`günlük protein alımı ${v.protein}`);
                if (v.tuz) p.push(`tuz kısıtlamasına ${v.tuz}`);
                return p.length ? buyukHarfBasla(p.join(", ")) + "." : "Beslenme bilgisi net öğrenilemedi.";
              }
            }, SKIP
          ]
        },
        {
          id: "sir-fonksiyonel", label: "Fonksiyonel ve sosyal durum", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "aktivite", type: "select", label: "Günlük aktivite düzeyi", options: ["bağımsız", "kısmen bağımlı", "bağımlı"] },
                { name: "dusme", type: "select", label: "Düşme öyküsü", options: ["yok", "var"] },
                { name: "yurume", type: "select", label: "Yürüyememe / dengesizlik", options: ["yok", "var"] },
                { name: "evbakim", type: "select", label: "Evde bakım desteği", options: ["var", "yok"] },
                { name: "sosyal", type: "select", label: "Sosyal destek", options: ["iyi", "kısıtlı", "bilinmiyor"] }
              ],
              build: (v) => {
                const p = [];
                if (v.aktivite) p.push(`günlük aktivite düzeyi ${v.aktivite}`);
                if (v.dusme) p.push(`düşme öyküsü ${v.dusme}`);
                if (v.yurume) p.push(`yürüyememe/dengesizlik ${v.yurume}`);
                if (v.evbakim) p.push(`evde bakım desteği ${v.evbakim}`);
                if (v.sosyal) p.push(`sosyal destek ${v.sosyal}`);
                return p.length ? buyukHarfBasla(p.join(", ")) + "." : "Fonksiyonel/sosyal durum net öğrenilemedi.";
              }
            }, SKIP
          ]
        },
        metinBlok("sir-beslenme-yorum", "Ensefalopati / sarkopeni açısından yorum", "Yorum",
          "ör. sarkopeni ve yetersiz protein alımı HE riskini artırıyor",
          (v) => `Ensefalopati ve sarkopeni açısından değerlendirildiğinde ${v}.`)
      ]
    },

    /* ===== 10. Özgeçmiş, Soygeçmiş ===== */
    symGrup("sir-ozgecmis", "Özgeçmiş / Soygeçmiş", [
      { id: "malignite", label: "Malignite öyküsü" },
      { id: "cerrahi", label: "Cerrahi öykü" },
      { id: "aile-kc", label: "Ailede karaciğer hastalığı" },
      { id: "aile-herediter", label: "Ailede hemokromatozis / viral hepatit / erken yaşta siroz" }
    ]),
    {
      id: "sir-skor",
      title: "Skorlama ve Klinik Durum",
      blocks: [
        {
          id: "sir-skor-hesap", label: "Child-Pugh / MELD-Na (otomatik) ve klinik evreleme", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "bil", type: "text", label: "Total bilirubin (mg/dL)", placeholder: "ör. 3.2" },
                { name: "alb", type: "text", label: "Albümin (g/dL)", placeholder: "ör. 2.6" },
                { name: "inr", type: "text", label: "INR", placeholder: "ör. 1.8" },
                { name: "kreatinin", type: "text", label: "Kreatinin (mg/dL)", placeholder: "ör. 1.3" },
                { name: "sodyum", type: "text", label: "Sodyum (mmol/L)", placeholder: "ör. 131" },
                { name: "asit", type: "select", label: "Assit", options: ["yok", "hafif", "orta-ağır"] },
                { name: "ensf", type: "select", label: "Ensefalopati", options: ["yok", "evre 1", "evre 2", "evre 3", "evre 4"] }
              ],
              build: (v) => {
                const parts = [];
                const cp = childPugh(v);
                if (cp) parts.push(`Child-Pugh ${cp.score} puan (sınıf ${cp.cls})`);
                const m = meldScore(v);
                if (m) parts.push(`MELD ${m.meld}${m.na != null ? `, MELD-Na ${m.na}` : ""}`);
                let s = parts.length ? "Hesaplanan " + parts.join("; ") + "." : "";
                const ek = [];
                if (v.ensf) ek.push(`ensefalopati ${v.ensf === "yok" ? "yok" : v.ensf}`);
                if (v.asit) ek.push(`assit ${v.asit}`);
                if (ek.length) s += (s ? " " : "") + buyukHarfBasla(ek.join(", ")) + ".";
                return s || "Child-Pugh/MELD hesaplaması için bilirubin, albümin, INR, kreatinin, sodyum ve assit/ensefalopati derecesi sorgulanmalı.";
              }
            }, SKIP
          ]
        }
      ]
    }
  ]
};
