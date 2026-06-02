/* =========================================================================
 * ASTIM ANAMNEZİ
 * schema.js içindeki yardımcılara bağlıdır (varYok, varYokDetay, metinBlok,
 * secimBlok, durumBlok, checklistVarYok, checklistCustom, fmtDate ...).
 * ====================================================================== */
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
                (v.yas ? `, tanı yaşı ${v.yas}` : "") + "." +
                (v.yer ? ` Tanı ${v.yer} konulmuş.` : "")
            },
            SKIP
          ]
        },
        varYokDetay("ast-takip", "Daha önce göğüs hastalıkları/alerji takibi var mı?",
          [{ name: "son", type: "text", label: "Son kontrol tarihi", placeholder: "ör. Şubat 2025" }],
          (v) => `Göğüs hastalıkları/alerji polikliniğinde takipliymiş (son kontrol: ${v.son || "…"}).`,
          "Daha önce göğüs hastalıkları/alerji takibi yok."),
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
              `Son SFT/spirometri ${fmtDate(v.tarih)} tarihinde yapılmış: ` +
              `FEV1 ${v.fev1L || "…"} L (%${v.fev1p || "…"}), FVC ${v.fvcL || "…"} L (%${v.fvcp || "…"}), ` +
              `FEV1/FVC ${v.oran || "…"}.`
          },
          { key: "yok", label: "Yok", build: () => "Tanı sırasında veya takipte SFT/spirometri yapılmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "SFT/spirometri yapılıp yapılmadığı bilinmiyor." }
        ]),
        durumBlok("ast-reversibilite", "Bronkodilatör reversibilitesi", [
          { key: "var", label: "Var", build: () => "Bronkodilatör reversibilitesi mevcut." },
          { key: "yok", label: "Yok", build: () => "Bronkodilatör reversibilitesi yok." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Bronkodilatör reversibilitesi bilinmiyor." }
        ]),
        varYokDetay("ast-pef", "PEF takibi yapıyor mu?",
          [
            { name: "eniyi", type: "text", label: "Kişisel en iyi PEF (L/dk)", placeholder: "ör. 480" },
            { name: "basvuru", type: "text", label: "Başvuru PEF (L/dk)", placeholder: "ör. 300" },
            { name: "oran", type: "text", label: "Başvuru / en iyi PEF (%)", placeholder: "ör. 62" }
          ],
          (v) => `PEF takibi yapıyormuş (kişisel en iyi PEF ${v.eniyi || "…"} L/dk, başvuru PEF ${v.basvuru || "…"} L/dk; oran %${v.oran || "…"}).`,
          "PEF takibi yapmıyormuş."),
        secimBlok("ast-fenotip", "Astım tipi / fenotipi daha önce belirtilmiş mi?",
          ["Alerjik astım", "Non-alerjik astım", "Eozinofilik astım", "Egzersiz ilişkili astım",
            "Mesleki astım", "Aspirin duyarlı astım", "Ağır astım", "Bilinmiyor", "Diğer"],
          (v) => `Astım tipi/fenotipi: ${v}.`, "Tip/fenotip")
      ]
    },

    /* ---- 2. Bazal Astım Kontrolü ---- */
    {
      id: "ast-kontrol",
      title: "Bazal Astım Kontrolü",
      blocks: [
        varYokDetay("ast-gunduz", "Son 4 haftada gündüz astım semptomları var mı?",
          [{ name: "gun", type: "text", label: "Haftada kaç gün", placeholder: "ör. 3" }],
          (v) => `Son 4 haftada gündüz astım semptomları mevcut (haftada ${v.gun || "…"} gün).`,
          "Son 4 haftada gündüz astım semptomu yok."),
        varYokDetay("ast-gece", "Son 4 haftada gece uyanması var mı?",
          [{ name: "kez", type: "text", label: "Haftada/ayda kaç kez", placeholder: "ör. ayda 2" }],
          (v) => `Son 4 haftada astım nedeniyle gece uyanması mevcut (${v.kez || "…"} kez).`,
          "Son 4 haftada gece uyanması yok."),
        varYokDetay("ast-rahatlatici", "Son 4 haftada rahatlatıcı inhaler ihtiyacı var mı?",
          [{ name: "kez", type: "text", label: "Haftada kaç kez", placeholder: "ör. 4" }],
          (v) => `Son 4 haftada rahatlatıcı inhaler ihtiyacı mevcut (haftada ${v.kez || "…"} kez).`,
          "Son 4 haftada rahatlatıcı inhaler ihtiyacı yok."),
        varYok("ast-aktivite", "Son 4 haftada aktivite kısıtlanması var mı?",
          "Son 4 haftada aktivite kısıtlanması mevcut.", "Son 4 haftada aktivite kısıtlanması yok."),
        secimBlok("ast-kontrol-duzey", "Astım kontrolü",
          ["iyi kontrollü", "kısmi kontrollü", "kontrolsüz"],
          (v) => `Astım ${v} olarak değerlendirilmiş.`, "Kontrol düzeyi"),
        checklistVarYok("ast-son1ay", "Son 1 ayda etkilenme",
          ["okula/işe gidememe", "günlük aktivitelerde kısıtlanma", "egzersiz intoleransı"])
      ]
    },

    /* ---- 3. Dispne ---- */
    {
      id: "ast-dispne",
      title: "Mevcut Semptomlar — Dispne",
      blocks: [
        checklistVarYok("ast-dispne-cluster", "Dispne özellikleri", [
          "nefes darlığı", "nefes darlığında bazale göre artış", "istirahatte dispne", "eforla dispne",
          "konuşurken nefes darlığı", "cümle kurmakta zorlanma", "yatınca nefes darlığında artış"
        ])
      ]
    },

    /* ---- 4. Hışıltı ve Göğüs Sıkışması ---- */
    {
      id: "ast-hisilti",
      title: "Hışıltı ve Göğüs Sıkışması",
      blocks: [
        checklistVarYok("ast-hisilti-cluster", "Hışıltı / göğüste sıkışma",
          ["hışıltı (wheezing)", "göğüste sıkışma hissi"]),
        durumBlok("ast-bronkodilator-yanit", "Bronkodilatörle rahatlama", [
          { key: "yok", label: "Yok", build: () => "Bronkodilatöre yanıt alınmıyormuş." },
          { key: "kismi", label: "Kısmi", build: () => "Bronkodilatörle kısmi rahatlama oluyormuş." },
          { key: "belirgin", label: "Belirgin", build: () => "Bronkodilatörle belirgin rahatlama oluyormuş." }
        ]),
        durumBlok("ast-atak-pattern", "Semptomlar ataklar halinde mi geliyor?", [
          { key: "evet", label: "Evet", build: () => "Semptomlar ataklar halinde geliyormuş." },
          { key: "hayir", label: "Hayır", build: () => "Semptomlar ataklar halinde olmayıp süreklilik gösteriyormuş." }
        ])
      ]
    },

    /* ---- 5. Öksürük ve Balgam ---- */
    {
      id: "ast-oksuruk",
      title: "Öksürük ve Balgam",
      blocks: [
        checklistVarYok("ast-oksuruk-cluster", "Öksürük özellikleri", [
          "öksürük", "gece öksürüğü", "sabaha karşı öksürük artışı",
          "egzersizle öksürük artışı", "soğuk hava ile öksürük artışı"
        ]),
        secimBlok("ast-oksuruk-karakter", "Öksürük karakteri", ["kuru", "balgamlı"],
          (v) => `Öksürük ${v} karakterde.`, "Karakter"),
        durumBlok("ast-balgam", "Balgam", [
          {
            key: "var", label: "Var",
            fields: [
              { name: "miktar", type: "select", label: "Miktar", options: ["az", "orta", "fazla"] },
              { name: "renk", type: "select", label: "Renk", options: ["beyaz", "sarı", "yeşil", "kanlı"] }
            ],
            build: (v) => `Balgam mevcut; ${v.miktar || "…"} miktarda ve ${v.renk || "…"} renkte.`
          },
          { key: "yok", label: "Yok", build: () => "Balgam yok." }
        ]),
        checklistVarYok("ast-balgam-ozellik", "Balgam ek özellikleri", ["pürülan balgam", "hemoptizi"])
      ]
    },

    /* ---- 6. Enfeksiyon Bulguları ---- */
    {
      id: "ast-enfeksiyon",
      title: "Enfeksiyon Bulguları",
      blocks: [
        varYokDetay("ast-ates", "Ateş var mı?",
          [{ name: "derece", type: "text", label: "En yüksek (°C)", placeholder: "ör. 38.2" }],
          (v) => `Ateş mevcut (en yüksek ${v.derece || "…"} °C).`, "Ateş yok."),
        checklistVarYok("ast-enf-cluster", "Eşlik eden enfeksiyon bulguları",
          ["boğaz ağrısı", "burun akıntısı/tıkanıklığı", "üşüme-titreme", "yakın çevrede enfeksiyon öyküsü"]),
        varYokDetay("ast-antibiyotik", "Son antibiyotik kullanımı var mı?",
          [{ name: "ilac", type: "text", label: "Antibiyotik", placeholder: "ör. klaritromisin" }],
          (v) => `Son dönemde antibiyotik kullanımı olmuş (${v.ilac || "…"}).`,
          "Son dönemde antibiyotik kullanımı yok.")
      ]
    },

    /* ---- 7. Ağır Atak Bulguları ---- */
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

    /* ---- 8. Astım Atağı Değerlendirmesi ---- */
    {
      id: "ast-atak-deg",
      title: "Astım Atağı Değerlendirmesi",
      blocks: [
        durumBlok("ast-uyum", "Mevcut tablo astım atağı ile uyumlu mu?", [
          { key: "evet", label: "Evet", build: () => "Mevcut tablo astım atağı ile uyumlu." },
          { key: "hayir", label: "Hayır", build: () => "Mevcut tablo astım atağı ile uyumlu değil." },
          { key: "supheli", label: "Şüpheli", build: () => "Mevcut tablo astım atağı açısından şüpheli." }
        ]),
        secimBlok("ast-atak-siddet", "Atak şiddeti",
          ["hafif", "orta", "ağır", "yaşamı tehdit edici"],
          (v) => `Atak şiddeti ${v} olarak değerlendirilmiş.`, "Şiddet"),
        checklistVarYok("ast-atak-lehine", "Atak lehine bulgular", [
          "nefes darlığında artış", "hışıltıda artış", "göğüste sıkışma",
          "rahatlatıcı inhaler ihtiyacında artış", "oksijen ihtiyacı"
        ]),
        durumBlok("ast-pef-dusuk", "PEF/FEV1 düşüklüğü", [
          { key: "var", label: "Var", build: () => "PEF/FEV1 düşüklüğü mevcut." },
          { key: "yok", label: "Yok", build: () => "PEF/FEV1 düşüklüğü yok." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "PEF/FEV1 düzeyi bilinmiyor." }
        ]),
        checklistVarYok("ast-yasamsal", "Yaşamı tehdit edici özellikler", [
          "sessiz akciğer", "siyanoz", "bilinç değişikliği", "hipotansiyon", "SpO2 belirgin düşüklüğü"
        ]),
        durumBlok("ast-pef-cokdusuk", "PEF çok düşük", [
          { key: "var", label: "Var", build: () => "PEF çok düşük." },
          { key: "yok", label: "Yok", build: () => "PEF çok düşük değil." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "PEF düzeyi bilinmiyor." }
        ]),
        durumBlok("ast-hiperkapni", "Hiperkapni / asidoz", [
          { key: "var", label: "Var", build: () => "Hiperkapni/asidoz mevcut." },
          { key: "yok", label: "Yok", build: () => "Hiperkapni/asidoz yok." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Hiperkapni/asidoz durumu bilinmiyor." }
        ]),
        secimBlok("ast-tetikleyici", "Olası tetikleyici",
          ["viral enfeksiyon", "alerjen maruziyeti", "tedavi uyumsuzluğu", "sigara dumanı", "egzersiz",
            "soğuk hava", "NSAİİ/aspirin", "beta bloker", "mesleki maruziyet", "reflü", "stres",
            "gebelik", "bilinmiyor", "Diğer"],
          (v) => `Olası tetikleyici: ${v}.`, "Tetikleyici")
      ]
    },

    /* ---- 9. Son 1 Yıl Atak ve Sağlık Başvurusu ---- */
    {
      id: "ast-son1yil",
      title: "Son 1 Yıl Atak ve Sağlık Başvurusu Öyküsü",
      blocks: [
        metinBlok("ast-atak-sayi", "Son 1 yılda astım atağı sayısı", "Sayı", "ör. 4",
          (v) => `Son bir yılda ${v} kez astım atağı olmuş.`),
        varYokDetay("ast-steroid-atak", "Sistemik steroid gerektiren atak oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 2" }],
          (v) => `Sistemik steroid gerektiren atak ${v.kez || "…"} kez olmuş.`,
          "Sistemik steroid gerektiren atak olmamış."),
        varYokDetay("ast-acil", "Acil başvurusu oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 2" }],
          (v) => `Astım nedeniyle ${v.kez || "…"} kez acil servis başvurusu olmuş.`,
          "Astım nedeniyle acil başvurusu olmamış."),
        varYokDetay("ast-servis", "Servis yatışı oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `Servis yatışı ${v.kez || "…"} kez olmuş.`, "Servis yatışı olmamış."),
        varYokDetay("ast-ybu", "Yoğun bakım yatışı oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `Yoğun bakım yatışı ${v.kez || "…"} kez olmuş.`, "Yoğun bakım yatışı olmamış."),
        varYok("ast-nimv", "Daha önce NIMV/BiPAP ihtiyacı oldu mu?",
          "Daha önce NIMV/BiPAP ihtiyacı olmuş.", "Daha önce NIMV/BiPAP ihtiyacı olmamış."),
        varYok("ast-entubasyon", "Daha önce entübasyon öyküsü var mı?",
          "Daha önce entübasyon öyküsü mevcut.", "Daha önce entübasyon öyküsü yok."),
        varYok("ast-yasamsal-atak", "Daha önce yaşamı tehdit eden astım atağı var mı?",
          "Daha önce yaşamı tehdit eden astım atağı öyküsü mevcut.",
          "Daha önce yaşamı tehdit eden astım atağı öyküsü yok."),
        metinBlok("ast-son-atak-tarih", "Son atak tarihi", "Tarih", "ör. Nisan 2025",
          (v) => `Son atak ${v} tarihinde olmuş.`),
        metinBlok("ast-son-atak-tedavi", "Son atakta verilen tedavi", "Tedavi", "ör. nebül + sistemik steroid",
          (v) => `Son atakta ${v} verilmiş.`),
        durumBlok("ast-atak-duzelme", "Atak sonrası tam düzelme olmuş mu?", [
          { key: "evet", label: "Evet", build: () => "Atak sonrası tam düzelme olmuş." },
          { key: "hayir", label: "Hayır", build: () => "Atak sonrası tam düzelme olmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Atak sonrası düzelme durumu bilinmiyor." }
        ])
      ]
    },

    /* ---- 10. Evde Astım Tedavisi ---- */
    {
      id: "ast-tedavi",
      title: "Evde Kullandığı Astım Tedavisi",
      blocks: [
        varYok("ast-kontrol-edici", "Düzenli kontrol edici tedavi var mı?",
          "Düzenli kontrol edici tedavi kullanıyormuş.", "Düzenli kontrol edici tedavi kullanmıyormuş."),
        metinBlok("ast-ilaclar", "Kullandığı ilaçlar", "İlaçlar",
          "ör. flutikazon/salmeterol 2x1, montelukast 1x1", (v) => `Kullandığı ilaçlar: ${v}.`),
        secimBlok("ast-tedavi-tip", "Tedavi tipi",
          ["ICS", "ICS-LABA", "LTRA", "LAMA", "Düşük doz ICS-formoterol (gerektikçe)", "MART tedavisi",
            "Biyolojik ajan", "Sistemik steroid", "Diğer"],
          (v) => `Tedavi tipi: ${v}.`, "Tip"),
        secimBlok("ast-rahatlatici-tip", "Rahatlatıcı tedavi",
          ["SABA", "ICS-formoterol", "Nebül salbutamol", "Diğer"],
          (v) => `Rahatlatıcı tedavi: ${v}.`, "Rahatlatıcı"),
        metinBlok("ast-rahatlatici-siklik", "Rahatlatıcı ilaç kullanım sıklığı", "Sıklık",
          "ör. haftada 2 kez / günde 1 kez / çok sık", (v) => `Rahatlatıcı ilaç kullanım sıklığı: ${v}.`),
        varYok("ast-rahatlatici-artis", "Son 1 haftada rahatlatıcı ihtiyacında artış var mı?",
          "Son 1 haftada rahatlatıcı ihtiyacında artış mevcut.",
          "Son 1 haftada rahatlatıcı ihtiyacında artış yok."),
        secimBlok("ast-ilac-uyum", "İlaç uyumu", ["iyi", "orta", "kötü"],
          (v) => `İlaç uyumu ${v}.`, "Uyum"),
        secimBlok("ast-aksatma", "İlaçlarını aksatma nedeni",
          ["unutma", "yan etki", "cihazı kullanamama", "fayda görmeme", "steroid korkusu", "maddi neden", "Diğer"],
          (v) => `İlaç aksatma nedeni: ${v}.`, "Neden"),
        durumBlok("ast-teknik-deg", "İnhaler tekniği değerlendirildi mi?", [
          { key: "evet", label: "Evet", build: () => "İnhaler tekniği değerlendirilmiş." },
          { key: "hayir", label: "Hayır", build: () => "İnhaler tekniği değerlendirilmemiş." }
        ]),
        secimBlok("ast-teknik", "İnhaler tekniği", ["uygun", "kısmen hatalı", "hatalı"],
          (v) => `İnhaler tekniği ${v}.`, "Teknik"),
        varYok("ast-spacer", "Spacer/hazne kullanımı var mı?",
          "Spacer/hazne kullanıyormuş.", "Spacer/hazne kullanmıyormuş."),
        durumBlok("ast-agiz-calkalama", "İnhaler sonrası ağız çalkalama", [
          { key: "var", label: "Var", build: () => "İnhaler sonrası ağız çalkalıyormuş." },
          { key: "yok", label: "Yok", build: () => "İnhaler sonrası ağız çalkalamıyormuş." },
          { key: "gerekmiyor", label: "Gerekmiyor", build: () => "Kullandığı inhaler için ağız çalkalama gerekmiyormuş." }
        ]),
        checklistVarYok("ast-yanetki", "İlaç yan etkileri",
          ["çarpıntı", "titreme", "ses kısıklığı", "oral kandidiyazis", "boğaz irritasyonu"])
      ]
    },

    /* ---- 11. Alerji ve Atopi ---- */
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
          (v) => `İlaç alerjisi mevcut (${v.detay || "…"}).`, "Bilinen ilaç alerjisi yok."),
        durumBlok("ast-akar", "Ev tozu akarı duyarlılığı", [
          { key: "var", label: "Var", build: () => "Ev tozu akarı duyarlılığı mevcut." },
          { key: "yok", label: "Yok", build: () => "Ev tozu akarı duyarlılığı yok." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Ev tozu akarı duyarlılığı bilinmiyor." }
        ]),
        durumBlok("ast-polen", "Polen duyarlılığı", [
          { key: "var", label: "Var", build: () => "Polen duyarlılığı mevcut." },
          { key: "yok", label: "Yok", build: () => "Polen duyarlılığı yok." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Polen duyarlılığı bilinmiyor." }
        ]),
        durumBlok("ast-hayvan", "Kedi-köpek/evcil hayvan duyarlılığı", [
          { key: "var", label: "Var", build: () => "Evcil hayvan duyarlılığı mevcut." },
          { key: "yok", label: "Yok", build: () => "Evcil hayvan duyarlılığı yok." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Evcil hayvan duyarlılığı bilinmiyor." }
        ]),
        durumBlok("ast-alerji-test", "Daha önce alerji testi yapılmış mı?", [
          {
            key: "var", label: "Var",
            fields: [{ name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. ev tozu akarı ve polen pozitif" }],
            build: (v) => `Daha önce alerji testi yapılmış (sonuç: ${v.sonuc || "…"}).`
          },
          { key: "yok", label: "Yok", build: () => "Daha önce alerji testi yapılmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Alerji testi yapılıp yapılmadığı bilinmiyor." }
        ])
      ]
    },

    /* ---- 12. Tetikleyici ve Maruziyet ---- */
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
          { key: "var", label: "Var", build: () => "Semptomların menstrüasyonla ilişkisi mevcut." },
          { key: "yok", label: "Yok", build: () => "Semptomların menstrüasyonla ilişkisi yok." },
          { key: "uygundegil", label: "Uygun değil", build: () => "Menstrüasyonla ilişki değerlendirmesi uygun değil." }
        ]),
        checklistVarYok("ast-aile", "Aile öyküsü", [
          "ailede astım", "ailede alerjik rinit/egzama", "ailede KOAH",
          "ailede erken yaşta solunum hastalığı"
        ])
      ]
    },

    /* ---- 13. Aşı ve Koruyucu ---- */
    {
      id: "ast-asi",
      title: "Aşı ve Koruyucu Öykü",
      blocks: [
        durumBlok("ast-influenza", "İnfluenza aşısı", [
          {
            key: "var", label: "Var",
            fields: [{ name: "tarih", type: "text", label: "Son aşı tarihi", placeholder: "ör. Ekim 2024" }],
            build: (v) => `İnfluenza aşısı yapılmış (son: ${v.tarih || "…"}).`
          },
          { key: "yok", label: "Yok", build: () => "İnfluenza aşısı yapılmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "İnfluenza aşı durumu bilinmiyor." }
        ]),
        durumBlok("ast-pnomokok", "Pnömokok aşısı", [
          { key: "var", label: "Var", build: () => "Pnömokok aşısı yapılmış." },
          { key: "yok", label: "Yok", build: () => "Pnömokok aşısı yapılmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Pnömokok aşı durumu bilinmiyor." }
        ]),
        durumBlok("ast-covid", "COVID aşı durumu", [
          { key: "tam", label: "Tam", build: () => "COVID aşısı tam." },
          { key: "eksik", label: "Eksik", build: () => "COVID aşısı eksik." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "COVID aşı durumu bilinmiyor." }
        ]),
        checklistVarYok("ast-koruyucu", "Eğitim ve takip araçları",
          ["astım eylem planı", "PEF metre kullanımı", "daha önce alınmış inhaler eğitimi"])
      ]
    },

    /* ---- 14. Sosyal ve Fonksiyonel ---- */
    {
      id: "ast-sosyal",
      title: "Sosyal ve Fonksiyonel Durum",
      blocks: [
        secimBlok("ast-yasam", "Yaşam şekli", ["yalnız", "ailesiyle", "bakım desteğiyle"],
          (v) => `${buyukHarfBasla(v)} yaşıyormuş.`, "Yaşam şekli"),
        secimBlok("ast-ev-kosul", "Ev koşulları",
          ["uygun", "tozlu", "rutubetli", "evcil hayvan var", "sigara maruziyeti var"],
          (v) => `Ev koşulları: ${v}.`, "Koşullar"),
        metinBlok("ast-is-okul", "İş / okul durumu", "Durum", "ör. öğrenci / fırın çalışanı",
          (v) => `İş/okul durumu: ${v}.`),
        checklistVarYok("ast-fonksiyonel", "Fonksiyonel etkilenme", [
          "astım nedeniyle iş/okul devamsızlığı", "egzersiz kısıtlılığı", "gece uykusunda etkilenme"
        ])
      ]
    }
  ]
};
