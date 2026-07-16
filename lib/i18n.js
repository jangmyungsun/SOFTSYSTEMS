const SUPPORTED_LOCALES = ["en", "ko", "ja"];

const translations = {
  en: {
    nav: {
      home: "Home",
      input: "Input",
      process: "Process",
      output: "Output",
      about: "About",
      letters: "Visitor Letters",
      logout: "Logout",
      admin: "Admin",
    },
    letters: {
      title: "Visitor Letters",
      heading: "Leave a letter for the system",
      subtitle: "A place for responses, traces, questions, and small messages from visitors.",
      writeTitle: "Write a Letter",
      name: "Name",
      anonymous: "Anonymous",
      message: "Message",
      placeholder: "Write a letter...",
      public: "Public",
      private: "Private",
      publicHelp: "This letter may be shown on the Visitor Letters page.",
      privateHelp: "This letter will only be visible to the logged-in owner.",
      send: "Send Letter",
      sending: "Sending…",
      success: "Your letter has been sent.",
      publicLetters: "Public Letters",
      publicLettersSub: "Letters left behind",
      loading: "Loading letters…",
      empty: "No public letters yet.",
      latest: "Latest Incoming Letter",
      ownerView: "Owner view",
      latestLoading: "Loading latest letter…",
      latestEmpty: "No letters yet.",
      status: "Status",
      publicStatus: "Public",
      privateStatus: "Private",
      wantsPublic: "Wants public",
      yes: "Yes",
      no: "No",
      makePublic: "Make Public",
      makePrivate: "Make Private",
      delete: "Delete",
      validationMessage: "Please write a message before sending.",
      validationName: "The name must be 80 characters or fewer.",
      validationLength: "The letter must be 2,000 characters or fewer.",
      submitError: "The letter could not be sent.",
      updateError: "The update could not be completed.",
      deleteError: "The letter could not be deleted.",
      updateSuccess: "The letter status has been updated.",
      deleteSuccess: "The letter has been deleted.",
      error: "The letter could not be sent."
    },
    about: {
      title: "About",
      subtitle: "Sound-based media artist working with body, sensation, everyday life, and systems of observation.",
      practice: "Practice",
      practiceBody: "Jang Myung Sun is a sound-based media artist who translates bodily states, sensations, and everyday environments into sound, image, text, video, performance, and digital systems.",
      practiceBody2: "Her work begins with the body as a sensing and responsive system. Rather than treating the body as an object of representation, she observes how it reacts, adapts, remembers, and connects with its surroundings.",
      systems: "SOFTSYSTEMS",
      systemsBody: "SOFTSYSTEMS is an evolving artistic ecology that gathers Daily records, writing, media, body data, and creative processes.",
      systemsBody2: "Through Input, Process, and Output, the system traces relationships among body, environment, memory, and artistic practice.",
      contact: "Contact",
      email: "Email",
      instagram: "Instagram",
      portfolio: "Portfolio",
      viewPortfolio: "View Portfolio ↗",
      countLoading: "Counting visitors…",
      count: "{count} visitors have passed through this system."
    },
    login: {
      title: "Login",
      account: "Account",
      instructions: "Use the owner account created in Supabase Auth.",
      email: "Email",
      password: "Password",
      signIn: "Sign in",
      signOut: "Sign out",
      signedIn: "Signed in as"
    },
    common: {
      admin: "Admin"
    }
  },
  ko: {
    nav: {
      home: "홈",
      input: "입력",
      process: "과정",
      output: "출력",
      about: "소개",
      letters: "방명록",
      logout: "로그아웃",
      admin: "관리자",
    },
    letters: {
      title: "방명록",
      heading: "시스템에 편지를 남겨주세요",
      subtitle: "방문자가 남기는 응답, 흔적, 질문과 작은 메시지의 장소입니다.",
      writeTitle: "편지 쓰기",
      name: "이름",
      anonymous: "익명",
      message: "메시지",
      placeholder: "편지를 적어주세요...",
      public: "공개",
      private: "비공개",
      publicHelp: "이 편지는 방문자 편지 페이지에 보일 수 있습니다.",
      privateHelp: "이 편지는 로그인한 소유자만 볼 수 있습니다.",
      send: "편지 보내기",
      sending: "보내는 중…",
      success: "편지가 전송되었습니다.",
      publicLetters: "공개된 편지",
      publicLettersSub: "남겨진 편지들",
      loading: "편지를 불러오는 중…",
      empty: "아직 공개된 편지가 없습니다.",
      latest: "최근 받은 편지",
      ownerView: "소유자 보기",
      latestLoading: "최근 편지를 불러오는 중…",
      latestEmpty: "아직 편지가 없습니다.",
      status: "상태",
      publicStatus: "공개",
      privateStatus: "비공개",
      wantsPublic: "공개 여부",
      yes: "예",
      no: "아니오",
      makePublic: "공개로 전환",
      makePrivate: "비공개로 전환",
      delete: "삭제",
      validationMessage: "보내기 전에 메시지를 입력해 주세요.",
      validationName: "이름은 80자 이하여야 합니다.",
      validationLength: "편지는 2,000자 이하여야 합니다.",
      submitError: "편지를 보내지 못했습니다.",
      updateError: "상태를 변경하지 못했습니다.",
      deleteError: "편지를 삭제하지 못했습니다.",
      updateSuccess: "편지 상태가 변경되었습니다.",
      deleteSuccess: "편지가 삭제되었습니다.",
      error: "편지를 보내지 못했습니다."
    },
    about: {
      title: "소개",
      subtitle: "몸, 감각, 일상, 관찰의 시스템으로 작업하는 사운드 기반 미디어 아티스트.",
      practice: "실천",
      practiceBody: "장명선은 몸의 상태, 감각, 일상 환경을 사운드, 이미지, 텍스트, 비디오, 퍼포먼스, 디지털 시스템으로 번역하는 사운드 기반 미디어 아티스트입니다.",
      practiceBody2: "그녀의 작업은 몸을 감지하고 반응하는 시스템으로 바라봅니다. 몸을 표현의 대상으로 보지 않고, 어떻게 반응하고 적응하고 기억하며 주변과 연결되는지를 관찰합니다.",
      systems: "SOFTSYSTEMS",
      systemsBody: "SOFTSYSTEMS는 일상 기록, 글쓰기, 미디어, 몸의 데이터, 창작 과정을 모아 두는 진화하는 예술 생태계입니다.",
      systemsBody2: "입력, 과정, 출력이라는 흐름을 통해 몸, 환경, 기억, 예술적 실천의 관계를 추적합니다.",
      contact: "연락처",
      email: "이메일",
      instagram: "인스타그램",
      portfolio: "포트폴리오",
      viewPortfolio: "포트폴리오 보기 ↗",
      countLoading: "방문자를 세고 있습니다…",
      count: "{count}명이 이 시스템을 지나갔습니다."
    },
    login: {
      title: "로그인",
      account: "계정",
      instructions: "Supabase Auth에 만든 소유자 계정을 사용하세요.",
      email: "이메일",
      password: "비밀번호",
      signIn: "로그인",
      signOut: "로그아웃",
      signedIn: "로그인됨"
    },
    common: {
      admin: "관리자"
    }
  },
  ja: {
    nav: {
      home: "ホーム",
      input: "入力",
      process: "プロセス",
      output: "出力",
      about: "紹介",
      letters: "訪問者の手紙",
      logout: "ログアウト",
      admin: "管理者",
    },
    letters: {
      title: "訪問者の手紙",
      heading: "システムに手紙を残す",
      subtitle: "訪問者が残す応答、痕跡、質問、短いメッセージのための場です。",
      writeTitle: "手紙を書く",
      name: "名前",
      anonymous: "匿名",
      message: "メッセージ",
      placeholder: "手紙を書いてください…",
      public: "公開",
      private: "非公開",
      publicHelp: "この手紙は訪問者の手紙ページに表示されることがあります。",
      privateHelp: "この手紙はログインした所有者のみが閲覧できます。",
      send: "手紙を送る",
      sending: "送信中…",
      success: "手紙を送信しました。",
      publicLetters: "公開中の手紙",
      publicLettersSub: "残された手紙",
      loading: "手紙を読み込んでいます…",
      empty: "まだ公開中の手紙はありません。",
      latest: "最新の受信手紙",
      ownerView: "所有者ビュー",
      latestLoading: "最新の手紙を読み込んでいます…",
      latestEmpty: "まだ手紙はありません。",
      status: "状態",
      publicStatus: "公開",
      privateStatus: "非公開",
      wantsPublic: "公開設定",
      yes: "はい",
      no: "いいえ",
      makePublic: "公開する",
      makePrivate: "非公開にする",
      delete: "削除",
      validationMessage: "送信前にメッセージを入力してください。",
      validationName: "名前は80文字以内で入力してください。",
      validationLength: "手紙は2,000文字以内で入力してください。",
      submitError: "手紙を送信できませんでした。",
      updateError: "状態を変更できませんでした。",
      deleteError: "手紙を削除できませんでした。",
      updateSuccess: "手紙の状態を変更しました。",
      deleteSuccess: "手紙を削除しました。",
      error: "手紙を送信できませんでした。"
    },
    about: {
      title: "紹介",
      subtitle: "身体、感覚、日常、観察のシステムとして働くサウンドベースのメディアアーティスト。",
      practice: "実践",
      practiceBody: "Jang Myung Sunは、身体の状態、感覚、日常環境をサウンド、イメージ、テキスト、ビデオ、パフォーマンス、デジタルシステムへと変換するサウンドベースのメディアアーティストです。",
      practiceBody2: "彼女の作品は、身体を感知し反応するシステムとして捉えます。身体を表現の対象として扱うのではなく、どう反応し、適応し、記憶し、周囲とつながるのかを観察します。",
      systems: "SOFTSYSTEMS",
      systemsBody: "SOFTSYSTEMSは、日常の記録、文章、メディア、身体データ、創作プロセスを集める進化し続ける芸術的エコロジーです。",
      systemsBody2: "Input、Process、Outputを通じて、身体、環境、記憶、芸術的実践の関係を追跡します。",
      contact: "お問い合わせ",
      email: "メール",
      instagram: "Instagram",
      portfolio: "ポートフォリオ",
      viewPortfolio: "ポートフォリオを見る ↗",
      countLoading: "訪問者を数えています…",
      count: "{count}人がこのシステムを通過しました。"
    },
    login: {
      title: "ログイン",
      account: "アカウント",
      instructions: "Supabase Authで作成した所有者アカウントを使用してください。",
      email: "メール",
      password: "パスワード",
      signIn: "ログイン",
      signOut: "ログアウト",
      signedIn: "ログイン中"
    },
    common: {
      admin: "管理者"
    }
  }
};

function normalizeLocaleValue(value) {
  if (!value) {
    return "en";
  }

  const normalized = value.toLowerCase();

  if (normalized.startsWith("ko")) {
    return "ko";
  }

  if (normalized.startsWith("ja")) {
    return "ja";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return "en";
}

function getBrowserLocale() {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const candidates = [];

  if (Array.isArray(navigator.languages) && navigator.languages.length) {
    candidates.push(...navigator.languages);
  }

  if (navigator.language) {
    candidates.push(navigator.language);
  }

  for (const candidate of candidates) {
    const locale = normalizeLocaleValue(candidate);
    if (SUPPORTED_LOCALES.includes(locale)) {
      return locale;
    }
  }

  return "en";
}

function getStoredLocale() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem("softsystems_locale");
  } catch (error) {
    return null;
  }
}

function setStoredLocale(locale) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem("softsystems_locale", locale);
  } catch (error) {
    // ignore unavailable storage
  }
}

function resolveLocale(value) {
  if (value) {
    return normalizeLocaleValue(value);
  }

  const stored = getStoredLocale();
  if (stored) {
    return normalizeLocaleValue(stored);
  }

  return getBrowserLocale();
}

export function getInitialLocale() {
  if (typeof window === "undefined") {
    return "en";
  }

  return resolveLocale(getStoredLocale() || navigator.language || "en");
}

export function getSupportedLocales() {
  return SUPPORTED_LOCALES;
}

export function t(locale, key, params = {}) {
  const dictionary = translations[locale] || translations.en;
  const segments = key.split(".");
  let value = dictionary;

  for (const segment of segments) {
    if (!value || typeof value !== "object") {
      value = null;
      break;
    }
    value = value[segment];
  }

  if (typeof value !== "string") {
    return key;
  }

  return value.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
}

export function normalizeLocale(value) {
  return normalizeLocaleValue(value);
}

export function setLocalePreference(locale) {
  const normalized = normalizeLocale(locale);
  setStoredLocale(normalized);
  return normalized;
}

export function getLocaleFromStorage() {
  return getStoredLocale();
}
