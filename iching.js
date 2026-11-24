/* 爻卦核心資料與邏輯(無 DOM 依賴,可在 node 測試) */
(function (root) {
  "use strict";

  // 八卦:由下往上的爻(1=陽,0=陰)
  const TRIGRAMS = {
    "111": { name: "乾", image: "天", sym: "☰" },
    "000": { name: "坤", image: "地", sym: "☷" },
    "100": { name: "震", image: "雷", sym: "☳" },
    "011": { name: "巽", image: "風", sym: "☴" },
    "010": { name: "坎", image: "水", sym: "☵" },
    "101": { name: "離", image: "火", sym: "☲" },
    "001": { name: "艮", image: "山", sym: "☶" },
    "110": { name: "兌", image: "澤", sym: "☱" }
  };

  // 列:下卦;欄:上卦(乾 震 坎 艮 坤 巽 離 兌)→ 文王卦序
  const UPPER_ORDER = ["乾", "震", "坎", "艮", "坤", "巽", "離", "兌"];
  const TABLE = {
    乾: [1, 34, 5, 26, 11, 9, 14, 43],
    震: [25, 51, 3, 27, 24, 42, 21, 17],
    坎: [6, 40, 29, 4, 7, 59, 64, 47],
    艮: [33, 62, 39, 52, 15, 53, 56, 31],
    坤: [12, 16, 8, 23, 2, 20, 35, 45],
    巽: [44, 32, 48, 18, 46, 57, 50, 28],
    離: [13, 55, 63, 22, 36, 37, 30, 49],
    兌: [10, 54, 60, 41, 19, 61, 38, 58]
  };

  // 卦序 1~64:[卦名, 關鍵詞, 白話解讀與建議]
  const HEX = [
    null,
    ["乾", "剛健進取", "陽氣旺盛、時機強勁。宜主動出擊、自強不息,但忌過亢與驕滿。"],
    ["坤", "厚德載物", "順勢柔順、包容承載。宜配合與累積,不宜強出頭,跟對人事。"],
    ["屯", "起頭艱難", "草創階段、局面未明。宜穩紮穩打、尋求助力,不急於求成。"],
    ["蒙", "啟蒙求教", "認知模糊、需要學習。宜虛心請教、釐清方向後再行動。"],
    ["需", "等待時機", "時機未到。宜蓄力等待、保持耐心,急進反而受阻。"],
    ["訟", "爭執分歧", "容易有口舌或糾紛。宜退一步求和解,避免纏訟消耗。"],
    ["師", "組織紀律", "需要統籌與紀律。宜有明確領導與規則,慎用強硬手段。"],
    ["比", "親近輔佐", "和合相親、互助結盟。宜擇善而交、真誠相待,別猶豫太久。"],
    ["小畜", "小有蓄積", "力量尚小、受到牽制。宜小步累積,不宜大動作。"],
    ["履", "如履虎尾", "處境微妙、需謹慎守禮。行事有分寸,可化險為夷。"],
    ["泰", "通泰順暢", "上下交流、局面亨通。宜把握良機推進,並預防盛極而衰。"],
    ["否", "閉塞不通", "溝通不良、小人當道。宜守正自保、低調等待轉機。"],
    ["同人", "志同道合", "適合合作與公開協同。宜以大義結盟、放下私心。"],
    ["大有", "豐盛擁有", "資源充足、成果顯著。宜謙遜自持、善用所得,勿招嫉妒。"],
    ["謙", "謙虛有益", "謙遜得人心、內外皆宜。宜低調務實、先人後己。"],
    ["豫", "喜悅順應", "氣氛愉悅、事前準備得宜。宜順勢而為,勿耽於安逸。"],
    ["隨", "順隨應變", "跟隨時勢或賢者。宜靈活調整、擇善而從,堅守正道。"],
    ["蠱", "整治積弊", "舊問題積累、需要革新。宜正視弊病、動手整頓。"],
    ["臨", "親臨而上", "勢頭上升、有人相助。宜把握成長期,但提防後勢轉弱。"],
    ["觀", "觀察審視", "宜多觀察、多省思。先看清局勢與自身,再做決定。"],
    ["噬嗑", "排除阻礙", "中間有障礙需處理。宜果斷溝通或處置,公正為先。"],
    ["賁", "文飾外表", "外在形式漂亮、內涵需充實。重實質,小事可修飾。"],
    ["剝", "剝落衰退", "局勢走弱、不宜擴張。宜保守守成、順勢止損。"],
    ["復", "一陽來復", "低谷回升、重新開始。宜循序恢復,不要急躁。"],
    ["無妄", "順其自然", "勿存妄念、不投機。守正本分,意外之事以誠實面對。"],
    ["大畜", "大量積蓄", "實力累積、蓄勢待發。宜充實學養、等待大展身手。"],
    ["頤", "頤養自省", "關乎飲食、言語與養生。宜謹言慎食,善養自身與他人。"],
    ["大過", "負擔過重", "承載超出常態、屬非常時期。宜果斷處理,但需有支撐。"],
    ["坎", "重重險陷", "困難反覆出現。宜守信、耐心,逐步脫困。"],
    ["離", "光明依附", "光明附著、需有所依附。宜柔和守正、以明智待人。"],
    ["咸", "感應相通", "相互吸引、心有所感。宜真誠交流,順勢但勿躁進。"],
    ["恆", "持之以恆", "長久穩定、持續行事。宜堅持方向,同時懂得變通。"],
    ["遯", "退避守安", "小人漸長、宜暫退。適時退讓、保存實力。"],
    ["大壯", "氣勢強盛", "力量強大。宜守禮克制,不恃強冒進。"],
    ["晉", "前進晉升", "光明上升、受肯定。宜積極表現、把握提拔機會。"],
    ["明夷", "光明受傷", "才華被壓、環境不利。宜韜光養晦、守住本心。"],
    ["家人", "家道內務", "內部治理、家庭和睦。宜各守其位、言行有信。"],
    ["睽", "背離乖違", "意見不合、各執一詞。宜求同存異,小事可成。"],
    ["蹇", "行路艱難", "前路受阻。宜止步反省、求助賢者,不宜硬闖。"],
    ["解", "解除困局", "困境緩解、壓力釋放。宜儘快處理遺留問題、寬以待人。"],
    ["損", "減損有誠", "先損後益、捨小得大。宜節制並誠心付出。"],
    ["益", "增益得利", "得助成長、利於行動。宜把握機會、行善求進。"],
    ["夬", "決斷果決", "需堅決清除隱患。宜公開表態、果決但防反彈。"],
    ["姤", "不期而遇", "意外相遇、易有誘惑。宜謹慎辨識,不輕易深交。"],
    ["萃", "聚集會合", "人才物資聚集。宜有主事者、預防意外、誠心匯聚。"],
    ["升", "逐步上升", "穩步提升、順勢成長。宜腳踏實地、循序漸進。"],
    ["困", "受困窘迫", "資源受限、言語難被採信。宜堅守本心、忍耐待變。"],
    ["井", "取之不竭", "關乎修養、服務與基礎建設。宜維護根本、持續供給。"],
    ["革", "變革更新", "時機成熟才改。宜先取信於人、順時變革。"],
    ["鼎", "鼎新取新", "除舊布新、成就穩固。宜重用人才、建立新局。"],
    ["震", "震動警醒", "突發震撼、先驚後穩。宜保持鎮定、藉機反省。"],
    ["艮", "止而不動", "適時停止、克制。宜靜心觀望、行止得宜。"],
    ["漸", "循序漸進", "逐步發展、穩健成事。宜耐心循序,不可躁進。"],
    ["歸妹", "名分失序", "關係或安排不穩。宜謹慎評估,重名分與承諾。"],
    ["豐", "豐盛盛大", "達到高點、光明盛大。宜把握當下,並預防盛極而衰。"],
    ["旅", "旅居外地", "處於客位、根基不穩。宜謙和謹慎,小事可成。"],
    ["巽", "謙遜滲透", "柔順入微、重溝通與指令。宜反覆溝通、果斷落實。"],
    ["兌", "喜悅交流", "和悅談笑、利於溝通。宜真誠,勿流於諂媚。"],
    ["渙", "渙散化解", "人心離散、可疏通化解。宜凝聚共識、化解隔閡。"],
    ["節", "節制有度", "設限度、守規矩。宜適度節制,過苛則難持久。"],
    ["中孚", "誠信於中", "以誠感人。宜真誠待人、以誠換信任。"],
    ["小過", "小事可為", "宜低調謹慎,小事可、大事慎。細節多留心。"],
    ["既濟", "事已完成", "大功告成但易生變。宜居安思危、守成防亂。"],
    ["未濟", "尚未完成", "事未竟、仍有轉機。宜謹慎收尾、把握最後一步。"]
  ];

  const LINE_NAMES = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
  const LINE_MEANING = [
    "事情的起點、潛藏未顯的階段",
    "內部、基層或輔佐的位置,宜守中",
    "進退轉折之處,風險較高",
    "接近核心、外部環境,進退需審慎",
    "核心與主導的位置,影響最大",
    "終局或過極的位置,物極必反"
  ];

  // 線值:6 老陰(動)、7 少陽、8 少陰、9 老陽(動)
  const LINE_KIND = {
    6: { label: "老陰", yang: 0, moving: true, mark: "×" },
    7: { label: "少陽", yang: 1, moving: false, mark: "" },
    8: { label: "少陰", yang: 0, moving: false, mark: "" },
    9: { label: "老陽", yang: 1, moving: true, mark: "○" }
  };

  function hexNumber(bits) {
    const lower = TRIGRAMS[bits.slice(0, 3).join("")].name;
    const upper = TRIGRAMS[bits.slice(3, 6).join("")].name;
    return TABLE[lower][UPPER_ORDER.indexOf(upper)];
  }

  function describe(bits) {
    const no = hexNumber(bits);
    const h = HEX[no];
    const lo = TRIGRAMS[bits.slice(0, 3).join("")];
    const up = TRIGRAMS[bits.slice(3, 6).join("")];
    return {
      no, bits: bits.slice(), name: h[0], keyword: h[1], text: h[2],
      upper: up, lower: lo,
      structure: up.image + lo.image + h[0] + "(" + up.name + "上" + lo.name + "下)"
    };
  }

  // 由六個線值(由下而上)計算整個結果
  function analyze(values) {
    if (!Array.isArray(values) || values.length !== 6 || values.some(v => !LINE_KIND[v])) {
      throw new Error("需要六個爻值(6/7/8/9)");
    }
    const kinds = values.map(v => LINE_KIND[v]);
    const bits = kinds.map(k => k.yang);
    const changedBits = kinds.map(k => (k.moving ? 1 - k.yang : k.yang));
    const moving = [], still = [];
    kinds.forEach((k, i) => (k.moving ? moving : still).push(i + 1));

    const main = describe(bits);
    const changed = moving.length ? describe(changedBits) : null;
    const mutual = describe([bits[1], bits[2], bits[3], bits[2], bits[3], bits[4]]);
    const opposite = describe(bits.map(b => 1 - b));
    const reversed = describe(bits.slice().reverse());

    return {
      values: values.slice(), kinds, bits, moving, still,
      main, changed, mutual, opposite, reversed,
      guide: readingGuide(main, changed, moving, still, values)
    };
  }

  function lineBrief(n) {
    return LINE_NAMES[n - 1] + "(" + LINE_MEANING[n - 1] + ")";
  }

  // 依朱熹《易學啟蒙》常見的「動爻數」取斷方式
  function readingGuide(main, changed, moving, still, values) {
    const n = moving.length;
    const list = arr => arr.map(x => LINE_NAMES[x - 1]).join("、");
    switch (n) {
      case 0:
        return {
          rule: "六爻皆不動",
          focus: "以本卦「" + main.name + "」的整體卦義為主。",
          detail: "局勢相對穩定,先看本卦的處境與建議,不必過度解讀變化。"
        };
      case 1:
        return {
          rule: "一爻動",
          focus: "以本卦「" + main.name + "」的" + list(moving) + "為主。",
          detail: "重點落在" + lineBrief(moving[0]) + ";再參考變卦「" + changed.name + "」看走向。"
        };
      case 2: {
        const lead = Math.max.apply(null, moving);
        return {
          rule: "二爻動",
          focus: "以本卦「" + main.name + "」的" + list(moving) + "為主,並以較上的" + LINE_NAMES[lead - 1] + "為重。",
          detail: "兩處同時變動,事情有兩個切入點;變卦「" + changed.name + "」可視為發展方向。"
        };
      }
      case 3:
        return {
          rule: "三爻動",
          focus: "本卦「" + main.name + "」為現況(貞),變卦「" + changed.name + "」為後續(悔),兩者並看。",
          detail: "變動已過半,現況正在轉變,宜把握當下並準備轉換。"
        };
      case 4: {
        const lead = Math.min.apply(null, still);
        return {
          rule: "四爻動",
          focus: "以變卦「" + changed.name + "」中的兩個不動爻(" + list(still) + ")為主,並以較下的" + LINE_NAMES[lead - 1] + "為重。",
          detail: "大局已在轉變,宜著重變卦所指示的新局面。"
        };
      }
      case 5:
        return {
          rule: "五爻動",
          focus: "以變卦「" + changed.name + "」中唯一不動的" + list(still) + "為主。",
          detail: "幾乎全盤變動,不動的那一爻是關鍵;" + lineBrief(still[0]) + "。"
        };
      default: {
        let special = "";
        if (main.no === 1) special = "乾卦六爻皆動,另有「用九」之說:群龍無首,剛極宜柔、不爭先。";
        else if (main.no === 2) special = "坤卦六爻皆動,另有「用六」之說:宜守正長久,以柔順求利。";
        return {
          rule: "六爻皆動",
          focus: "以變卦「" + changed.name + "」的卦義為主。",
          detail: special || "局勢全面翻轉,現況不宜沿用,重點看變卦的處境與建議。"
        };
      }
    }
  }

  // 擲三枚銅錢:正面=3、反面=2,三枚相加得 6/7/8/9
  function randomInts(count, max) {
    const out = [];
    const c = typeof crypto !== "undefined" ? crypto : (typeof globalThis !== "undefined" ? globalThis.crypto : null);
    if (c && c.getRandomValues) {
      const buf = new Uint32Array(count);
      const limit = Math.floor(4294967296 / max) * max; // 避免取模偏差
      for (let i = 0; i < count; i++) {
        let v;
        do { c.getRandomValues(buf.subarray(i, i + 1)); v = buf[i]; } while (v >= limit);
        out.push(v % max);
      }
    } else {
      for (let i = 0; i < count; i++) out.push(Math.floor(Math.random() * max));
    }
    return out;
  }

  function tossLine() {
    const coins = randomInts(3, 2).map(b => (b ? 3 : 2)); // 3=正(字) 2=反(背)
    return { coins, value: coins[0] + coins[1] + coins[2] };
  }

  const api = {
    TRIGRAMS, TABLE, UPPER_ORDER, HEX, LINE_NAMES, LINE_MEANING, LINE_KIND,
    analyze, describe, hexNumber, tossLine
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IChing = api;
})(typeof window !== "undefined" ? window : globalThis);
