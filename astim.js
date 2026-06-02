/* =========================================================================
 * ASTIM ANAMNEZİ
 * schema.js içindeki yardımcılara bağlıdır (varYok, varYokDetay, metinBlok,
 * secimBlok, durumBlok, checklistVarYok, checklistCustom, fmtDate, joinVe ...).
 * ====================================================================== */

/* SFT değerini "X L (%Y)" biçiminde, boş olanları atlayarak yazar */
function astSft(L, p) {
  const a = L ? `${L} L` : "";
  const b = p ? `%${p}` : "";
  if (a && b) return `${a} (${b})`;
  return a || b || "…";
}

const ASTIM_SEMA = {
  id: "astim",
  title: "Astım Anamnezi",
  groups: [
    /* ---- 1. Tanı ve Takip ---- */
    {
      id: "ast-tani",
      title: "Astım Tanı ve Takip Öyküsü",
      blocks: [
        {
          id: "ast-tani-bilgi",
          label: "Astım tanısı: zaman, yer, yaş",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2010 yılında / çocuklukta" },
                { name: "yer", type: "text", label: "Tanı yeri", placeholder: "ör. göğüs hastalıkları polikliniğinde" },
                { name: "yas", type: "text", label: "Tanı yaşı", placeholder: "ör. 12" }
              ],
              build: (v) =>
                `${buyukHarfBasla(v.zaman || "…")} astım tanısı almış` +
                (v.yas ? `; tanı yaşı ${v.yas}'miş` : "") + "." +
                (v.yer ? ` Tanısı ${v.yer} konulmuş.` : "")
            },
            SKIP
          ]
        },
        varYokDetay("ast-takip", "Daha önce göğüs hastalıkları/alerji takibi var mı?",
          [{ name: "son", type: "text", label: "Son kontrol tarihi", placeholder: "ör. Şubat 2025" }],
          (v) => `Göğüs hastalıkları/alerji polikliniğinde takipliymiş (son kontrolü ${v.son || "…"}).`,
          "Daha önce göğüs hastalıkları/alerji takibi yokmuş."),
        durumBlok("ast-sft", "Tanı sırasında veya takipte SFT/spirometri yapılmış mı?", [
          {
            key: "var", label: "Var",
            fields: [
              { name: "tarih", type: "date", label: "Son SFT tarihi" },
              { name: "fev1L", type: "text", label: "FEV1 (L)", placeholder: "ör. 2.6" },
              { name: "fev1p", type: "text", label: "FEV1 (%)", placeholder: "ör. 80" },
              { name: "fvcL", type: "text", label: "FVC (L)", placeholder: "ör. 3.3" },
              { name: "fvcp", type: "text", label: "FVC (%)", placeholder: "ör. 88" },
              { name: "oran", type: "text", label: "FEV1/FVC", placeholder: "ör. 0.78" }
            ],
            build: (v) =>
              `En son ${fmtDate(v.tarih)} tarihinde yapılan solunum fonksiyon testinde ` +
              `FEV1 ${astSft(v.fev1L, v.fev1p)}, FVC ${astSft(v.fvcL, v.fvcp)}, ` +
              `FEV1/FVC ${v.oran || "…"} olarak ölçülmüş.`
          },
          { key: "yok", label: "Yok", build: () => "Tanı sırasında veya takipte SFT/spirometri yapılmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "SFT/spirometri yapılıp yapılmadığı bilinmiyormuş." }
        ]),
        durumBlok("ast-reversibilite", "Bronkodilatör reversibilitesi", [
          { key: "var", label: "Var", build: () => "Bronkodilatör reversibilitesi gösterilmiş." },
          { key: "yok", label: "Yok", build: () => "Bronkodilatör reversibilitesi gösterilememiş." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Bronkodilatör reversibilitesi bilinmiyormuş." }
        ]),
        varYokDetay("ast-pef", "PEF takibi yapıyor mu?",
          [
            { name: "eniyi", type: "text", label: "Kişisel en iyi PEF (L/dk)", placeholder: "ör. 480" },
            { name: "basvuru", type: "text", label: "Başvuru PEF (L/dk)", placeholder: "ör. 300" },
            { name: "oran", type: "text", label: "Başvuru / en iyi PEF (%)", placeholder: "ör. 62" }
          ],
          (v) => `Düzenli PEF takibi yapıyormuş; kişisel en iyi PEF değeri ${v.eniyi || "…"} L/dk, başvurudaki PEF değeri ${v.basvuru || "…"} L/dk (en iyi değerin %${v.oran || "…"}'i) imiş.`,
          "Düzenli PEF takibi yapmıyormuş."),
        secimBlok("ast-fenotip", "Astım tipi / fenotipi daha önce belirtilmiş mi?",
          ["Alerjik astım", "Non-alerjik astım", "Eozinofilik astım", "Egzersiz ilişkili astım",
            "Mesleki astım", "Aspirin duyarlı astım", "Ağır astım", "Bilinmiyor", "Diğer"],
          (v) => v === "Bilinmiyor"
            ? "Astım tipi/fenotipi daha önce belirtilmemiş."
            : `Daha önce ${v.toLocaleLowerCase("tr")} olarak değerlendirilmiş.`,
          "Tip/fenotip")
      ]
    },

    /* ---- 2. Bazal Astım Kontrolü ---- */
    {
      id: "ast-kontrol",
      title: "Bazal Astım Kontrolü",
      blocks: [
        varYokDetay("ast-gunduz", "Son 4 haftada gündüz astım semptomları var mı?",
          [{ name: "gun", type: "text", label: "Haftada kaç gün", placeholder: "ör. 3" }],
          (v) => `Son 4 haftada gündüz astım semptomları haftada ${v.gun || "…"} gün oluyormuş.`,
          "Son 4 haftada gündüz astım semptomu olmamış."),
        varYokDetay("ast-gece", "Son 4 haftada gece uyanması var mı?",
          [{ name: "kez", type: "text", label: "Haftada/ayda kaç kez", placeholder: "ör. ayda 2" }],
          (v) => `Son 4 haftada astım nedeniyle ${v.kez || "…"} gece uyanması olmuş.`,
          "Son 4 haftada astım nedeniyle gece uyanması olmamış."),
        varYokDetay("ast-rahatlatici", "Son 4 haftada rahatlatıcı inhaler ihtiyacı var mı?",
          [{ name: "kez", type: "text", label: "Haftada kaç kez", placeholder: "ör. 4" }],
          (v) => `Son 4 haftada rahatlatıcı inhalere haftada ${v.kez || "…"} kez ihtiyaç duymuş.`,
          "Son 4 haftada rahatlatıcı inhaler ihtiyacı olmamış."),
        varYok("ast-aktivite", "Son 4 haftada aktivite kısıtlanması var mı?",
          "Son 4 haftada astıma bağlı aktivite kısıtlanması olmuş.", "Son 4 haftada aktivite kısıtlanması olmamış."),
        secimBlok("ast-kontrol-duzey", "Astım kontrolü",
          ["iyi kontrollü", "kısmi kontrollü", "kontrolsüz"],
          (v) => `Astımı ${v} olarak değerlendirilmiş.`, "Kontrol düzeyi"),
        checklistVarYok("ast-son1ay", "Son 1 ayda etkilenme",
          ["okula/işe gidememe", "günlük aktivitelerde kısıtlanma", "egzersiz intoleransı"])
      ]
    },

    /* ---- 3. Mevcut Semptomlar — Dispne, Hışıltı, Öksürük, Balgam ---- */
    {
      id: "ast-semptom",
      title: "Mevcut Semptomlar",
      blocks: [
        {
          id: "ast-dispne",
          label: "Nefes darlığı (dispne)",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                {
                  name: "nitelik", type: "multi", label: "Özellikleri (işaretleyin)",
                  options: ["bazale göre artmış", "istirahatte de mevcut", "eforla belirgin",
                    "konuşurken belirginleşiyor", "cümle kuramayacak kadar belirgin", "yatınca artıyor"]
                }
              ],
              build: (v) => {
                const n = v.nitelik || [];
                return "Nefes darlığı mevcut" + (n.length ? `; ${joinVe(n)}.` : ".");
              }
            },
            { key: "no", label: "Yok", build: () => "Nefes darlığı yokmuş." },
            SKIP
          ]
        },
        checklistVarYok("ast-hisilti", "Hışıltı / göğüste sıkışma",
          ["hışıltı (wheezing)", "göğüste sıkışma hissi"]),
        durumBlok("ast-bronkodilator-yanit", "Bronkodilatörle rahatlama", [
          { key: "yok", label: "Yok", build: () => "Semptomları bronkodilatöre yanıt vermiyormuş." },
          { key: "kismi", label: "Kısmi", build: () => "Semptomları bronkodilatörle kısmen rahatlıyormuş." },
          { key: "belirgin", label: "Belirgin", build: () => "Semptomları bronkodilatörle belirgin şekilde rahatlıyormuş." }
        ]),
        durumBlok("ast-atak-pattern", "Semptomlar ataklar halinde mi geliyor?", [
          { key: "evet", label: "Evet", build: () => "Semptomları ataklar halinde geliyormuş." },
          { key: "hayir", label: "Hayır", build: () => "Semptomları ataklar halinde olmayıp süreklilik gösteriyormuş." }
        ]),
        {
          id: "ast-oksuruk",
          label: "Öksürük",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "karakter", type: "select", label: "Karakter", options: ["kuru", "balgamlı"] },
                {
                  name: "nitelik", type: "multi", label: "Özellikleri (işaretleyin)",
                  options: ["gece artıyor", "sabaha karşı belirginleşiyor", "egzersizle artıyor", "soğuk havayla artıyor"]
                }
              ],
              build: (v) => {
                const n = v.nitelik || [];
                return `Öksürük mevcut, ${v.karakter || "…"} karakterde` + (n.length ? `; ${joinVe(n)}.` : ".");
              }
            },
            { key: "no", label: "Yok", build: () => "Öksürük yokmuş." },
            SKIP
          ]
        },
        {
          id: "ast-balgam",
          label: "Balgam",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "miktar", type: "select", label: "Miktar", options: ["az", "orta", "fazla"] },
                { name: "renk", type: "select", label: "Renk", options: ["beyaz", "sarı", "yeşil", "kanlı"] },
                { name: "ozellik", type: "multi", label: "Ek özellikler", options: ["pürülan"] }
              ],
              build: (v) => {
                const o = v.ozellik || [];
                return `Balgam mevcut; ${v.miktar || "…"} miktarda ve ${v.renk || "…"} renkte` +
                  (o.length ? ` (${joinVe(o)})` : "") + ".";
              }
            },
            { key: "no", label: "Yok", build: () => "Balgam yokmuş." },
            SKIP
          ]
        },
        varYok("ast-hemoptizi", "Hemoptizi var mı?",
          "Hemoptizi tarifliyormuş.", "Hemoptizi yokmuş.")
      ]
    },

    /* ---- 4. Enfeksiyon Bulguları ---- */
    {
      id: "ast-enfeksiyon",
      title: "Enfeksiyon Bulguları",
      blocks: [
        varYokDetay("ast-ates", "Ateş var mı?",
          [{ name: "derece", type: "text", label: "En yüksek (°C)", placeholder: "ör. 38.2" }],
          (v) => `Ateşi olmuş (en yüksek ${v.derece || "…"} °C ölçülmüş).`, "Ateşi olmamış."),
        checklistVarYok("ast-enf-cluster", "Eşlik eden enfeksiyon bulguları",
          ["boğaz ağrısı", "burun akıntısı/tıkanıklığı", "üşüme-titreme", "yakın çevrede enfeksiyon öyküsü"]),
        varYokDetay("ast-antibiyotik", "Son antibiyotik kullanımı var mı?",
          [{ name: "ilac", type: "text", label: "Antibiyotik", placeholder: "ör. klaritromisin" }],
          (v) => `Son dönemde antibiyotik kullanmış (${v.ilac || "…"}).`,
          "Son dönemde antibiyotik kullanmamış.")
      ]
    },

    /* ---- 5. Ağır Atak Bulguları ---- */
    {
      id: "ast-agir-bulgu",
      title: "Ağır Atak Bulguları",
      blocks: [
        checklistVarYok("ast-agir-cluster", "Ağır atak bulguları", [
          "konuşmada zorlanma", "ajitasyon", "uykuya meyil", "siyanoz", "sessiz akciğer şüphesi",
          "bilinç bulanıklığı", "göğüs ağrısı", "çarpıntı", "SpO2 düşüklüğü"
        ])
      ]
    },

    /* ---- 6. Astım Atağı Değerlendirmesi ---- */
    {
      id: "ast-atak-deg",
      title: "Astım Atağı Değerlendirmesi",
      blocks: [
        durumBlok("ast-uyum", "Mevcut tablo astım atağı ile uyumlu mu?", [
          { key: "evet", label: "Evet", build: () => "Mevcut tablo astım atağı ile uyumlu olarak değerlendirilmiş." },
          { key: "hayir", label: "Hayır", build: () => "Mevcut tablo astım atağı ile uyumlu bulunmamış." },
          { key: "supheli", label: "Şüpheli", build: () => "Mevcut tablo astım atağı açısından şüpheli bulunmuş." }
        ]),
        secimBlok("ast-atak-siddet", "Atak şiddeti",
          ["hafif", "orta", "ağır", "yaşamı tehdit edici"],
          (v) => `Atak ${v} şiddette değerlendirilmiş.`, "Şiddet"),
        checklistVarYok("ast-atak-lehine", "Atak lehine bulgular", [
          "nefes darlığında artış", "hışıltıda artış", "göğüste sıkışma",
          "rahatlatıcı inhaler ihtiyacında artış", "oksijen ihtiyacı"
        ]),
        durumBlok("ast-pef-dusuk", "PEF/FEV1 düşüklüğü", [
          { key: "var", label: "Var", build: () => "PEF/FEV1 düşüklüğü mevcutmuş." },
          { key: "yok", label: "Yok", build: () => "PEF/FEV1 düşüklüğü saptanmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "PEF/FEV1 düzeyi bilinmiyormuş." }
        ]),
        checklistVarYok("ast-yasamsal", "Yaşamı tehdit edici özellikler", [
          "sessiz akciğer", "siyanoz", "bilinç değişikliği", "hipotansiyon", "SpO2 belirgin düşüklüğü"
        ]),
        durumBlok("ast-pef-cokdusuk", "PEF çok düşük", [
          { key: "var", label: "Var", build: () => "PEF değeri çok düşükmüş." },
          { key: "yok", label: "Yok", build: () => "PEF değeri çok düşük değilmiş." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "PEF düzeyi bilinmiyormuş." }
        ]),
        durumBlok("ast-hiperkapni", "Hiperkapni / asidoz", [
          { key: "var", label: "Var", build: () => "Hiperkapni/asidoz mevcutmuş." },
          { key: "yok", label: "Yok", build: () => "Hiperkapni/asidoz saptanmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Hiperkapni/asidoz durumu bilinmiyormuş." }
        ]),
        secimBlok("ast-tetikleyici", "Olası tetikleyici",
          ["viral enfeksiyon", "alerjen maruziyeti", "tedavi uyumsuzluğu", "sigara dumanı", "egzersiz",
            "soğuk hava", "NSAİİ/aspirin", "beta bloker", "mesleki maruziyet", "reflü", "stres",
            "gebelik", "bilinmiyor", "Diğer"],
          (v) => v === "bilinmiyor"
            ? "Atağı tetikleyen faktör belirlenememiş."
            : `Atağın olası tetikleyicisi ${v} olarak düşünülmüş.`,
          "Tetikleyici")
      ]
    },

    /* ---- 7. Son 1 Yıl Atak ve Sağlık Başvurusu ---- */
    {
      id: "ast-son1yil",
      title: "Son 1 Yıl Atak ve Sağlık Başvurusu Öyküsü",
      blocks: [
        metinBlok("ast-atak-sayi", "Son 1 yılda astım atağı sayısı", "Sayı", "ör. 4",
          (v) => `Son bir yılda toplam ${v} kez astım atağı geçirmiş.`),
        varYokDetay("ast-steroid-atak", "Sistemik steroid gerektiren atak oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 2" }],
          (v) => `Bunların ${v.kez || "…"} tanesi sistemik steroid gerektirmiş.`,
          "Sistemik steroid gerektiren atağı olmamış."),
        varYokDetay("ast-acil", "Acil başvurusu oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 2" }],
          (v) => `Astım nedeniyle ${v.kez || "…"} kez acil servise başvurmuş.`,
          "Astım nedeniyle acil servise başvurusu olmamış."),
        varYokDetay("ast-servis", "Servis yatışı oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `${v.kez || "…"} kez servise yatırılmış.`, "Servis yatışı olmamış."),
        varYokDetay("ast-ybu", "Yoğun bakım yatışı oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `${v.kez || "…"} kez yoğun bakıma yatırılmış.`, "Yoğun bakım yatışı olmamış."),
        varYok("ast-nimv", "Daha önce NIMV/BiPAP ihtiyacı oldu mu?",
          "Daha önce en az bir kez NIMV/BiPAP ihtiyacı olmuş.", "Daha önce NIMV/BiPAP ihtiyacı olmamış."),
        varYok("ast-entubasyon", "Daha önce entübasyon öyküsü var mı?",
          "Daha önce entübe edilmiş.", "Daha önce entübasyon öyküsü yokmuş."),
        varYok("ast-yasamsal-atak", "Daha önce yaşamı tehdit eden astım atağı var mı?",
          "Daha önce yaşamı tehdit eden astım atağı geçirmiş.",
          "Daha önce yaşamı tehdit eden astım atağı öyküsü yokmuş."),
        metinBlok("ast-son-atak-tarih", "Son atak tarihi", "Tarih", "ör. Nisan 2025",
          (v) => `Son atağını ${v} tarihinde geçirmiş.`),
        metinBlok("ast-son-atak-tedavi", "Son atakta verilen tedavi", "Tedavi", "ör. nebül ve sistemik steroid",
          (v) => `Son atakta ${v} uygulanmış.`),
        durumBlok("ast-atak-duzelme", "Atak sonrası tam düzelme olmuş mu?", [
          { key: "evet", label: "Evet", build: () => "Atak sonrası tam düzelme sağlanmış." },
          { key: "hayir", label: "Hayır", build: () => "Atak sonrası tam düzelme sağlanamamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Atak sonrası düzelme durumu bilinmiyormuş." }
        ])
      ]
    },

    /* ---- 8. Evde Astım Tedavisi ---- */
    {
      id: "ast-tedavi",
      title: "Evde Kullandığı Astım Tedavisi",
      blocks: [
        varYokDetay("ast-kontrol-edici", "Düzenli kontrol edici tedavi var mı?",
          [{ name: "ilac", type: "text", label: "Kullandığı ilaç(lar) ve doz", placeholder: "ör. flutikazon/salmeterol 2x1, montelukast 1x1" }],
          (v) => `Düzenli kontrol edici tedavi olarak ${v.ilac || "…"} kullanıyormuş.`,
          "Düzenli kontrol edici tedavi kullanmıyormuş."),
        secimBlok("ast-tedavi-tip", "Tedavi tipi",
          ["ICS", "ICS-LABA", "LTRA", "LAMA", "düşük doz ICS-formoterol (gerektikçe)", "MART tedavisi",
            "biyolojik ajan", "sistemik steroid", "Diğer"],
          (v) => `Tedavisi ${v} grubunda değerlendirilmiş.`, "Tip"),
        secimBlok("ast-rahatlatici-tip", "Rahatlatıcı tedavi",
          ["SABA", "ICS-formoterol", "nebül salbutamol", "Diğer"],
          (v) => `Rahatlatıcı tedavi olarak ${v} kullanıyormuş.`, "Rahatlatıcı"),
        metinBlok("ast-rahatlatici-siklik", "Rahatlatıcı ilaç kullanım sıklığı", "Sıklık",
          "ör. haftada 2 kez / günde 1 kez / çok sık", (v) => `Rahatlatıcı ilacını ${v} kullanıyormuş.`),
        varYok("ast-rahatlatici-artis", "Son 1 haftada rahatlatıcı ihtiyacında artış var mı?",
          "Son 1 haftada rahatlatıcı ihtiyacında artış olmuş.",
          "Son 1 haftada rahatlatıcı ihtiyacında artış olmamış."),
        secimBlok("ast-ilac-uyum", "İlaç uyumu", ["iyi", "orta", "kötü"],
          (v) => `İlaç uyumu ${v} düzeydeymiş.`, "Uyum"),
        secimBlok("ast-aksatma", "İlaçlarını aksatma nedeni",
          ["unutma", "yan etki", "cihazı kullanamama", "fayda görmeme", "steroid korkusu", "maddi neden", "Diğer"],
          (v) => `İlaçlarını ${v} nedeniyle aksatıyormuş.`, "Neden"),
        durumBlok("ast-teknik-deg", "İnhaler tekniği değerlendirildi mi?", [
          { key: "evet", label: "Evet", build: () => "İnhaler tekniği değerlendirilmiş." },
          { key: "hayir", label: "Hayır", build: () => "İnhaler tekniği değerlendirilmemiş." }
        ]),
        secimBlok("ast-teknik", "İnhaler tekniği", ["uygun", "kısmen hatalı", "hatalı"],
          (v) => `İnhaler tekniği ${v} bulunmuş.`, "Teknik"),
        varYok("ast-spacer", "Spacer/hazne kullanımı var mı?",
          "Spacer (hazne) kullanıyormuş.", "Spacer/hazne kullanmıyormuş."),
        durumBlok("ast-agiz-calkalama", "İnhaler sonrası ağız çalkalama", [
          { key: "var", label: "Var", build: () => "İnhaler sonrası ağzını çalkalıyormuş." },
          { key: "yok", label: "Yok", build: () => "İnhaler sonrası ağzını çalkalamıyormuş." },
          { key: "gerekmiyor", label: "Gerekmiyor", build: () => "Kullandığı inhaler için ağız çalkalama gerekmiyormuş." }
        ]),
        checklistVarYok("ast-yanetki", "İlaç yan etkileri",
          ["çarpıntı", "titreme", "ses kısıklığı", "oral kandidiyazis", "boğaz irritasyonu"])
      ]
    },

    /* ---- 9. Alerji ve Atopi ---- */
    {
      id: "ast-alerji",
      title: "Alerji ve Atopi Öyküsü",
      blocks: [
        checklistVarYok("ast-atopi-cluster", "Atopik/alerjik bulgular", [
          "alerjik rinit", "burun akıntısı/tıkanıklığı/hapşırık", "postnazal akıntı",
          "egzama/atopik dermatit", "ürtiker", "besin alerjisi", "anafilaksi öyküsü", "küf/nem maruziyeti"
        ]),
        varYokDetay("ast-ilac-alerji", "İlaç alerjisi var mı?",
          [{ name: "detay", type: "text", label: "İlaç(lar)", placeholder: "ör. penisilin" }],
          (v) => `İlaç alerjisi mevcutmuş (${v.detay || "…"}).`, "Bilinen ilaç alerjisi yokmuş."),
        durumBlok("ast-akar", "Ev tozu akarı duyarlılığı", [
          { key: "var", label: "Var", build: () => "Ev tozu akarı duyarlılığı mevcutmuş." },
          { key: "yok", label: "Yok", build: () => "Ev tozu akarı duyarlılığı yokmuş." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Ev tozu akarı duyarlılığı bilinmiyormuş." }
        ]),
        durumBlok("ast-polen", "Polen duyarlılığı", [
          { key: "var", label: "Var", build: () => "Polen duyarlılığı mevcutmuş." },
          { key: "yok", label: "Yok", build: () => "Polen duyarlılığı yokmuş." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Polen duyarlılığı bilinmiyormuş." }
        ]),
        durumBlok("ast-hayvan", "Kedi-köpek/evcil hayvan duyarlılığı", [
          { key: "var", label: "Var", build: () => "Evcil hayvan duyarlılığı mevcutmuş." },
          { key: "yok", label: "Yok", build: () => "Evcil hayvan duyarlılığı yokmuş." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Evcil hayvan duyarlılığı bilinmiyormuş." }
        ]),
        durumBlok("ast-alerji-test", "Daha önce alerji testi yapılmış mı?", [
          {
            key: "var", label: "Var",
            fields: [{ name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. ev tozu akarı ve polen pozitif" }],
            build: (v) => `Daha önce alerji testi yapılmış (sonuç: ${v.sonuc || "…"}).`
          },
          { key: "yok", label: "Yok", build: () => "Daha önce alerji testi yapılmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Alerji testi yapılıp yapılmadığı bilinmiyormuş." }
        ])
      ]
    },

    /* ---- 10. Tetikleyici ve Maruziyet ---- */
    {
      id: "ast-tetikleyici-maruz",
      title: "Tetikleyici ve Maruziyet Sorgusu",
      blocks: [
        checklistVarYok("ast-maruziyet", "Çevresel maruziyet", [
          "aktif sigara kullanımı", "pasif sigara maruziyeti", "elektronik sigara/nargile",
          "evcil hayvan", "evde halı/kilim yoğunluğu", "rutubet/küf", "toz maruziyeti",
          "mesleki kimyasal/toz/duman maruziyeti"
        ]),
        checklistCustom("ast-tetikleyiciler", "Tetiklenme faktörleri", [
          "parfüm/deterjan/temizlik ürünü", "soğuk hava", "egzersiz", "NSAİİ/aspirin", "reflü"
        ], "ile tetikleniyor", "ile tetiklenme yok"),
        varYok("ast-beta-bloker", "Beta bloker kullanımı var mı?",
          "Beta bloker kullanıyormuş.", "Beta bloker kullanmıyormuş."),
        durumBlok("ast-menstruasyon", "Menstrüasyonla ilişki", [
          { key: "var", label: "Var", build: () => "Semptomlarının menstrüasyonla ilişkisi olduğunu tariflemiş." },
          { key: "yok", label: "Yok", build: () => "Semptomlarının menstrüasyonla ilişkisi yokmuş." },
          { key: "uygundegil", label: "Uygun değil", build: () => "Menstrüasyonla ilişki değerlendirmesi uygun değilmiş." }
        ]),
        checklistVarYok("ast-aile", "Aile öyküsü", [
          "ailede astım", "ailede alerjik rinit/egzama", "ailede KOAH",
          "ailede erken yaşta solunum hastalığı"
        ])
      ]
    },

    /* ---- 11. Aşı ve Koruyucu ---- */
    {
      id: "ast-asi",
      title: "Aşı ve Koruyucu Öykü",
      blocks: [
        durumBlok("ast-influenza", "İnfluenza aşısı", [
          {
            key: "var", label: "Var",
            fields: [{ name: "tarih", type: "text", label: "Son aşı tarihi", placeholder: "ör. Ekim 2024" }],
            build: (v) => `İnfluenza aşısı yaptırmış (son doz: ${v.tarih || "…"}).`
          },
          { key: "yok", label: "Yok", build: () => "İnfluenza aşısı yaptırmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "İnfluenza aşı durumu bilinmiyormuş." }
        ]),
        durumBlok("ast-pnomokok", "Pnömokok aşısı", [
          {
            key: "var", label: "Var",
            fields: [
              { name: "tip", type: "select", label: "Tip", options: ["KPA (konjuge)", "PPA (polisakkarit)", "her ikisi", "bilinmiyor"] },
              { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 2023" }
            ],
            build: (v) => `Pnömokok aşısı yaptırmış (${v.tip || "…"}${v.tarih ? `, ${v.tarih}` : ""}).`
          },
          { key: "yok", label: "Yok", build: () => "Pnömokok aşısı yaptırmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Pnömokok aşı durumu bilinmiyormuş." }
        ]),
        durumBlok("ast-covid", "COVID aşı durumu", [
          {
            key: "tam", label: "Tam",
            fields: [
              { name: "doz", type: "text", label: "Doz sayısı", placeholder: "ör. 3" },
              { name: "tarih", type: "text", label: "Son doz tarihi", placeholder: "ör. Ocak 2023" }
            ],
            build: (v) => `COVID-19 aşı şeması tamamlanmış (${v.doz || "…"} doz${v.tarih ? `, son doz ${v.tarih}` : ""}).`
          },
          {
            key: "eksik", label: "Eksik",
            fields: [
              { name: "doz", type: "text", label: "Yapılan doz sayısı", placeholder: "ör. 1" },
              { name: "tarih", type: "text", label: "Son doz tarihi", placeholder: "ör. 2021" }
            ],
            build: (v) => `COVID-19 aşı şeması eksikmiş (${v.doz || "…"} doz yapılmış${v.tarih ? `, son doz ${v.tarih}` : ""}).`
          },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "COVID-19 aşı durumu bilinmiyormuş." }
        ]),
        checklistVarYok("ast-koruyucu", "Eğitim ve takip araçları",
          ["astım eylem planı", "PEF metre kullanımı", "daha önce alınmış inhaler eğitimi"])
      ]
    },

    /* ---- 12. Sosyal ve Fonksiyonel ---- */
    {
      id: "ast-sosyal",
      title: "Sosyal ve Fonksiyonel Durum",
      blocks: [
        secimBlok("ast-yasam", "Yaşam şekli", ["yalnız", "ailesiyle", "bakım desteğiyle"],
          (v) => `${buyukHarfBasla(v)} yaşıyormuş.`, "Yaşam şekli"),
        secimBlok("ast-ev-kosul", "Ev koşulları",
          ["sağlıklı/uygun", "tozlu", "rutubetli", "evcil hayvanlı", "sigara dumanına maruz"],
          (v) => `Ev ortamı ${v} olarak tarifleniyor.`, "Koşullar"),
        metinBlok("ast-is-okul", "İş / okul durumu", "Durum", "ör. öğrenci / fırın çalışanı",
          (v) => `İş/okul durumu ${v} şeklindeymiş.`),
        checklistVarYok("ast-fonksiyonel", "Fonksiyonel etkilenme", [
          "astım nedeniyle iş/okul devamsızlığı", "egzersiz kısıtlılığı", "gece uykusunda etkilenme"
        ])
      ]
    }
  ]
};
