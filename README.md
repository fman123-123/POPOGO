# 爻卦分析

純前端的爻卦排盤網頁:搖三枚銅錢起卦,自動排出本卦、互卦、變卦、錯卦、綜卦,並依動爻數給出斷卦重點。無後台、無追蹤,歷史紀錄只存在瀏覽器本機。

## 功能

- 搖銅錢:一次搖六爻,或逐爻搖
- 手動排卦:已有卦象時直接選每一爻
- 本卦 / 互卦 / 變卦 / 錯卦 / 綜卦
- 依動爻數(0–6)取斷(朱熹《易學啟蒙》常見規則)
- 最近 10 筆紀錄(localStorage)、一鍵複製結果
- 手機版面、深色主題

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 頁面 |
| `style.css` | 樣式 |
| `iching.js` | 64 卦資料與排卦邏輯(無 DOM 依賴) |
| `app.js` | 介面互動 |

## 本機預覽

直接用瀏覽器開啟 `index.html` 即可。

## 部署到 GitHub Pages

1. 在 GitHub 新增倉庫(Public),例如 `yaogua`。
2. 把這四個檔案與 README.md 上傳到倉庫根目錄。
3. 倉庫 **Settings → Pages → Build and deployment**,Source 選 **Deploy from a branch**,Branch 選 `main`、資料夾 `/ (root)`,按 Save。
4. 約一分鐘後網址為 `https://<你的帳號>.github.io/yaogua/`。

## 說明

解讀文字為白話簡述,並非原典爻辭,僅供文化學習與自我反思,重大決定請以事實與專業意見為準。
