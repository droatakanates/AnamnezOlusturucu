/* =========================================================================
 * KOAH (KRONİK OBSTRÜKTİF AKCİĞER HASTALIĞI) ANAMNEZİ
 * schema.js içindeki yardımcılara bağlıdır (varYok, varYokDetay, metinBlok,
 * secimBlok, durumBlok, checklistVarYok, checklistCustom, fmtDate, joinVe ...).
 * ====================================================================== */

/* SFT değerini "X L (%Y)" biçiminde, boş olanları atlayarak yazar */
function koahLp(L, p) {
  const a = L ? `${L} L` : "";
  const b = p ? `%${p}` : "";
  if (a && b) return `${a} (${b})`;
  return a || b || "…";
}

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
          label: "KOAH tanısı: zaman, yer ve başvuru şikayeti",
          default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Tanı zamanı", placeholder: "ör. 2016 yılında / 6 yıl önce" },
                { name: "yer", type: "text", label: "Tanı yeri", placeholder: "ör. Sanatoryum EAH'ta / göğüs hastalıkları polikliniğinde" },
                { name: "sikayet", type: "text", label: "Başvuru şikayeti", placeholder: "ör. nefes darlığı ve öksürük" }
              ],
              build: (v) => taniCumlesi("KOAH", v) + "."
            },
            SKIP
          ]
        },
        varYokDetay(
          "koah-gogus-takip", "Daha önce göğüs hastalıkları takibi var mı?",
          [{ name: "son", type: "text", label: "Son kontrol tarihi", placeholder: "ör. Mart 2025" }],
          (v) => `Göğüs hastalıkları polikliniğinde düzenli takipliymiş (son kontrolü ${v.son || "…"}).`,
          "Daha önce göğüs hastalıkları takibi yokmuş."
        ),
        durumBlok("koah-sft", "Son bilinen SFT / spirometri", [
          {
            key: "var", label: "Var",
            fields: [
              { name: "tarih", type: "date", label: "Tarih" },
              { name: "fev1L", type: "text", label: "FEV1 (L)", placeholder: "ör. 1.4" },
              { name: "fev1p", type: "text", label: "FEV1 (%)", placeholder: "ör. 52" },
              { name: "fvcL", type: "text", label: "FVC (L)", placeholder: "ör. 2.8" },
              { name: "fvcp", type: "text", label: "FVC (%)", placeholder: "ör. 78" },
              { name: "oran", type: "text", label: "FEV1/FVC", placeholder: "ör. 0.50" }
            ],
            build: (v) =>
              `En son ${fmtDate(v.tarih)} tarihinde yapılan solunum fonksiyon testinde ` +
              `FEV1 ${koahLp(v.fev1L, v.fev1p)}, FVC ${koahLp(v.fvcL, v.fvcp)}, ` +
              `FEV1/FVC ${v.oran || "…"} olarak ölçülmüş.`
          },
          { key: "yok", label: "Yok", build: () => "Daha önce yapılmış bir SFT/spirometri kaydı yokmuş." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Daha önce SFT/spirometri yapılıp yapılmadığı bilinmiyormuş." }
        ]),
        durumBlok("koah-gold", "GOLD evresi / grubu biliniyor mu?", [
          {
            key: "evet", label: "Evet",
            fields: [{ name: "v", type: "text", label: "GOLD evresi/grubu", placeholder: "ör. GOLD 3, Grup E" }],
            build: (v) => `Hastalığı ${v.v || "…"} olarak evrelenmiş.`
          },
          { key: "hayir", label: "Hayır", build: () => "GOLD evresi/grubu bilinmiyormuş." }
        ]),
        secimBlok("koah-fenotip", "Bilinen fenotip",
          ["Amfizem ağırlıklı", "Kronik bronşit ağırlıklı", "Sık alevlenen",
            "Astım-KOAH overlap", "Bronşektazi eşlik ediyor", "Bilinmiyor", "Diğer"],
          (v) => v === "Bilinmiyor"
            ? "KOAH fenotipi daha önce belirtilmemiş."
            : `Hastalığı ${v.toLocaleLowerCase("tr")} fenotipinde değerlendirilmiş.`,
          "Fenotip")
      ]
    },

    /* ---- 2. Bazal Fonksiyonel Durum ---- */
    {
      id: "koah-bazal",
      title: "Bazal Fonksiyonel Durum",
      blocks: [
        secimBlok("koah-bazal-dispne", "Bazal nefes darlığı düzeyi",
          ["yalnızca ağır eforla nefes darlığı oluyormuş",
            "hızlı yürürken veya yokuşta nefes darlığı oluyormuş",
            "düz yolda yaşıtlarından daha yavaş yürüyormuş",
            "yaklaşık 100 metre yürüyünce nefes darlığı nedeniyle duruyormuş",
            "nefes darlığı nedeniyle evden çıkamayacak düzeydeymiş"],
          (v) => `Bazal dönemde ${v}.`, "Düzey"),
        secimBlok("koah-mmrc", "mMRC skoru", ["0", "1", "2", "3", "4"],
          (v) => `mMRC dispne skoru ${v} olarak değerlendirilmiş.`, "mMRC"),
        metinBlok("koah-yuruyus", "Bazal yürüyüş mesafesi", "Mesafe (metre)", "ör. 300",
          (v) => `Bazal yürüyüş mesafesi yaklaşık ${v} metreymiş.`),
        secimBlok("koah-ev-mobil", "Ev içi mobilizasyon", ["bağımsız", "yardımla", "bağımlı"],
          (v) => `Ev içinde ${v} mobilize oluyormuş.`, "Durum"),
        secimBlok("koah-gya", "Günlük yaşam aktiviteleri", ["bağımsız", "kısmen bağımlı", "bağımlı"],
          (v) => `Günlük yaşam aktivitelerinde ${v} durumdaymış.`, "Durum"),
        varYok("koah-bazal-azalma", "Son dönemde bazal kapasiteye göre azalma var mı?",
          "Son dönemde bazal egzersiz kapasitesinde belirgin azalma olmuş.",
          "Son dönemde bazal kapasitesinde belirgin değişiklik olmamış.")
      ]
    },

    /* ---- 3. Mevcut Semptomlar — Dispne, Öksürük, Balgam ---- */
    {
      id: "koah-semptom",
      title: "Mevcut Semptomlar",
      blocks: [
        {
          id: "koah-dispne",
          label: "Nefes darlığı (dispne)",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                {
                  name: "nitelik", type: "multi", label: "Özellikleri (işaretleyin)",
                  options: ["bazale göre artmış", "istirahatte de mevcut", "eforla belirgin",
                    "konuşurken belirginleşiyor", "yatınca artıyor", "gece nefes darlığıyla uyandırıyor"]
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
        {
          id: "koah-oksuruk",
          label: "Öksürük",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "karakter", type: "select", label: "Karakter", options: ["balgamlı", "kuru"] },
                {
                  name: "nitelik", type: "multi", label: "Özellikleri (işaretleyin)",
                  options: ["bazale göre artmış", "gece artıyor", "sabaha karşı belirginleşiyor",
                    "egzersizle artıyor", "soğuk havayla artıyor"]
                }
              ],
              build: (v) => {
                const n = v.nitelik || [];
                return `Öksürük mevcut, ${v.karakter || "…"} karakterde` +
                  (n.length ? `; ${joinVe(n)}.` : ".");
              }
            },
            { key: "no", label: "Yok", build: () => "Öksürük yokmuş." },
            SKIP
          ]
        },
        {
          id: "koah-balgam",
          label: "Balgam",
          default: "skip",
          modes: [
            {
              key: "yes", label: "Var",
              fields: [
                { name: "miktar", type: "select", label: "Miktar", options: ["az", "orta", "fazla"] },
                { name: "renk", type: "select", label: "Renk", options: ["beyaz", "sarı", "yeşil", "kahverengi", "kanlı"] },
                {
                  name: "ozellik", type: "multi", label: "Ek özellikler (işaretleyin)",
                  options: ["bazale göre miktarı artmış", "pürülan", "kötü kokulu"]
                }
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
        varYok("koah-hemoptizi", "Hemoptizi var mı?",
          "Hemoptizi tarifliyormuş.", "Hemoptizi yokmuş.")
      ]
    },

    /* ---- 4. Enfeksiyon ve Hiperkapni/Hipoksemi ---- */
    {
      id: "koah-enfeksiyon",
      title: "Enfeksiyon ve Hiperkapni/Hipoksemi Bulguları",
      blocks: [
        varYokDetay("koah-ates", "Ateş var mı?",
          [{ name: "derece", type: "text", label: "En yüksek (°C)", placeholder: "ör. 38.4" }],
          (v) => `Ateşi olmuş (en yüksek ${v.derece || "…"} °C ölçülmüş).`, "Ateşi olmamış."),
        checklistVarYok("koah-enf-cluster", "Eşlik eden enfeksiyon bulguları",
          ["üşüme-titreme", "boğaz ağrısı", "burun akıntısı/tıkanıklığı", "yakın çevrede enfeksiyon öyküsü"]),
        varYokDetay("koah-antibiyotik", "Son günlerde antibiyotik kullanımı var mı?",
          [{ name: "ilac", type: "text", label: "Antibiyotik", placeholder: "ör. amoksisilin-klavulanat 2x1000 mg, 5 gün" }],
          (v) => `Son günlerde antibiyotik kullanmış (${v.ilac || "…"}).`,
          "Son günlerde antibiyotik kullanmamış."),
        varYokDetay("koah-steroid-akut", "Son günlerde sistemik steroid kullanımı var mı?",
          [{ name: "ilac", type: "text", label: "Steroid", placeholder: "ör. 5 gün metilprednizolon" }],
          (v) => `Son günlerde sistemik steroid kullanmış (${v.ilac || "…"}).`,
          "Son günlerde sistemik steroid kullanmamış."),
        checklistVarYok("koah-hiperkapni", "Hiperkapni / hipoksemi bulguları",
          ["uykuya meyil", "bilinç bulanıklığı", "sabah baş ağrısı", "siyanoz",
            "konfüzyon", "oksijen satürasyonunda düşüklük"])
      ]
    },

    /* ---- 5. Alevlenme Değerlendirmesi ---- */
    {
      id: "koah-alevlenme-deg",
      title: "Alevlenme Değerlendirmesi",
      blocks: [
        durumBlok("koah-uyum", "Mevcut tablo KOAH alevlenmesi ile uyumlu mu?", [
          { key: "evet", label: "Evet", build: () => "Mevcut tablo KOAH alevlenmesi ile uyumlu olarak değerlendirilmiş." },
          { key: "hayir", label: "Hayır", build: () => "Mevcut tablo KOAH alevlenmesi ile uyumlu bulunmamış." },
          { key: "supheli", label: "Şüpheli", build: () => "Mevcut tablo KOAH alevlenmesi açısından şüpheli bulunmuş." }
        ]),
        checklistVarYok("koah-anthonisen", "Alevlenme (Anthonisen) kriterleri",
          ["nefes darlığında artış", "balgam miktarında artış", "balgam pürülansında artış"]),
        secimBlok("koah-alevlenme-siddet", "Alevlenme şiddeti",
          ["hafif", "orta", "ağır", "yaşamı tehdit edici"],
          (v) => `Alevlenme ${v} şiddette değerlendirilmiş.`, "Şiddet"),
        checklistVarYok("koah-agir-bulgu", "Ağır alevlenme lehine bulgular",
          ["istirahatte dispne", "yeni siyanoz", "bilinç değişikliği", "oksijen ihtiyacında artış",
            "tedaviye yanıtsızlık", "eşlik eden pnömoni/kalp yetmezliği/aritmi şüphesi"]),
        durumBlok("koah-hiperkapni-asidoz", "Hiperkapni / asidoz", [
          { key: "var", label: "Var", build: () => "Hiperkapni/asidoz mevcutmuş." },
          { key: "yok", label: "Yok", build: () => "Hiperkapni/asidoz saptanmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "Hiperkapni/asidoz durumu bilinmiyormuş." }
        ]),
        secimBlok("koah-tetikleyici", "Olası tetikleyici",
          ["viral enfeksiyon", "bakteriyel enfeksiyon", "pnömoni", "sigara", "hava kirliliği",
            "ilaç uyumsuzluğu", "kalp yetmezliği", "pulmoner emboli", "bilinmiyor", "Diğer"],
          (v) => v === "bilinmiyor"
            ? "Alevlenmeyi tetikleyen faktör belirlenememiş."
            : `Alevlenmenin olası tetikleyicisi ${v} olarak düşünülmüş.`,
          "Tetikleyici")
      ]
    },

    /* ---- 6. Son 1 Yıl Alevlenme ve Yatış ---- */
    {
      id: "koah-son1yil",
      title: "Son 1 Yıl Alevlenme ve Yatış Öyküsü",
      blocks: [
        metinBlok("koah-alevlenme-sayi", "Son 1 yılda KOAH alevlenme sayısı", "Sayı", "ör. 3",
          (v) => `Son bir yılda toplam ${v} kez KOAH alevlenmesi geçirmiş.`),
        varYokDetay("koah-ab-alevlenme", "Antibiyotik gerektiren alevlenme oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 2" }],
          (v) => `Bunların ${v.kez || "…"} tanesi antibiyotik gerektirmiş.`,
          "Antibiyotik gerektiren alevlenmesi olmamış."),
        varYokDetay("koah-steroid-alevlenme", "Sistemik steroid gerektiren alevlenme oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `${v.kez || "…"} alevlenmesi sistemik steroid gerektirmiş.`,
          "Sistemik steroid gerektiren alevlenmesi olmamış."),
        varYokDetay("koah-acil", "Acil servis başvurusu oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 2" }],
          (v) => `KOAH nedeniyle ${v.kez || "…"} kez acil servise başvurmuş.`,
          "KOAH nedeniyle acil servise başvurusu olmamış."),
        varYokDetay("koah-servis", "Servis yatışı oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `${v.kez || "…"} kez servise yatırılmış.`, "Servis yatışı olmamış."),
        varYokDetay("koah-ybu", "Yoğun bakım yatışı oldu mu?",
          [{ name: "kez", type: "text", label: "Kaç kez", placeholder: "ör. 1" }],
          (v) => `${v.kez || "…"} kez yoğun bakıma yatırılmış.`, "Yoğun bakım yatışı olmamış."),
        varYok("koah-nimv", "Alevlenmede NIMV/BiPAP ihtiyacı oldu mu?",
          "Alevlenme sırasında en az bir kez NIMV/BiPAP ihtiyacı olmuş.", "Alevlenmede NIMV/BiPAP ihtiyacı olmamış."),
        varYok("koah-entubasyon", "Entübasyon öyküsü var mı?",
          "Daha önce entübe edilmiş.", "Entübasyon öyküsü yokmuş."),
        {
          id: "koah-son-yatis", label: "Son hastane yatışı (tarih ve neden)", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. Şubat 2025" },
                { name: "neden", type: "text", label: "Neden", placeholder: "ör. ağır alevlenme ve pnömoni" }
              ],
              build: (v) => `Son hastane yatışı ${v.tarih || "…"} tarihinde, ${v.neden || "…"} nedeniyle olmuş.`
            },
            SKIP
          ]
        },
        secimBlok("koah-taburculuk", "Son taburculuk sonrası durumu",
          ["tam düzelme sağlanmış", "kısmi düzelme olmuş", "düzelme sağlanamamış", "durumu bilinmiyor"],
          (v) => `Son taburculuk sonrasında ${v}.`, "Durum")
      ]
    },

    /* ---- 7. Evde KOAH Tedavisi ---- */
    {
      id: "koah-tedavi",
      title: "Evde Kullandığı KOAH Tedavisi",
      blocks: [
        varYokDetay("koah-inhaler", "Düzenli inhaler tedavisi var mı?",
          [{ name: "ilac", type: "text", label: "Kullandığı inhaler(ler) ve doz", placeholder: "ör. Trelegy 1x1" }],
          (v) => `Düzenli inhaler tedavisi olarak ${v.ilac || "…"} kullanıyormuş.`,
          "Düzenli inhaler tedavisi kullanmıyormuş."),
        secimBlok("koah-tedavi-tip", "Tedavi tipi",
          ["LAMA", "LABA", "ICS", "LABA-LAMA", "ICS-LABA", "üçlü tedavi", "SABA", "SAMA", "nebül", "Diğer"],
          (v) => `Tedavisi ${v} grubunda değerlendirilmiş.`, "Tip"),
        varYokDetay("koah-saba", "Kısa etkili rahatlatıcı inhaler kullanımı var mı?",
          [{ name: "siklik", type: "text", label: "Kullanım sıklığı", placeholder: "ör. günde 3-4 kez" }],
          (v) => `Kısa etkili rahatlatıcı inhalerini ${v.siklik || "…"} kullanıyormuş.`,
          "Kısa etkili rahatlatıcı inhaler kullanmıyormuş."),
        checklistCustom("koah-ek-tedavi", "Ek tedaviler",
          ["nebül", "teofilin", "roflumilast", "mukolitik", "profilaktik azitromisin", "kronik sistemik steroid"],
          "kullanıyor", "kullanmıyor"),
        secimBlok("koah-ilac-uyum", "İlaç uyumu", ["iyi", "orta", "kötü"],
          (v) => `İlaç uyumu ${v} düzeydeymiş.`, "Uyum"),
        secimBlok("koah-aksatma", "İlaçlarını aksatma nedeni",
          ["unutma", "cihazı kullanamama", "yan etki", "fayda görmeme", "maddi neden", "Diğer"],
          (v) => `İlaçlarını ${v} nedeniyle aksatıyormuş.`, "Neden"),
        durumBlok("koah-teknik-deg", "İnhaler tekniği değerlendirildi mi?", [
          { key: "evet", label: "Evet", build: () => "İnhaler tekniği değerlendirilmiş." },
          { key: "hayir", label: "Hayır", build: () => "İnhaler tekniği değerlendirilmemiş." }
        ]),
        secimBlok("koah-teknik", "İnhaler tekniği", ["uygun", "kısmen hatalı", "hatalı"],
          (v) => `İnhaler tekniği ${v} bulunmuş.`, "Teknik"),
        varYok("koah-spacer", "Spacer kullanımı var mı?",
          "Spacer (hazne) kullanıyormuş.", "Spacer kullanmıyormuş.")
      ]
    },

    /* ---- 8. Evde Oksijen ve Cihaz ---- */
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
          (v) => `Evde günde ${v.sure || "…"} saat, ${v.akim || "…"} L/dk akımla ${v.sekil || "…"} oksijen kullanıyormuş; uyumu ${v.uyum || "…"}ymiş.`,
          "Evde oksijen kullanmıyormuş."),
        varYokDetay("koah-nimv-ev", "Evde NIMV/BiPAP kullanımı var mı?",
          [
            { name: "endikasyon", type: "select", label: "Endikasyon", options: ["kronik hiperkapni", "OSA", "overlap sendromu", "bilinmiyor"] },
            { name: "sure", type: "text", label: "Süre (saat/gece)", placeholder: "ör. 6" },
            { name: "uyum", type: "select", label: "Uyum", options: ["iyi", "orta", "kötü"] }
          ],
          (v) => `Evde ${v.endikasyon || "…"} nedeniyle gecede ${v.sure || "…"} saat NIMV/BiPAP kullanıyormuş; uyumu ${v.uyum || "…"}ymiş.`,
          "Evde NIMV/BiPAP kullanmıyormuş."),
        varYok("koah-cpap", "Evde CPAP kullanımı var mı?",
          "Evde CPAP kullanıyormuş.", "Evde CPAP kullanmıyormuş."),
        varYok("koah-nebul-cihaz", "Evde nebül cihazı var mı?",
          "Evinde nebül cihazı mevcutmuş.", "Evinde nebül cihazı yokmuş.")
      ]
    },

    /* ---- 9. Sigara ve Maruziyet ---- */
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
              `Halen aktif sigara içicisiymiş; ${v.yas || "…"} yaşında başlamış, günde ${v.paket || "…"} paket içiyormuş, ` +
              `toplam ${v.paketyil || "…"} paket-yıl (yaklaşık ${v.sure || "…"} yıl) öyküsü mevcutmuş.`
          },
          {
            key: "birakmis", label: "Bırakmış",
            fields: [
              { name: "paketyil", type: "text", label: "Toplam (paket-yıl)", placeholder: "ör. 25" },
              { name: "birakma", type: "text", label: "Bırakma tarihi", placeholder: "ör. 2020" }
            ],
            build: (v) => `Sigarayı ${v.birakma || "…"} yılında bırakmış; toplam ${v.paketyil || "…"} paket-yıl öyküsü mevcutmuş.`
          },
          { key: "hic", label: "Hiç içmemiş", build: () => "Hiç sigara içmemiş." }
        ]),
        varYok("koah-pasif", "Pasif sigara maruziyeti var mı?",
          "Pasif sigara maruziyeti mevcutmuş.", "Pasif sigara maruziyeti yokmuş."),
        varYokDetay("koah-nargile", "Nargile/puro/pipo/e-sigara kullanımı var mı?",
          [{ name: "detay", type: "text", label: "Detay", placeholder: "ör. haftada birkaç kez nargile" }],
          (v) => `Nargile/puro/pipo/e-sigara kullanımı mevcutmuş (${v.detay || "…"}).`,
          "Nargile/puro/pipo/e-sigara kullanımı yokmuş."),
        metinBlok("koah-meslek", "Meslek", "Meslek", "ör. maden işçisi (emekli)",
          (v) => `Mesleği ${v}imiş.`),
        checklistVarYok("koah-cevresel", "Çevresel maruziyet",
          ["toz/duman/kimyasal maruziyeti", "biyokütle/odun-kömür sobası/tandır maruziyeti", "hava kirliliği maruziyeti"])
      ]
    },

    /* ---- 10. Aşı ve Koruyucu ---- */
    {
      id: "koah-asi",
      title: "Aşı ve Koruyucu Öykü",
      blocks: [
        durumBlok("koah-influenza", "İnfluenza aşısı", [
          {
            key: "var", label: "Var",
            fields: [{ name: "tarih", type: "text", label: "Son aşı tarihi", placeholder: "ör. Ekim 2024" }],
            build: (v) => `İnfluenza aşısı yaptırmış (son doz: ${v.tarih || "…"}).`
          },
          { key: "yok", label: "Yok", build: () => "İnfluenza aşısı yaptırmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "İnfluenza aşı durumu bilinmiyormuş." }
        ]),
        durumBlok("koah-pnomokok", "Pnömokok aşısı", [
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
        durumBlok("koah-covid", "COVID aşısı", [
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
        durumBlok("koah-rsv", "RSV aşısı", [
          {
            key: "var", label: "Var",
            fields: [{ name: "tarih", type: "text", label: "Aşı tarihi", placeholder: "ör. Eylül 2025" }],
            build: (v) => `RSV aşısı yaptırmış (${v.tarih || "…"}).`
          },
          { key: "yok", label: "Yok", build: () => "RSV aşısı yaptırmamış." },
          { key: "bilinmiyor", label: "Bilinmiyor", build: () => "RSV aşı durumu bilinmiyormuş." }
        ]),
        varYok("koah-rehab", "Pulmoner rehabilitasyon öyküsü var mı?",
          "Daha önce pulmoner rehabilitasyon programına katılmış.", "Pulmoner rehabilitasyon öyküsü yokmuş."),
        varYok("koah-sigara-danisma", "Sigara bırakma danışmanlığı almış mı?",
          "Sigara bırakma danışmanlığı almış.", "Sigara bırakma danışmanlığı almamış.")
      ]
    },

    /* ---- 11. Sosyal ve Fonksiyonel ---- */
    {
      id: "koah-sosyal",
      title: "Sosyal ve Fonksiyonel Durum",
      blocks: [
        secimBlok("koah-yasam", "Yaşam şekli", ["yalnız", "ailesiyle", "bakıcı desteğiyle"],
          (v) => `${buyukHarfBasla(v)} yaşıyormuş.`, "Yaşam şekli"),
        varYok("koah-bakim", "Evde bakım desteği var mı?",
          "Evde bakım desteği mevcutmuş.", "Evde bakım desteği yokmuş."),
        secimBlok("koah-ev-kosul", "Ev koşulları",
          ["uygun", "merdivenli", "rutubetli", "ısınma problemli"],
          (v) => `Yaşadığı ev ${v} niteliktermiş.`, "Koşullar"),
        secimBlok("koah-beslenme", "Beslenme durumu", ["iyi", "azalmış", "oral alımı kötü"],
          (v) => `Beslenme durumu ${v} olarak değerlendirilmiş.`, "Durum"),
        varYok("koah-kilo", "Son dönemde kilo kaybı var mı?",
          "Son dönemde istemsiz kilo kaybı olmuş.", "Son dönemde belirgin kilo kaybı olmamış.")
      ]
    }
  ]
};
