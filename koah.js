/* =========================================================================
 * KOAH (KRONİK OBSTRÜKTİF AKCİĞER HASTALIĞI) ANAMNEZİ
 * schema.js içindeki yardımcılara bağlıdır (varYok, varYokDetay, metinBlok,
 * secimBlok, durumBlok, checklistVarYok, checklistCustom, fmtDate ...).
 * ====================================================================== */
const KOAH_SEMA = {
  id: "koah",
  title: "KOAH Anamnezi",
  groups: [
    /* ---- 1. Tanı ve Takip ---- */
    {
      id: "koah-tani",
      title: "KOAH Tanı ve Takip Öyküsü",
      blocks: [
        {
          id: "koah-tani-bilgi",
          label: "KOAH tanısı: zaman ve yer",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2017 yılında / 6 yıl önce" },
                { name: "yer", type: "text", label: "Tanı yeri", placeholder: "ör. göğüs hastalıkları polikliniğinde" }
              ],
              build: (v) =>
                `${buyukHarfBasla(v.zaman || "…")} KOAH tanısı almış.` +
                (v.yer ? ` Tanı ${v.yer} konulmuş.` : "")
            },
            SKIP
          ]
        },
        varYokDetay(
          "koah-gogus-takip", "Daha önce göğüs hastalıkları takibi var mı?",
          [{ name: "son", type: "text", label: "Son kontrol tarihi", placeholder: "ör. Mart 2025" }],
          (v) => `Göğüs hastalıkları polikliniğinde takipliymiş (son kontrol: ${v.son || "…"}).`,
          "Daha önce göğüs hastalıkları takibi yok."
        ),
        durumBlok("koah-sft", "Son bilinen SFT / spirometri", [
          {
            key: "var", label: "Var",
            fields: [
              { name: "tarih", type: "date", label: "Tarih" },
              { name: "fev1L", type: "text", label: "FEV1 (L)", placeholder: "ör. 1.4" },
              { name: "fev1p", type: "text", label: "FEV1 (%)", placeholder: "ör. 52" },
              { name: "fvcL", type: "text", label: "FVC (L)", placeholder: "ör. 2.8" },
              { name: "fvcp", type: "text", label: "FVC (%)", placeholder: "ör: 78" },
              { name: "oran", type: "text", label: "FEV1/FVC", placeholder: "ör. 0.50" }
            ],
            build: (v) =>
              `Son SFT/spirometri ${fmtDate(v.tarih)} tarihinde yapılmış: ` +
              `FEV1 ${v.fev1L || "…"} L (%${v.fev1p || "…"}), FVC ${v.fvcL || "…"} L (%${v.fvcp || "…"}), ` +
              `FEV1/FVC ${v.oran || "…"}.`
          },
          { key: "yok", label: "Yok", build: () => "Bilinen SFT/spirometri kaydı yok." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "SFT/spirometri sonucu bilinmiyor." }
        ]),
        durumBlok("koah-gold", "GOLD evresi / grubu biliniyor mu?", [
          {
            key: "evet", label: "Evet",
            fields: [{ name: "v", type: "text", label: "GOLD evresi/grubu", placeholder: "ör. GOLD 3, Grup E" }],
            build: (v) => `GOLD evresi/grubu ${v.v || "…"} olarak biliniyor.`
          },
          { key: "hayir", label: "Hayır", build: () => "GOLD evresi/grubu bilinmiyor." }
        ]),
        secimBlok(
          "koah-fenotip", "Bilinen fenotip",
          ["Amfizem ağırlıklı", "Kronik bronşit ağırlıklı", "Sık alevlenen",
            "Astım-KOAH overlap", "Bronşektazi eşlik ediyor", "Bilinmiyor", "Diğer"],
          (v) => `Bilinen fenotip: ${v}.`, "Fenotip"
        )
      ]
    },

    /* ---- 2. Bazal Fonksiyonel Durum ---- */
    {
      id: "koah-bazal",
      title: "Bazal Fonksiyonel Durum",
      blocks: [
        secimBlok("koah-bazal-dispne", "Bazal nefes darlığı düzeyi",
          ["yalnız ağır eforla", "hızlı yürürken/yokuşta", "düz yolda yaşıtlarından yavaş",
            "100 metre yürüyünce duruyor", "evden çıkamayacak düzeyde"],
          (v) => `Bazal dönemde nefes darlığı ${v} düzeyinde.`, "Düzey"),
        secimBlok("koah-mmrc", "mMRC skoru", ["0", "1", "2", "3", "4"],
          (v) => `mMRC dispne skoru ${v}.`, "mMRC"),
        metinBlok("koah-yuruyus", "Bazal yürüyüş mesafesi", "Mesafe (metre)", "ör. 300",
          (v) => `Bazal yürüyüş mesafesi yaklaşık ${v} metre.`),
        secimBlok("koah-ev-mobil", "Ev içi mobilizasyon", ["bağımsız", "yardımla", "bağımlı"],
          (v) => `Ev içi mobilizasyonu ${v}.`, "Durum"),
        secimBlok("koah-gya", "Günlük yaşam aktiviteleri", ["bağımsız", "kısmen bağımlı", "bağımlı"],
          (v) => `Günlük yaşam aktivitelerinde ${v}.`, "Durum"),
        varYok("koah-bazal-azalma", "Son dönemde bazal kapasiteye göre azalma var mı?",
          "Son dönemde bazal kapasiteye göre azalma mevcut.",
          "Son dönemde bazal kapasiteye göre azalma yok.")
      ]
    },

    /* ---- 3. Mevcut Semptomlar — Dispne ---- */
    {
      id: "koah-dispne",
      title: "Mevcut Semptomlar — Dispne",
      blocks: [
        checklistVarYok("koah-dispne-cluster", "Dispne özellikleri", [
          "dispne", "dispnede bazale göre artış", "istirahatte dispne", "eforla dispne",
          "konuşurken dispne", "yatarken dispnede artış", "gece nefes darlığıyla uyanma"
        ])
      ]
    },

    /* ---- 4. Öksürük ve Balgam ---- */
    {
      id: "koah-oksuruk-balgam",
      title: "Mevcut Semptomlar — Öksürük ve Balgam",
      blocks: [
        checklistVarYok("koah-oksuruk-cluster", "Öksürük özellikleri", [
          "öksürük", "öksürükte bazale göre artış", "gece öksürük artışı", "sabah öksürük belirginliği"
        ]),
        secimBlok("koah-oksuruk-karakter", "Öksürük karakteri", ["kuru", "balgamlı"],
          (v) => `Öksürük ${v} karakterde.`, "Karakter"),
        durumBlok("koah-balgam", "Balgam", [
          {
            key: "var", label: "Var",
            fields: [
              { name: "miktar", type: "select", label: "Miktar", options: ["az", "orta", "fazla"] },
              { name: "renk", type: "select", label: "Renk", options: ["beyaz", "sarı", "yeşil", "kahverengi", "kanlı"] }
            ],
            build: (v) => `Balgam mevcut; ${v.miktar || "…"} miktarda ve ${v.renk || "…"} renkte.`
          },
          { key: "yok", label: "Yok", build: () => "Balgam yok." }
        ]),
        checklistVarYok("koah-balgam-ozellik", "Balgam ek özellikleri", [
          "balgamda bazale göre miktar artışı", "pürülan balgam", "kötü kokulu balgam", "hemoptizi"
        ])
      ]
    },

    /* ---- 5. Enfeksiyon ve Hiperkapni/Hipoksemi ---- */
    {
      id: "koah-enfeksiyon",
      title: "Enfeksiyon ve Hiperkapni/Hipoksemi Bulguları",
      blocks: [
        varYokDetay("koah-ates", "Ateş var mı?",
          [{ name: "derece", type: "text", label: "En yüksek (°C)", placeholder: "ör. 38.4" }],
          (v) => `Ateş mevcut (en yüksek ${v.derece || "…"} °C).`, "Ateş yok."),
        checklistVarYok("koah-enf-cluster", "Eşlik eden enfeksiyon bulguları", [
          "üşüme-titreme", "boğaz ağrısı/burun akıntısı", "yakın çevrede enfeksiyon öyküsü"
        ]),
        varYokDetay("koah-antibiyotik", "Son günlerde antibiyotik kullanımı var mı?",
          [{ name: "ilac", type: "text", label: "Antibiyotik", placeholder: "ör. amoksisilin-klavulanat" }],
          (v) => `Son günlerde antibiyotik kullanımı olmuş (${v.ilac || "…"}).`,
          "Son günlerde antibiyotik kullanımı yok."),
        varYokDetay("koah-steroid-akut", "Son günlerde steroid kullanımı var mı?",
          [{ name: "ilac", type: "text", label: "Steroid", placeholder: "ör. 5 gün metilprednizolon" }],
          (v) => `Son günlerde sistemik steroid kullanımı olmuş (${v.ilac || "…"}).`,
          "Son günlerde steroid kullanımı yok."),
        checklistVarYok("koah-hiperkapni", "Hiperkapni / hipoksemi bulguları", [
          "uykuya meyil", "bilinç bulanıklığı", "sabah baş ağrısı", "siyanoz",
          "konfüzyon", "oksijen satürasyonunda düşüklük"
        ])
      ]
    },

    /* ---- 6. Alevlenme Değerlendirmesi ---- */
    {
      id: "koah-alevlenme-deg",
      title: "Alevlenme Değerlendirmesi",
      blocks: [
        durumBlok("koah-uyum", "Mevcut tablo KOAH alevlenmesi ile uyumlu mu?", [
          { key: "evet", label: "Evet", build: () => "Mevcut tablo KOAH alevlenmesi ile uyumlu." },
          { key: "hayir", label: "Hayır", build: () => "Mevcut tablo KOAH alevlenmesi ile uyumlu değil." },
          { key: "supheli", label: "Şüpheli", build: () => "Mevcut tablo KOAH alevlenmesi açısından şüpheli." }
        ]),
        checklistVarYok("koah-anthonisen", "Alevlenme (Anthonisen) kriterleri", [
          "nefes darlığında artış", "balgam miktarında artış", "balgam pürülansında artış"
        ]),
        secimBlok("koah-alevlenme-siddet", "Alevlenme şiddeti",
          ["hafif", "orta", "ağır", "yaşamı tehdit edici"],
          (v) => `Alevlenme şiddeti ${v} olarak değerlendirilmiş.`, "Şiddet"),
        checklistVarYok("koah-agir-bulgu", "Ağır alevlenme lehine bulgular", [
          "istirahatte dispne", "yeni siyanoz", "bilinç değişikliği", "oksijen ihtiyacında artış",
          "tedaviye yanıtsızlık", "eşlik eden pnömoni/kalp yetmezliği/aritmi şüphesi"
        ]),
        durumBlok("koah-hiperkapni-asidoz", "Hiperkapni / asidoz", [
          { key: "var", label: "Var", build: () => "Hiperkapni/asidoz mevcut." },
          { key: "yok", label: "Yok", build: () => "Hiperkapni/asidoz yok." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Hiperkapni/asidoz durumu bilinmiyor." }
        ]),
        secimBlok("koah-tetikleyici", "Olası tetikleyici",
          ["viral enfeksiyon", "bakteriyel enfeksiyon", "pnömoni", "sigara", "hava kirliliği",
            "ilaç uyumsuzluğu", "kalp yetmezliği", "pulmoner emboli", "bilinmiyor", "Diğer"],
          (v) => `Olası tetikleyici: ${v}.`, "Tetikleyici")
      ]
    },

    /* ---- 7. Son 1 Yıl Alevlenme ve Yatış ---- */
    {
      id: "koah-son1yil",
      title: "Son 1 Yıl Alevlenme ve Yatış Öyküsü",
      blocks: [
        metinBlok("koah-alevlenme-sayi", "Son 1 yılda KOAH alevlenme sayısı", "Sayı", "ör. 3",
          (v) => `Son bir yılda ${v} kez KOAH alevlenmesi olmuş.`),
        varYokDetay("koah-ab-alevlenme", "Antibiyotik gerektiren alevlenme oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 2" }],
          (v) => `Antibiyotik gerektiren alevlenme ${v.kez || "…"} kez olmuş.`,
          "Antibiyotik gerektiren alevlenme olmamış."),
        varYokDetay("koah-steroid-alevlenme", "Sistemik steroid gerektiren alevlenme oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `Sistemik steroid gerektiren alevlenme ${v.kez || "…"} kez olmuş.`,
          "Sistemik steroid gerektiren alevlenme olmamış."),
        varYokDetay("koah-acil", "Acil başvurusu oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 2" }],
          (v) => `KOAH nedeniyle ${v.kez || "…"} kez acil servis başvurusu olmuş.`,
          "KOAH nedeniyle acil başvurusu olmamış."),
        varYokDetay("koah-servis", "Servis yatışı oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `Servis yatışı ${v.kez || "…"} kez olmuş.`, "Servis yatışı olmamış."),
        varYokDetay("koah-ybu", "Yoğun bakım yatışı oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `Yoğun bakım yatışı ${v.kez || "…"} kez olmuş.`, "Yoğun bakım yatışı olmamış."),
        varYok("koah-nimv", "NIMV/BiPAP ihtiyacı oldu mu?",
          "Alevlenme sırasında NIMV/BiPAP ihtiyacı olmuş.", "NIMV/BiPAP ihtiyacı olmamış."),
        varYok("koah-entubasyon", "Entübasyon öyküsü var mı?",
          "Entübasyon öyküsü mevcut.", "Entübasyon öyküsü yok."),
        {
          id: "koah-son-yatis", label: "Son hastane yatışı (tarih ve neden)", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. Şubat 2025" },
                { name: "neden", type: "text", label: "Neden", placeholder: "ör. ağır alevlenme + pnömoni" }
              ],
              build: (v) => `Son hastane yatışı ${v.tarih || "…"} tarihinde, ${v.neden || "…"} nedeniyle olmuş.`
            },
            SKIP
          ]
        },
        secimBlok("koah-taburculuk", "Son taburculuk sonrası durumu",
          ["iyi", "kısmi düzelme", "düzelmemiş", "bilinmiyor"],
          (v) => `Son taburculuk sonrası durumu ${v} olarak ifade edilmiş.`, "Durum")
      ]
    },

    /* ---- 8. Evde KOAH Tedavisi ---- */
    {
      id: "koah-tedavi",
      title: "Evde Kullandığı KOAH Tedavisi",
      blocks: [
        varYok("koah-inhaler", "Düzenli inhaler tedavisi var mı?",
          "Düzenli inhaler tedavisi kullanıyormuş.", "Düzenli inhaler tedavisi kullanmıyormuş."),
        metinBlok("koah-ilaclar", "Kullandığı ilaçlar", "İlaçlar",
          "ör. tiotropium 1x1, formoterol/budesonid 2x1", (v) => `Kullandığı ilaçlar: ${v}.`),
        secimBlok("koah-tedavi-tip", "Tedavi tipi",
          ["LAMA", "LABA", "ICS", "LABA-LAMA", "ICS-LABA", "Üçlü tedavi", "SABA", "SAMA", "Nebül", "Diğer"],
          (v) => `Tedavi tipi: ${v}.`, "Tip"),
        varYokDetay("koah-saba", "Kısa etkili rahatlatıcı inhaler kullanımı var mı?",
          [{ name: "siklik", type: "text", label: "Kullanım sıklığı", placeholder: "ör. günde 3-4 kez" }],
          (v) => `Kısa etkili rahatlatıcı inhaler kullanıyormuş (${v.siklik || "…"}).`,
          "Kısa etkili rahatlatıcı inhaler kullanmıyormuş."),
        checklistCustom("koah-ek-tedavi", "Ek tedaviler",
          ["nebül", "teofilin", "roflumilast", "mukolitik", "profilaktik azitromisin", "kronik sistemik steroid"],
          "kullanıyor", "kullanmıyor"),
        secimBlok("koah-ilac-uyum", "İlaç uyumu", ["iyi", "orta", "kötü"],
          (v) => `İlaç uyumu ${v}.`, "Uyum"),
        secimBlok("koah-aksatma", "İlaçlarını aksatma nedeni",
          ["unutma", "cihaz kullanamama", "yan etki", "fayda görmeme", "maddi neden", "Diğer"],
          (v) => `İlaç aksatma nedeni: ${v}.`, "Neden"),
        durumBlok("koah-teknik-deg", "İnhaler tekniği değerlendirildi mi?", [
          { key: "evet", label: "Evet", build: () => "İnhaler tekniği değerlendirilmiş." },
          { key: "hayir", label: "Hayır", build: () => "İnhaler tekniği değerlendirilmemiş." }
        ]),
        secimBlok("koah-teknik", "İnhaler tekniği", ["uygun", "kısmen hatalı", "hatalı"],
          (v) => `İnhaler tekniği ${v}.`, "Teknik"),
        varYok("koah-spacer", "Spacer kullanımı var mı?",
          "Spacer kullanıyormuş.", "Spacer kullanmıyormuş.")
      ]
    },

    /* ---- 9. Evde Oksijen ve Cihaz ---- */
    {
      id: "koah-oksijen-cihaz",
      title: "Evde Oksijen ve Cihaz Kullanımı",
      blocks: [
        varYokDetay("koah-oksijen", "Evde oksijen kullanımı var mı?",
          [
            { name: "sure", type: "text", label: "Süre (saat/gün)", placeholder: "ör. 15" },
            { name: "akim", type: "text", label: "Akım (L/dk)", placeholder: "ör. 2" },
            { name: "sekil", type: "select", label: "Kullanım şekli", options: ["sürekli", "gece", "eforla", "gerektikçe"] },
            { name: "uyum", type: "select", label: "Uyum", options: ["iyi", "orta", "kötü"] }
          ],
          (v) => `Evde oksijen kullanıyormuş (${v.sure || "…"} saat/gün, ${v.akim || "…"} L/dk, ${v.sekil || "…"}; uyum ${v.uyum || "…"}).`,
          "Evde oksijen kullanmıyormuş."),
        varYokDetay("koah-nimv-ev", "Evde NIMV/BiPAP kullanımı var mı?",
          [
            { name: "endikasyon", type: "select", label: "Endikasyon", options: ["kronik hiperkapni", "OSA", "overlap sendromu", "bilinmiyor"] },
            { name: "sure", type: "text", label: "Süre (saat/gece)", placeholder: "ör. 6" },
            { name: "uyum", type: "select", label: "Uyum", options: ["iyi", "orta", "kötü"] }
          ],
          (v) => `Evde NIMV/BiPAP kullanıyormuş (endikasyon: ${v.endikasyon || "…"}, ${v.sure || "…"} saat/gece; uyum ${v.uyum || "…"}).`,
          "Evde NIMV/BiPAP kullanmıyormuş."),
        varYok("koah-cpap", "Evde CPAP kullanımı var mı?",
          "Evde CPAP kullanıyormuş.", "Evde CPAP kullanmıyormuş."),
        varYok("koah-nebul-cihaz", "Evde nebül cihazı var mı?",
          "Evde nebül cihazı mevcut.", "Evde nebül cihazı yok.")
      ]
    },

    /* ---- 10. Sigara ve Maruziyet ---- */
    {
      id: "koah-sigara",
      title: "Sigara ve Maruziyet Öyküsü",
      blocks: [
        durumBlok("koah-sigara-durum", "Sigara kullanımı", [
          {
            key: "aktif", label: "Aktif içici",
            fields: [
              { name: "yas", type: "text", label: "Başlama yaşı", placeholder: "ör. 18" },
              { name: "paket", type: "text", label: "Günde (paket)", placeholder: "ör. 1" },
              { name: "sure", type: "text", label: "Süre (yıl)", placeholder: "ör. 30" },
              { name: "paketyil", type: "text", label: "Toplam (paket-yıl)", placeholder: "ör. 30" }
            ],
            build: (v) =>
              `Aktif sigara içiyormuş (${v.yas || "…"} yaşında başlamış, günde ${v.paket || "…"} paket, ` +
              `${v.sure || "…"} yıl; toplam ${v.paketyil || "…"} paket-yıl).`
          },
          {
            key: "birakmis", label: "Bırakmış",
            fields: [
              { name: "paketyil", type: "text", label: "Toplam (paket-yıl)", placeholder: "ör. 25" },
              { name: "birakma", type: "text", label: "Bırakma tarihi", placeholder: "ör. 2020" }
            ],
            build: (v) => `Sigarayı bırakmış (toplam ${v.paketyil || "…"} paket-yıl; bırakma: ${v.birakma || "…"}).`
          },
          { key: "hic", label: "Hiç içmemiş", build: () => "Sigara içmemiş." }
        ]),
        varYok("koah-pasif", "Pasif sigara maruziyeti var mı?",
          "Pasif sigara maruziyeti mevcut.", "Pasif sigara maruziyeti yok."),
        varYokDetay("koah-nargile", "Nargile/puro/pipo/e-sigara kullanımı var mı?",
          [{ name: "detay", type: "text", label: "Detay", placeholder: "ör. haftada birkaç kez nargile" }],
          (v) => `Nargile/puro/pipo/e-sigara kullanımı mevcut (${v.detay || "…"}).`,
          "Nargile/puro/pipo/e-sigara kullanımı yok."),
        metinBlok("koah-meslek", "Meslek", "Meslek", "ör. maden işçisi (emekli)",
          (v) => `Meslek: ${v}.`),
        checklistVarYok("koah-cevresel", "Çevresel maruziyet", [
          "toz/duman/kimyasal maruziyeti", "biyokütle/odun-kömür sobası/tandır maruziyeti", "hava kirliliği maruziyeti"
        ])
      ]
    },

    /* ---- 11. Aşı ve Koruyucu ---- */
    {
      id: "koah-asi",
      title: "Aşı ve Koruyucu Öykü",
      blocks: [
        durumBlok("koah-influenza", "İnfluenza aşısı", [
          {
            key: "var", label: "Var",
            fields: [{ name: "tarih", type: "text", label: "Son aşı tarihi", placeholder: "ör. Ekim 2024" }],
            build: (v) => `İnfluenza aşısı yapılmış (son: ${v.tarih || "…"}).`
          },
          { key: "yok", label: "Yok", build: () => "İnfluenza aşısı yapılmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "İnfluenza aşı durumu bilinmiyor." }
        ]),
        durumBlok("koah-pnomokok", "Pnömokok aşısı", [
          { key: "var", label: "Var", build: () => "Pnömokok aşısı yapılmış." },
          { key: "yok", label: "Yok", build: () => "Pnömokok aşısı yapılmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Pnömokok aşı durumu bilinmiyor." }
        ]),
        durumBlok("koah-covid", "COVID aşısı", [
          { key: "tam", label: "Tam", build: () => "COVID aşısı tam." },
          { key: "eksik", label: "Eksik", build: () => "COVID aşısı eksik." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "COVID aşı durumu bilinmiyor." }
        ]),
        durumBlok("koah-rsv", "RSV aşısı", [
          { key: "var", label: "Var", build: () => "RSV aşısı yapılmış." },
          { key: "yok", label: "Yok", build: () => "RSV aşısı yapılmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "RSV aşı durumu bilinmiyor." }
        ]),
        varYok("koah-rehab", "Pulmoner rehabilitasyon öyküsü var mı?",
          "Pulmoner rehabilitasyon öyküsü mevcut.", "Pulmoner rehabilitasyon öyküsü yok."),
        varYok("koah-sigara-danisma", "Sigara bırakma danışmanlığı almış mı?",
          "Sigara bırakma danışmanlığı almış.", "Sigara bırakma danışmanlığı almamış.")
      ]
    },

    /* ---- 12. Sosyal ve Fonksiyonel ---- */
    {
      id: "koah-sosyal",
      title: "Sosyal ve Fonksiyonel Durum",
      blocks: [
        secimBlok("koah-yasam", "Yaşam şekli", ["yalnız", "ailesiyle", "bakıcı desteğiyle"],
          (v) => `${buyukHarfBasla(v)} yaşıyormuş.`, "Yaşam şekli"),
        varYok("koah-bakim", "Evde bakım desteği var mı?",
          "Evde bakım desteği mevcut.", "Evde bakım desteği yok."),
        secimBlok("koah-ev-kosul", "Ev koşulları",
          ["uygun", "merdivenli", "rutubetli", "ısınma problemi var"],
          (v) => `Ev koşulları: ${v}.`, "Koşullar"),
        secimBlok("koah-mobil", "Mobilizasyon", ["bağımsız", "yardımla", "bağımlı"],
          (v) => `Mobilizasyonu ${v}.`, "Durum"),
        secimBlok("koah-beslenme", "Beslenme durumu", ["iyi", "azalmış", "oral alımı kötü"],
          (v) => `Beslenme durumu ${v}.`, "Durum"),
        varYok("koah-kilo", "Son dönemde kilo kaybı var mı?",
          "Son dönemde kilo kaybı mevcut.", "Son dönemde kilo kaybı yok.")
      ]
    }
  ]
};
