# Anamnez Oluşturucu

Form bazlı soru-cevaplara dayanarak **hipertansiyon anamnez taslağı** üreten,
tamamen tarayıcıda çalışan web uygulaması.

## Mantık

Örnek anamnez şablonundaki her **(Değişken)** bölüm bir soru bloğuna dönüşür.
Her blok üç durumludur:

- **Evet / Var** → açık uçlu boşluk doldurma alanları açılır (anamnez özgünlüğü için).
- **Hayır / Yok** → sabit olumsuz cümle taslağa eklenir.
- **Atla** → o bölüm taslağa **hiç işlenmez**.

Semptomlar için özel bir bölüm vardır: her semptom **Yok / Ara sıra / Sık sık /
Atla** olarak işaretlenir; "son zamanlarda arttı" kutusu yakın zamanda
şiddetlenen tabloyu ayrı bir cümle olarak ekler. Cümleler gruplanarak doğal bir
anamnez metnine dönüştürülür.

## Çalıştırma

Kurulum gerektirmez. Yerelde önizlemek için:

```bash
python3 -m http.server 8000
# tarayıcıda http://localhost:8000
```

Veya `index.html` dosyasını doğrudan tarayıcıda açın.

## Dosyalar

| Dosya        | İçerik                                                   |
|--------------|----------------------------------------------------------|
| `index.html` | Sayfa iskeleti ve önizleme paneli                        |
| `schema.js`  | Soru şablonu (veri modeli) ve cümle üreticileri          |
| `app.js`     | Formu oluşturan render motoru ve canlı taslak üretimi    |
| `styles.css` | Arayüz stilleri                                          |

## Yeni şablon eklemek

`schema.js` içindeki yapıya benzer yeni bir şema nesnesi tanımlayıp
`app.js` içindeki `TEMPLATES` sözlüğüne ekleyin; başlıktaki açılır menüde
otomatik olarak seçilebilir hale gelir.
