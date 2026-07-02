/* =========================================================================
 * HEDEFE YÖNELİK ACİL ANAMNEZ — KCFT YÜKSEKLİĞİ / ANORMAL KARACİĞER TESTLERİ
 * schema.js yardımcıları: zamanIfade, joinVe, secimBlok, varYokDetay,
 * metinBlok, SKIP, buyukHarfBasla, buildSymptomCode.
 * ====================================================================== */
function kcftSym(id, title, symptoms) {
  return {
    id, title,
    blocks: [{
      id: id + "-kod", type: "symptom-code", noteHeader: title + " —",
      label: "Her bulguyu kodlayın (bilgi yoksa 'Sorgulanmalı' kalır)", symptoms
    }]
  };
}

const KCFT_SEMA = {
  id: "kcft",
  title: "KCFT Yüksekliği / Anormal Karaciğer Testleri Anamnezi",
  groups: [
    /* ===== 1. KCFT Öyküsü ===== */
    {
      id: "kcft-oyku",
      title: "KCFT Öyküsü",
      blocks: [
        {
          id: "kcft-ilk", label: "İlk ne zaman / hangi bağlamda fark edildi", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "İlk fark ediliş", placeholder: "ör. 2 ay önce / 03/2025" },
                { name: "baglam", type: "text", label: "Bağlam", placeholder: "ör. rutin kontrolde / başka nedenle bakılan tetkikte" }
              ],
              build: (v) => `KCFT yüksekliği ilk kez ${zamanIfade(v.zaman)}${v.baglam ? ` ${v.baglam}` : ""} fark edilmiş.`
            },
            SKIP
          ]
        },
        secimBlok("kcft-onceki", "Önceki KCFT değerleri",
          ["daha önce normaldi", "kronik olarak yüksekti", "önceki değer bilinmiyor"],
          (v) => v === "daha önce normaldi" ? "Önceki tetkiklerinde karaciğer testleri normalmiş."
            : v === "kronik olarak yüksekti" ? "Karaciğer testleri kronik olarak yüksek seyrediyormuş."
              : "Önceki karaciğer testi değerleri bilinmiyor.", "Durum"),
        {
          id: "kcft-lab", label: "Son karaciğer testleri", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "ast", type: "text", label: "AST" }, { name: "alt", type: "text", label: "ALT" },
                { name: "alp", type: "text", label: "ALP" }, { name: "ggt", type: "text", label: "GGT" },
                { name: "tbil", type: "text", label: "Total bilirubin" }, { name: "dbil", type: "text", label: "Direkt bilirubin" },
                { name: "alb", type: "text", label: "Albümin" }, { name: "inr", type: "text", label: "INR" },
                { name: "plt", type: "text", label: "Trombosit" }
              ],
              build: (v) => {
                const L = [["AST", v.ast], ["ALT", v.alt], ["ALP", v.alp], ["GGT", v.ggt],
                ["total bilirubin", v.tbil], ["direkt bilirubin", v.dbil], ["albümin", v.alb],
                ["INR", v.inr], ["trombosit", v.plt]]
                  .filter((x) => x[1] != null && String(x[1]).trim() !== "").map((x) => `${x[0]} ${x[1]}`);
                return L.length ? `Son tetkiklerinde ${L.join(", ")} saptanmış.` : "Son karaciğer testi değerleri girilmemiş.";
              }
            },
            SKIP
          ]
        },
        secimBlok("kcft-patern", "Yükseklik paterni",
          ["hepatoselüler", "kolestatik", "mikst", "izole bilirubin", "izole GGT"],
          (v) => `Yükseklik paterni ${v} tipte değerlendirildi.`, "Patern"),
        secimBlok("kcft-siddet", "Yüksekliğin şiddeti",
          ["hafif", "orta", "belirgin", "akut ciddi yükselme"],
          (v) => v === "akut ciddi yükselme" ? "Yükseklik akut ve ciddi düzeydeymiş."
            : `Yüksekliğin şiddeti ${v} düzeydeymiş.`, "Şiddet")
      ]
    },

    /* ===== 2. Semptomlar ===== */
    kcftSym("kcft-semptom", "Semptomlar", [
      { id: "halsizlik", label: "Halsizlik / iştahsızlık / bulantı-kusma" },
      { id: "suk", label: "Sağ üst kadran ağrısı" },
      { id: "ates", label: "Ateş / titreme" },
      { id: "sarilik", label: "Sarılık / koyu idrar / açık renk gaita" },
      { id: "kasinti", label: "Kaşıntı" },
      { id: "kilo", label: "Kilo kaybı / gece terlemesi" },
      { id: "asit", label: "Karında şişlik / bacaklarda ödem" },
      { id: "kanama", label: "Hematemez / melena" },
      { id: "konfuzyon", label: "Uyku-uyanıklık değişikliği / konfüzyon" }
    ]),

    /* ===== 3. Alkol ve Gebelik ===== */
    {
      id: "kcft-alkol-grup",
      title: "Alkol ve Gebelik",
      blocks: [
        varYokDetay("kcft-alkol", "Alkol kullanımı var mı?",
          [
            { name: "miktar", type: "text", label: "Miktar / süre", placeholder: "ör. günde 2 kadeh, 10 yıl" },
            { name: "son", type: "text", label: "Son kullanım", placeholder: "ör. 1 hafta önce" },
            { name: "artis", type: "select", label: "Son dönemde artış", options: ["yok", "var"] }
          ],
          (v) => `Alkol kullanımı mevcut${v.miktar ? ` (${v.miktar})` : ""}${v.son ? `; son kullanımı ${v.son}` : ""}${v.artis ? `; son dönemde artış ${v.artis}` : ""}.`,
          "Alkol kullanımı tariflemiyormuş."),
        varYokDetay("kcft-gebelik", "Gebelik durumu (gerekiyorsa)",
          [{ name: "hafta", type: "text", label: "Gebelik haftası", placeholder: "ör. 24. hafta" }],
          (v) => `Hasta gebe${v.hafta ? ` (${v.hafta})` : ""}.`,
          "Gebelik tariflemiyor.")
      ]
    },

    /* ===== 4. İlaç, Toksik ve Sosyal Öykü ===== */
    {
      id: "kcft-ilac-grup",
      title: "İlaç, Toksik ve Sosyal Öykü",
      blocks: [
        {
          id: "kcft-ilac", label: "İlaç / toksik öykü", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "duzenli", type: "text", label: "Düzenli kullandığı ilaçlar", placeholder: "ör. metformin, ramipril" },
                { name: "yeni", type: "text", label: "Son 3 ayda yeni başlanan", placeholder: "ör. amoksisilin-klavulanat" },
                {
                  name: "hepatotoksik", type: "multi", label: "Hepatotoksik potansiyelli gruplar",
                  options: ["antibiyotik", "antiepileptik", "statin", "antitüberküloz", "antifungal", "NSAİİ", "parasetamol"]
                },
                { name: "bitkisel", type: "text", label: "Bitkisel / takviye / zayıflama / protein tozu", placeholder: "ör. yeşil çay ekstresi, protein tozu" }
              ],
              build: (v) => {
                const P = [];
                if (v.duzenli) P.push(`Düzenli olarak ${v.duzenli} kullanıyormuş.`);
                if (v.yeni) P.push(`Son 3 ayda yeni başlanan ilaç: ${v.yeni}.`);
                if (v.hepatotoksik && v.hepatotoksik.length) P.push(`Hepatotoksik potansiyelli ilaçlardan ${joinVe(v.hepatotoksik)} kullanımı mevcut.`);
                if (v.bitkisel) P.push(`Bitkisel ürün/takviye kullanımı: ${v.bitkisel}.`);
                return P.join(" ");
              }
            },
            SKIP
          ]
        },
        metinBlok("kcft-sosyal", "Sosyal öykü (meslek / madde / beslenme)", "Sosyal öykü",
          "ör. boyacı, madde kullanımı yok, son dönemde kilo kaybı",
          (v) => `Sosyal öyküde ${v} mevcut.`)
      ]
    },

    /* ===== 5-7 Risk grupları ===== */
    kcftSym("kcft-viral", "Viral Hepatit Riskleri", [
      { id: "hbvhcv", label: "Bilinen HBV/HCV öyküsü" },
      { id: "aile-hep", label: "Ailede hepatit öyküsü" },
      { id: "transfuzyon", label: "Kan transfüzyonu / operasyon / diş işlemi" },
      { id: "dovme", label: "Dövme / piercing" },
      { id: "iv", label: "IV madde kullanımı" },
      { id: "cinsel", label: "Şüpheli cinsel temas" },
      { id: "igne", label: "Sağlık çalışanı / iğne batması" }
    ]),
    kcftSym("kcft-metabolik", "Metabolik Risk Faktörleri", [
      { id: "obezite", label: "Obezite" },
      { id: "dm", label: "Tip 2 DM / insülin direnci" },
      { id: "ht", label: "Hipertansiyon" },
      { id: "hl", label: "Hiperlipidemi" },
      { id: "steatoz", label: "Bilinen hepatosteatoz öyküsü" }
    ]),
    kcftSym("kcft-safra", "Safra Yolu / Kolestaz", [
      { id: "tas", label: "Safra taşı öyküsü" },
      { id: "kolesistektomi", label: "Kolesistektomi öyküsü" },
      { id: "kolanjit", label: "Daha önce kolanjit / pankreatit" },
      { id: "ercp", label: "Biliyer girişim / ERCP" },
      { id: "kolestatik", label: "Kolestatik kaşıntı / sarılık / ateş / SÜK ağrısı" }
    ]),

    /* ===== 8. Kronik Karaciğer Hastalığı / Siroz ===== */
    {
      id: "kcft-kronik-grup",
      title: "Kronik Karaciğer Hastalığı / Siroz",
      blocks: [
        varYokDetay("kcft-kronik", "Bilinen kronik karaciğer hastalığı tanısı var mı?",
          [{ name: "tani", type: "multi", label: "Tanı", options: ["siroz", "kronik hepatit", "yağlı karaciğer", "otoimmün hepatit", "PBC/PSC"] }],
          (v) => `Daha önce ${v.tani && v.tani.length ? joinVe(v.tani) : "kronik karaciğer hastalığı"} tanısı mevcutmuş.`,
          "Bilinen kronik karaciğer hastalığı tanısı yok."),
        varYokDetay("kcft-dekomp", "Dekompansasyon öyküsü var mı?",
          [{ name: "tur", type: "multi", label: "Bulgular", options: ["asit", "varis kanaması", "hepatik ensefalopati", "spontan bakteriyel peritonit"] }],
          (v) => `Dekompansasyon öyküsü mevcut${v.tur && v.tur.length ? ` (${joinVe(v.tur)})` : ""}.`,
          "Dekompansasyon öyküsü yok."),
        metinBlok("kcft-onceki-islem", "Daha önce endoskopi / USG / elastografi / biyopsi", "İşlem ve sonuç",
          "ör. USG'de hepatosteatoz, elastografi F2",
          (v) => `Daha önce ${v} yapılmış.`)
      ]
    },

    /* ===== 9-12 Sistemik / vasküler / enfeksiyon / aile ===== */
    kcftSym("kcft-otoimmun", "Otoimmün / Sistemik", [
      { id: "otoimmun", label: "Otoimmün hastalık öyküsü" },
      { id: "eklem", label: "Eklem ağrısı / döküntü" },
      { id: "kuruluk", label: "Ağız-göz kuruluğu" },
      { id: "ibh", label: "İnflamatuvar bağırsak hastalığı öyküsü" }
    ]),
    kcftSym("kcft-vaskuler", "İskemik / Vasküler Nedenler", [
      { id: "sok", label: "Hipotansiyon / sepsis / şok / yoğun bakım yatışı" },
      { id: "kky", label: "Kalp yetmezliği / konjestif hepatopati öyküsü" },
      { id: "tromboz", label: "Tromboz öyküsü / Budd-Chiari açısından risk" }
    ]),
    kcftSym("kcft-enfeksiyon", "Enfeksiyon / Seyahat", [
      { id: "seyahat", label: "Son dönemde seyahat" },
      { id: "gida", label: "Şüpheli gıda-su tüketimi" },
      { id: "viral", label: "Viral enfeksiyon benzeri tablo" },
      { id: "zoonoz", label: "Hayvan teması / zoonoz açısından risk" }
    ]),
    kcftSym("kcft-aile", "Aile Öyküsü", [
      { id: "kc", label: "Ailede karaciğer hastalığı" },
      { id: "genetik", label: "Hemokromatozis / Wilson / erken yaşta siroz" }
    ]),

    /* ===== 13. Önceki Görüntüleme / Tetkikler ===== */
    {
      id: "kcft-tetkik-grup",
      title: "Önceki Görüntüleme / Tetkikler",
      blocks: [
        metinBlok("kcft-usg", "Batın USG", "USG bulgusu", "ör. karaciğer ekojenitesinde artış", (v) => `Batın USG'de ${v} saptanmış.`),
        metinBlok("kcft-mrcp", "MRCP / BT", "Bulgu", "ör. safra yollarında dilatasyon yok", (v) => `MRCP/BT'de ${v} saptanmış.`),
        metinBlok("kcft-viral-sero", "Viral seroloji", "Sonuç", "ör. HBsAg negatif, anti-HCV negatif", (v) => `Viral serolojide ${v} saptanmış.`),
        metinBlok("kcft-otoimmun-belirtec", "Otoimmün belirteçler", "Sonuç", "ör. ANA, AMA, anti-LKM", (v) => `Otoimmün belirteçlerde ${v} değerlendirilmiş.`),
        metinBlok("kcft-demir", "Demir çalışmaları / seruloplazmin / alfa-1 antitripsin", "Sonuç", "ör. ferritin, transferrin satürasyonu, seruloplazmin", (v) => `${buyukHarfBasla(v)} değerlendirilmiş.`)
      ]
    },

    /* ===== 14. Alarm Bulguları ===== */
    kcftSym("kcft-alarm", "Alarm Bulguları", [
      { id: "sarilik", label: "Sarılık" },
      { id: "inr", label: "INR yüksekliği" },
      { id: "ensefalopati", label: "Hepatik ensefalopati" },
      { id: "asit", label: "Asit" },
      { id: "kanama", label: "Aktif GİS kanama" },
      { id: "kolanjit", label: "Ateş / kolanjit bulgusu" },
      { id: "suk-agri", label: "Belirgin sağ üst kadran ağrısı" },
      { id: "transaminaz", label: "Ciddi transaminaz yüksekliği / akut KC yetmezliği" }
    ])
  ]
};
