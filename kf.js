/* =========================================================================
 * KİSTİK FİBROZİS ANAMNEZİ (Göğüs Hastalıkları sürümü)
 * schema.js yardımcılarına bağlıdır. var/yok bulgular symptom-code ile
 * kodlanır (eksik bilgi -> "sorgulanmalı"). Tarih alanları eklenmiştir.
 * ====================================================================== */

/* Pure semptom-kod grubu (var/yok/sorgulanmalı) */
function kfGrup(id, title, symptoms, noteHeader) {
  return {
    id, title,
    blocks: [{
      id: id + "-kod", type: "symptom-code",
      noteHeader: noteHeader || (title + " —"),
      label: "Her bulguyu kodlayın (bilgi yoksa 'Sorgulanmalı' kalır)", symptoms
    }]
  };
}

const KF_SEMA = {
  id: "kf",
  title: "Kistik Fibrozis Anamnezi",
  groups: [
    /* ===== 1. Başvuru Şikayeti ve Kısa Öykü ===== */
    {
      id: "kf-basvuru",
      title: "Başvuru Şikayeti ve Kısa Öykü",
      blocks: [
        {
          id: "kf-basvuru-detay", label: "Başvuru bilgileri", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Başvuru tarihi", placeholder: "ör. 20.06.2026" },
                { name: "yer", type: "text", label: "Başvuru yeri", placeholder: "ör. göğüs hastalıkları polikliniğine / acil servise" },
                { name: "sikayet", type: "text", label: "Ana şikayetler", placeholder: "ör. öksürük, balgam artışı ve nefes darlığı" }
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
          id: "kf-basvuru-seyir", label: "Şikayetlerin başlangıcı ve seyri", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "zaman", type: "text", label: "Başlangıç zamanı", placeholder: "ör. yaklaşık 10 gün önce" },
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
        }
      ]
    },

    /* ===== 2. Kistik Fibrozis Tanısının Öyküsü ===== */
    {
      id: "kf-tani",
      title: "Kistik Fibrozis Tanısının Öyküsü",
      blocks: [
        {
          id: "kf-tani-detay", label: "Tanı zamanı ve merkez", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "yas", type: "text", label: "Tanı yaşı/zamanı", placeholder: "ör. 2 aylıkken" },
                { name: "donem", type: "select", label: "Tanı dönemi", options: ["yenidoğan", "bebeklik", "çocukluk", "erişkin dönem"] },
                { name: "merkez", type: "text", label: "Takipli olduğu merkez/bölüm", placeholder: "ör. Hacettepe Üniversitesi Göğüs Hastalıkları" }
              ],
              build: (v) => {
                let s = `Hastaya ${v.yas || "…"}`;
                if (v.donem) s += ` (${v.donem} dönemi)`;
                s += " kistik fibrozis tanısı konulmuş.";
                if (v.merkez) s += ` Hasta ${v.merkez} bölümünde takipliymiş.`;
                return s;
              }
            }, SKIP
          ]
        },
        durumBlok("kf-yenidogan", "Yenidoğan taraması yapıldı mı?", [
          {
            key: "yes", label: "Var",
            fields: [
              { name: "test", type: "text", label: "Test", placeholder: "ör. immünoreaktif tripsinojen (IRT)" },
              { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. yüksek" },
              { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 2010" }
            ],
            build: (v) => `Yenidoğan taraması yapılmış (${[v.test, v.sonuc, v.tarih].filter(Boolean).join(", ") || "…"}).`
          },
          { key: "no", label: "Yok", build: () => "Yenidoğan taraması yapılmamış." },
          { key: "bil", label: "Bilinmiyor", build: () => "Yenidoğan taraması yapılıp yapılmadığı bilinmiyor." }
        ]),
        varYokDetay("kf-tekrar-enf", "Tanı döneminde tekrarlayan akciğer enfeksiyonu var mı?",
          [
            { name: "yilda", type: "text", label: "Yılda kaç kez", placeholder: "ör. 4" },
            { name: "yatis", type: "select", label: "Yatış gerektirdi mi?", options: ["yatış gerektirmiş", "yatış gerektirmemiş"] },
            { name: "ortam", type: "select", label: "Yatış yeri", options: ["servis", "yoğun bakım", "servis ve yoğun bakım"] }
          ],
          (v) => `Tanı döneminde tekrarlayan akciğer enfeksiyonu öyküsü mevcut (yılda ${v.yilda || "…"} kez; ${v.yatis || "…"}, ${v.ortam || "…"}).`,
          "Tanı döneminde tekrarlayan akciğer enfeksiyonu tariflenmiyor."),
        {
          id: "kf-ter-testi", label: "Ter testi (klor)", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 12.05.2026" },
                { name: "sonuc", type: "text", label: "Sonuç (mmol/L)", placeholder: "ör. 46" }
              ],
              build: (v) => `Son ter testi ${v.tarih || "…"} tarihinde ${v.sonuc || "…"} mmol/L olarak sonuçlanmış.`
            }, SKIP
          ]
        },
        {
          id: "kf-genetik", label: "Genetik analiz (CFTR)", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "biliniyor", type: "select", label: "CFTR mutasyonu biliniyor mu?", options: ["evet", "hayır", "bilinmiyor"] },
                { name: "mutasyon", type: "text", label: "Mutasyon tipi", placeholder: "ör. F508del homozigot" },
                { name: "tarih", type: "text", label: "Analiz tarihi", placeholder: "ör. 2010" }
              ],
              build: (v) => {
                let s = `CFTR mutasyon bilgisi ${v.biliniyor || "…"} olarak belirtilmiş`;
                if (v.mutasyon) s += ` (${v.mutasyon}${v.tarih ? ", " + v.tarih : ""})`;
                return s + ".";
              }
            }, SKIP
          ]
        }
      ]
    },
    kfGrup("kf-tani-bulgu", "Tanıya Yönelik Öykü", [
      { id: "gelisme", label: "Gelişme geriliği / kilo alamama" },
      { id: "mekonyum", label: "Mekonyum ileusu" },
      { id: "steatore", label: "Kronik ishal / steatore" },
      { id: "aile", label: "Aile öyküsü" }
    ]),

    /* ===== 3. Hastalığın Solunumsal Seyri ===== */
    kfGrup("kf-solunum-semp", "Solunumsal Semptomlar", [
      { id: "oksuruk", label: "Kronik öksürük" },
      { id: "balgam", label: "Kronik balgam" },
      { id: "dispne", label: "Nefes darlığı" },
      { id: "wheezing", label: "Hışıltı / wheezing" },
      { id: "gogus-agri", label: "Göğüs ağrısı" },
      { id: "pnomotoraks", label: "Pnömotoraks öyküsü" }
    ]),
    {
      id: "kf-solunum",
      title: "Solunumsal Seyir — Detay",
      blocks: [
        secimBlok("kf-balgam-karakter", "Balgam karakteri", ["mukoid", "pürülan", "koyu", "kanlı", "bilinmiyor"],
          (v) => `Balgam karakteri ${v} olarak tarifleniyor.`, "Karakter"),
        {
          id: "kf-efor", label: "Efor kapasitesi", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "bazal", type: "text", label: "Bazal efor kapasitesi", placeholder: "ör. iki kat merdiven çıkabiliyor" },
                { name: "azalma", type: "select", label: "Son dönemde azalma", options: ["var", "yok"] },
                { name: "modulator", type: "select", label: "Modülatör tedavi döneminde düzelme", options: ["var", "yok"] }
              ],
              build: (v) => {
                let s = `Bazal efor kapasitesi ${v.bazal || "…"}`;
                if (v.azalma) s += `; son dönemde azalma ${v.azalma}`;
                if (v.modulator) s += `; modülatör tedavi döneminde düzelme ${v.modulator}`;
                return s + ".";
              }
            }, SKIP
          ]
        },
        {
          id: "kf-hemoptizi", label: "Hemoptizi", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "derece", type: "select", label: "Derece", options: ["yok", "hafif", "masif", "bilinmiyor"] },
                { name: "embolizasyon", type: "select", label: "Embolizasyon öyküsü", options: ["yok", "var"] }
              ],
              build: (v) => `Hemoptizi ${v.derece || "…"}; daha önce bronşiyal arter embolizasyonu öyküsü ${v.embolizasyon || "…"}.`
            }, SKIP
          ]
        },
        secimBlok("kf-bronsektazi", "Bronşektazi biliniyor mu?", ["yok", "var", "bilinmiyor"],
          (v) => `Bilinen bronşektazi ${v}.`, "Durum"),
        {
          id: "kf-toraks-bt", label: "Son toraks BT", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 03/2026" },
                { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. yaygın bronşektazi, mukus tıkaçları" }
              ],
              build: (v) => `Son toraks BT ${v.tarih || "…"} tarihinde ${v.sonuc || "…"} olarak raporlanmış.`
            }, SKIP
          ]
        },
        secimBlok("kf-son-donem", "Şikayetlerde son dönem değişim", ["azalma", "artış", "stabil", "bilinmiyor"],
          (v) => `Şikayetlerinde son dönemde ${v} mevcut.`, "Değişim"),
        metinBlok("kf-solunum-ozet", "Solunumsal tutulum özeti", "Özet",
          "ör. sık alevlenmelerle seyreden orta-ağır obstrüktif tutulum",
          (v) => `Hastanın kistik fibrozise bağlı solunumsal tutulumu ${v} ile seyretmektedir.`)
      ]
    },

    /* ===== 4. Pulmoner Alevlenme ve Enfeksiyon ===== */
    {
      id: "kf-alevlenme",
      title: "Pulmoner Alevlenme ve Enfeksiyon Öyküsü",
      blocks: [
        {
          id: "kf-alev-sayi", label: "Yıllık alevlenme ve yatış sayısı", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "alev", type: "text", label: "Yılda alevlenme sayısı", placeholder: "ör. 3-4" },
                { name: "yatis", type: "text", label: "Yılda hastane yatışı sayısı", placeholder: "ör. 2" }
              ],
              build: (v) => `Tekrarlayan pulmoner enfeksiyon/alevlenme öyküsü nedeniyle yılda yaklaşık ${v.alev || "…"} alevlenme ve ${v.yatis || "…"} kez hastane yatışı oluyormuş.`
            }, SKIP
          ]
        },
        {
          id: "kf-son-yatis", label: "Son hastane yatışı", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. Haziran 2026" },
                { name: "servis", type: "text", label: "Servis", placeholder: "ör. Göğüs Hastalıkları" },
                { name: "neden", type: "select", label: "Neden", options: ["pulmoner alevlenme", "pnömoni", "solunum yetmezliği", "diğer"] },
                { name: "tedavi", type: "text", label: "Tedavi", placeholder: "ör. IV antibiyoterapi ve yoğun fizyoterapi" }
              ],
              build: (v) => `Son hastane yatışı ${v.tarih || "…"} tarihinde ${v.servis || "…"} servisinde ${v.neden || "…"} nedeniyle olmuş` +
                (v.tedavi ? ` (tedavi: ${v.tedavi})` : "") + "."
            }, SKIP
          ]
        },
        {
          id: "kf-son-ybu", label: "Son yoğun bakım yatışı", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 2022" },
                { name: "neden", type: "text", label: "Neden", placeholder: "ör. ağır pulmoner alevlenme" },
                { name: "entubasyon", type: "select", label: "Entübasyon öyküsü", options: ["yok", "var"] }
              ],
              build: (v) => `Son yoğun bakım yatışı ${v.tarih || "…"} tarihinde${v.neden ? ` ${v.neden} nedeniyle` : ""} olmuş; entübasyon öyküsü ${v.entubasyon || "…"}.`
            },
            { key: "no", label: "Yoğun bakım yatışı yok", build: () => "Yoğun bakım yatışı öyküsü yok." },
            SKIP
          ]
        },
        {
          id: "kf-son-antibiyotik", label: "Son antibiyotik kullanımı", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "oral", type: "text", label: "Oral", placeholder: "ör. siprofloksasin" },
                { name: "iv", type: "text", label: "IV", placeholder: "ör. seftazidim + tobramisin" },
                { name: "inhale", type: "text", label: "İnhale", placeholder: "ör. kolistin" }
              ],
              build: (v) => {
                const L = [["oral", v.oral], ["IV", v.iv], ["inhale", v.inhale]].filter((x) => x[1] && String(x[1]).trim() !== "").map((x) => `${x[0]} ${x[1]}`);
                return L.length ? `Son antibiyotik kullanımı: ${joinVe(L)}.` : "Son antibiyotik kullanım bilgisi net öğrenilemedi.";
              }
            },
            { key: "yok", label: "Bilgiye ulaşılamadı", build: () => "Son antibiyotik kullanım bilgisine sistemden/hastadan ulaşılamadı." },
            SKIP
          ]
        },
        varYok("kf-sik-alevlenme", "Sık alevlenme paterni var mı?",
          "Sık alevlenme paterni mevcut.", "Sık alevlenme paterni yok.")
      ]
    },
    kfGrup("kf-tetikleyici", "Alevlenme Tetikleyicileri", [
      { id: "viral", label: "Viral enfeksiyon" },
      { id: "uyumsuzluk", label: "Tedavi uyumsuzluğu" },
      { id: "modulator-erisim", label: "Modülatör tedaviye erişememe" },
      { id: "nebul-aksatma", label: "Nebül tedavisini aksatma" },
      { id: "beslenme", label: "Beslenme bozukluğu / kilo kaybı" }
    ]),

    /* ===== 5. Mikrobiyolojik Kolonizasyon ===== */
    kfGrup("kf-koloni", "Mikrobiyolojik Kolonizasyon", [
      { id: "psa", label: "Pseudomonas aeruginosa kolonizasyonu" },
      { id: "mucoid", label: "Mucoid Pseudomonas" },
      { id: "sa", label: "MSSA / MRSA" },
      { id: "bcc", label: "Burkholderia cepacia kompleksi" },
      { id: "steno", label: "Stenotrophomonas maltophilia" },
      { id: "achromo", label: "Achromobacter" },
      { id: "asper", label: "Aspergillus" },
      { id: "ntm", label: "NTM / atipik mikobakteri" }
    ]),
    {
      id: "kf-mikrobiyoloji",
      title: "Kültür ve Antibiyogram",
      blocks: [
        {
          id: "kf-son-kultur", label: "Son balgam kültürü", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 04/2026" },
                { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. mucoid P. aeruginosa üremesi" }
              ],
              build: (v) => `Son balgam kültürü ${v.tarih || "…"} tarihinde ${v.sonuc || "…"} olarak sonuçlanmış.`
            }, SKIP
          ]
        },
        metinBlok("kf-antibiyogram", "Son antibiyogram", "Antibiyogram",
          "ör. seftazidim ve tobramisine duyarlı",
          (v) => `Son antibiyogramda ${v} saptanmış.`),
        metinBlok("kf-koloni-ozet", "Kolonizasyon özeti", "Özet",
          "ör. kronik mucoid Pseudomonas kolonizasyonu",
          (v) => `Önceki solunum yolu kültürlerinde ${v} mevcutmuş; güncel alevlenme yönetimi için balgam kültürü ve önceki antibiyogramların görülmesi önemlidir.`)
      ]
    },

    /* ===== 6. SFT ve Solunum Desteği ===== */
    {
      id: "kf-sft",
      title: "Solunum Fonksiyon Testleri",
      blocks: [
        {
          id: "kf-sft-detay", label: "Son SFT", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 12.05.2026" },
                { name: "fev1", type: "text", label: "FEV1", placeholder: "ör. 1.6 L" },
                { name: "fev1p", type: "text", label: "FEV1 yüzdesi", placeholder: "ör. %52" },
                { name: "fvc", type: "text", label: "FVC", placeholder: "ör. 3.3 L" },
                { name: "oran", type: "text", label: "FEV1/FVC", placeholder: "ör. %48" },
                { name: "obs", type: "select", label: "Obstrüksiyon derecesi", options: ["hafif", "orta", "ağır", "bilinmiyor"] },
                { name: "degisim", type: "select", label: "Önceki SFT'ye göre değişim", options: ["artmış", "azalmış", "stabil", "bilinmiyor"] }
              ],
              build: (v) => {
                const L = [["FEV1", v.fev1], ["FEV1%", v.fev1p], ["FVC", v.fvc], ["FEV1/FVC", v.oran]].filter((x) => x[1] && String(x[1]).trim() !== "").map((x) => `${x[0]} ${x[1]}`);
                let s = `${v.tarih || "…"} tarihinde yapılan SFT'de ${L.length ? L.join(", ") : "…"} olarak sonuçlanmış`;
                if (v.obs) s += `; obstrüksiyon ${v.obs}`;
                if (v.degisim) s += `; önceki teste göre ${v.degisim}`;
                return s + ".";
              }
            }, SKIP
          ]
        },
        metinBlok("kf-spo2", "Oda havasında SpO2", "SpO2", "ör. %93",
          (v) => `Oda havasında SpO2 ${v} olarak ölçülmüş.`)
      ]
    },
    kfGrup("kf-destek", "Solunum Desteği ve Ev Cihazları", [
      { id: "usot", label: "USOT (uzun süreli oksijen tedavisi)" },
      { id: "bipap", label: "BiPAP" },
      { id: "cpap", label: "CPAP" },
      { id: "konsantrator", label: "Evde oksijen konsantratörü" },
      { id: "nebul", label: "Evde nebülizatör" },
      { id: "egzersiz-desat", label: "Egzersiz desatürasyonu" }
    ]),
    kfGrup("kf-hipoventilasyon", "Gece Hipoventilasyon Semptomları", [
      { id: "sabah-basagri", label: "Sabah baş ağrısı" },
      { id: "gunduz-uyku", label: "Gündüz uyku hali" },
      { id: "gece-dispne", label: "Gece nefes darlığı" }
    ]),

    /* ===== 7. CFTR Modülatör Tedavi ===== */
    {
      id: "kf-modulator",
      title: "CFTR Modülatör Tedavi Öyküsü",
      blocks: [
        {
          id: "kf-modulator-doz", label: "Modülatör tedavi (doz ile)", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "trikafta", type: "text", label: "Trikafta/Kaftrio", placeholder: "barem: sabah 2 tab (ela 100/tez 50/iva 75), akşam iva 150 mg" },
                { name: "ivacaftor", type: "text", label: "Ivacaftor", placeholder: "barem: 150 mg 12 saatte bir" },
                { name: "lumacaftor", type: "text", label: "Lumacaftor/ivacaftor", placeholder: "barem: 2x2 tablet" },
                { name: "tezacaftor", type: "text", label: "Tezacaftor/ivacaftor", placeholder: "barem: sabah tez/iva, akşam iva" }
              ],
              build: (v) => {
                const L = [["Trikafta/Kaftrio", v.trikafta], ["ivacaftor", v.ivacaftor], ["lumacaftor/ivacaftor", v.lumacaftor], ["tezacaftor/ivacaftor", v.tezacaftor]].filter((x) => x[1] && String(x[1]).trim() !== "").map((x) => `${x[0]} ${x[1]}`);
                return L.length ? `CFTR modülatör tedavi olarak ${joinVe(L)} kullanmış.` : "CFTR modülatör tedavi kullanım bilgisi net öğrenilemedi.";
              }
            }, SKIP
          ]
        },
        {
          id: "kf-modulator-tarih", label: "Başlama / kesilme ve neden", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "baslama", type: "text", label: "Başlama tarihi", placeholder: "ör. Temmuz 2022" },
                { name: "kesilme", type: "text", label: "Kesilme tarihi", placeholder: "ör. Ağustos 2025" },
                { name: "neden", type: "select", label: "Kesilme nedeni", options: ["SUT/geri ödeme kriterlerini karşılamama", "yan etki", "erişim sorunu", "tedavi uyumsuzluğu", "diğer"] }
              ],
              build: (v) => {
                let s = "";
                if (v.baslama) s += `Modülatör tedaviye ${v.baslama} tarihinde başlanmış`;
                if (v.kesilme) s += `${s ? "; " : "Modülatör tedavi "}${v.kesilme} tarihinden beri kullanılamıyor`;
                if (v.neden) s += ` (${v.neden})`;
                return (s || "Modülatör tedavi başlama/kesilme bilgisi net öğrenilemedi") + ".";
              }
            }, SKIP
          ]
        },
        secimBlok("kf-modulator-kotulesme", "Tedavi kesildikten sonra kötüleşme", ["yok", "var", "bilinmiyor"],
          (v) => `Modülatör tedavi kesildikten sonra kötüleşme ${v}; kesilmenin solunumsal seyir ve alevlenme sıklığı üzerine etkisi sorgulanmalıdır.`, "Durum")
      ]
    },
    kfGrup("kf-modulator-yanit", "Modülatör Tedaviye Klinik Yanıt", [
      { id: "efor-artis", label: "Efor kapasitesinde artış" },
      { id: "balgam-azalma", label: "Öksürük/balgamda azalma" },
      { id: "alevlenme-azalma", label: "Alevlenme sayısında azalma" },
      { id: "kilo-artis", label: "Kilo artışı" },
      { id: "sft-duzelme", label: "SFT'de düzelme" }
    ]),

    /* ===== 8. Güncel Solunum Tedavileri ===== */
    kfGrup("kf-tedavi", "Güncel Solunum Tedavileri", [
      { id: "salbutamol", label: "Nebül salbutamol/ipratropium" },
      { id: "salin", label: "Hipertonik salin" },
      { id: "dornaz", label: "Dornaz alfa" },
      { id: "tobramisin", label: "İnhale tobramisin" },
      { id: "kolistin", label: "İnhale kolistin" },
      { id: "aztreonam", label: "İnhale aztreonam" },
      { id: "azitromisin", label: "Azitromisin profilaksisi" },
      { id: "steroid-laba", label: "İnhale steroid/LABA/LAMA" },
      { id: "mukolitik", label: "Oral mukolitik" },
      { id: "nebul", label: "Evde nebülizatör" }
    ]),
    {
      id: "kf-fizyoterapi",
      title: "Göğüs Fizyoterapisi ve Tedavi Uyumu",
      blocks: [
        {
          id: "kf-fizyo", label: "Göğüs fizyoterapisi", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "duzen", type: "select", label: "Düzen", options: ["düzenli", "düzensiz", "yapmıyor"] },
                { name: "teknik", type: "select", label: "Teknik", options: ["PEP cihazı", "postüral drenaj", "aktif solunum teknikleri", "bilinmiyor"] }
              ],
              build: (v) => `Göğüs fizyoterapisini ${v.duzen || "…"} uyguluyormuş${v.teknik ? ` (${v.teknik})` : ""}.`
            }, SKIP
          ]
        },
        secimBlok("kf-tedavi-uyum", "Tedavi uyumu", ["iyi", "düzensiz", "kötü", "bilinmiyor"],
          (v) => `Solunum tedavilerine uyumu ${v} olarak değerlendirildi.`, "Uyum")
      ]
    },

    /* ===== 9. Gastrointestinal ve Pankreatik Tutulum ===== */
    {
      id: "kf-gis",
      title: "Gastrointestinal ve Pankreatik Tutulum",
      blocks: [
        secimBlok("kf-pankreatik-yetmezlik", "Pankreatik yetmezlik", ["yok", "var", "bilinmiyor"],
          (v) => `Pankreatik yetmezlik ${v}.`, "Durum"),
        varYokDetay("kf-enzim", "Pankreatik enzim replasmanı kullanıyor mu?",
          [{ name: "doz", type: "text", label: "İlaç / doz", placeholder: "ör. pankreatin, öğünlerde" }],
          (v) => `Pankreatik enzim replasmanı kullanıyormuş${v.doz ? ` (${v.doz})` : ""}.`,
          "Pankreatik enzim replasmanı kullanmıyormuş."),
        {
          id: "kf-kilo-bki", label: "Son kilo değişimi ve BKİ", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "kilo", type: "text", label: "Son kilo değişimi", placeholder: "ör. son 6 ayda 3 kg kayıp" },
                { name: "bki", type: "text", label: "BKİ", placeholder: "ör. 19.2 kg/m²" }
              ],
              build: (v) => {
                const L = [];
                if (v.kilo) L.push(`son kilo değişimi ${v.kilo}`);
                if (v.bki) L.push(`BKİ ${v.bki}`);
                return L.length ? buyukHarfBasla(L.join(", ")) + "." : "Kilo/BKİ bilgisi net öğrenilemedi.";
              }
            }, SKIP
          ]
        },
        secimBlok("kf-malnutrisyon", "Malnütrisyon", ["yok", "var", "bilinmiyor"],
          (v) => `Malnütrisyon ${v}.`, "Durum")
      ]
    },
    kfGrup("kf-gis-semp", "Gastrointestinal Semptomlar", [
      { id: "steatore", label: "Steatore" },
      { id: "ishal", label: "Kronik ishal" },
      { id: "kabizlik", label: "Kabızlık" },
      { id: "dios", label: "Distal intestinal obstrüksiyon sendromu öyküsü" },
      { id: "karin-agri", label: "Karın ağrısı" },
      { id: "reflu", label: "Reflü" },
      { id: "pankreatit", label: "Pankreatit öyküsü" }
    ]),
    kfGrup("kf-vitamin", "Yağda Eriyen Vitamin Desteği", [
      { id: "a", label: "A vitamini" },
      { id: "d", label: "D vitamini" },
      { id: "e", label: "E vitamini" },
      { id: "k", label: "K vitamini" }
    ]),

    /* ===== 10. Endokrin ve Metabolik ===== */
    {
      id: "kf-endokrin",
      title: "Endokrin ve Metabolik Komplikasyonlar",
      blocks: [
        secimBlok("kf-kfrd", "Kistik fibrozis ilişkili diyabet (KFRD)", ["yok", "var", "bilinmiyor"],
          (v) => `Kistik fibrozis ilişkili diyabet ${v}.`, "Durum"),
        {
          id: "kf-ogtt", label: "OGTT", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 01/2026" },
                { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. bozulmuş glukoz toleransı" }
              ],
              build: (v) => `OGTT ${v.tarih || "…"} tarihinde ${v.sonuc || "…"} olarak sonuçlanmış.`
            },
            { key: "no", label: "Yapılmadı", build: () => "OGTT yapılmamış." },
            SKIP
          ]
        },
        {
          id: "kf-hba1c", label: "Son HbA1c", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 04/2026" },
                { name: "deger", type: "text", label: "HbA1c (%)", placeholder: "ör. 6.1" }
              ],
              build: (v) => `Son HbA1c ${v.tarih || "…"} tarihinde %${v.deger || "…"} olarak sonuçlanmış.`
            }, SKIP
          ]
        },
        varYok("kf-insulin", "İnsülin kullanımı var mı?", "İnsülin kullanıyormuş.", "İnsülin kullanmıyormuş."),
        varYok("kf-hipoglisemi", "Hipoglisemi öyküsü var mı?", "Hipoglisemi öyküsü mevcut.", "Hipoglisemi öyküsü yok."),
        secimBlok("kf-osteoporoz", "Osteopeni / osteoporoz", ["yok", "var", "bilinmiyor"],
          (v) => `Osteopeni/osteoporoz ${v}.`, "Durum"),
        {
          id: "kf-dexa", label: "DEXA", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 2025" },
                { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. lomber T-skoru -2.1" }
              ],
              build: (v) => `DEXA ${v.tarih || "…"} tarihinde ${v.sonuc || "…"} olarak sonuçlanmış.`
            }, SKIP
          ]
        },
        varYok("kf-dvit", "D vitamini eksikliği var mı?", "D vitamini eksikliği mevcut.", "D vitamini eksikliği yok.")
      ]
    },

    /* ===== 11. Hepatobiliyer ===== */
    {
      id: "kf-hepatobiliyer",
      title: "Hepatobiliyer Tutulum",
      blocks: [
        secimBlok("kf-kc-hastalik", "Karaciğer hastalığı", ["yok", "var", "bilinmiyor"],
          (v) => `Kistik fibroza bağlı karaciğer hastalığı ${v}.`, "Durum"),
        {
          id: "kf-usg-mrcp", label: "Son USG / MRCP", default: "skip",
          modes: [
            {
              key: "fill", label: "Doldur",
              fields: [
                { name: "tarih", type: "text", label: "Tarih", placeholder: "ör. 03/2026" },
                { name: "sonuc", type: "text", label: "Sonuç", placeholder: "ör. hepatosteatoz, splenomegali" }
              ],
              build: (v) => `Son USG/MRCP ${v.tarih || "…"} tarihinde ${v.sonuc || "…"} olarak raporlanmış.`
            }, SKIP
          ]
        }
      ]
    },
    kfGrup("kf-hepato-bulgu", "Hepatobiliyer Bulgular", [
      { id: "kcft", label: "KCFT yüksekliği" },
      { id: "steatoz", label: "Hepatosteatoz" },
      { id: "portal-ht", label: "Portal hipertansiyon" },
      { id: "splenomegali", label: "Splenomegali" },
      { id: "safra-tasi", label: "Safra taşı" },
      { id: "udca", label: "Ursodeoksikolik asit kullanımı" }
    ]),

    /* ===== 12. Üst Solunum Yolu ve KBB ===== */
    kfGrup("kf-kbb", "Üst Solunum Yolu ve KBB Bulguları", [
      { id: "sinuzit", label: "Kronik sinüzit" },
      { id: "polip", label: "Nazal polip" },
      { id: "sik-sinuzit", label: "Sık sinüzit atağı" },
      { id: "kbb-op", label: "KBB operasyonu" },
      { id: "burun-tikaniklik", label: "Burun tıkanıklığı / koku almada azalma" }
    ]),

    /* ===== 13. Üreme Sağlığı ve Sosyal Öykü ===== */
    {
      id: "kf-sosyal",
      title: "Üreme Sağlığı ve Sosyal Öykü",
      blocks: [
        secimBlok("kf-infertilite", "İnfertilite öyküsü", ["sorgulanmadı", "yok", "var"],
          (v) => `İnfertilite öyküsü ${v}.`, "Durum"),
        secimBlok("kf-vaz", "Erkek hastada vaz deferens agenezisi biliniyor mu?", ["bilinmiyor", "yok", "var", "uygulanabilir değil"],
          (v) => `Vaz deferens agenezisi ${v}.`, "Durum"),
        secimBlok("kf-gebelik", "Gebelik planı", ["uygulanabilir değil", "yok", "var"],
          (v) => `Gebelik planı ${v}.`, "Durum"),
        metinBlok("kf-sigara", "Sigara kullanımı", "Sigara", "ör. yok / 5 paket-yıl",
          (v) => `Sigara kullanımı ${v}.`),
        varYok("kf-pasif-sigara", "Pasif sigara maruziyeti var mı?", "Pasif sigara maruziyeti mevcut.", "Pasif sigara maruziyeti yok."),
        varYok("kf-mesleki", "Mesleki maruziyet var mı?", "Mesleki maruziyet öyküsü mevcut.", "Mesleki maruziyet öyküsü yok."),
        metinBlok("kf-ev-bakim", "Ev ortamı / bakım desteği", "Durum", "ör. ailesiyle yaşıyor, bakım desteği yeterli",
          (v) => `Ev ortamı / bakım desteği: ${v}.`)
      ]
    },
    kfGrup("kf-asi", "Aşı Durumu", [
      { id: "influenza", label: "İnfluenza aşısı" },
      { id: "pnomokok", label: "Pnömokok aşısı" },
      { id: "covid", label: "COVID-19 aşısı" }
    ]),

    /* ===== 14. Özgeçmiş, Soygeçmiş ve Ek Hastalıklar ===== */
    {
      id: "kf-ozgecmis",
      title: "Özgeçmiş, Soygeçmiş ve Ek Hastalıklar",
      blocks: [
        secimBlok("kf-abpa", "Astım / alerjik bronkopulmoner aspergilloz (ABPA)", ["yok", "var", "bilinmiyor"],
          (v) => `Astım/ABPA ${v}.`, "Durum"),
        varYokDetay("kf-cerrahi", "Cerrahi öyküsü var mı?",
          [{ name: "detay", type: "text", label: "İşlem / tarih", placeholder: "ör. nazal polipektomi, 2019" }],
          (v) => `Cerrahi öyküsü mevcut${v.detay ? ` (${v.detay})` : ""}.`,
          "Cerrahi öyküsü yok."),
        varYok("kf-aile-kf", "Ailede kistik fibrozis var mı?", "Ailede kistik fibrozis öyküsü mevcut.", "Ailede kistik fibrozis öyküsü yok."),
        varYokDetay("kf-akraba", "Akraba evliliği var mı?",
          [{ name: "derece", type: "text", label: "Akrabalık derecesi (anne-baba arası)", placeholder: "ör. birinci derece kuzen" }],
          (v) => `Anne-baba arasında akraba evliliği mevcut${v.derece ? ` (${v.derece})` : ""}.`,
          "Anne-baba arasında akraba evliliği yok."),
        varYok("kf-kardes", "Kardeşlerde benzer hastalık var mı?", "Kardeşlerde benzer hastalık öyküsü mevcut.", "Kardeşlerde benzer hastalık öyküsü yok.")
      ]
    }
  ]
};
