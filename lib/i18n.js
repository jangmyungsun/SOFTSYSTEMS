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
    home: {
      practiceRhythm: "Practice Rhythm",
      making: "Making",
      learning: "Learning",
      bodyMoving: "Body Moving",
      bodyWeather: "Body Weather",
      energyTone: "Energy Tone",
      currentMode: "Current Mode",
      today: "Today",
      softSuggestion: "Soft Suggestion",
      loadingSuggestion: "Loading suggestion…",
      noSuggestion: "The next suggestion will appear after the nightly update.",
      input: "Input",
      latestArchive: "Latest Archive",
      latestDaily: "Latest Daily",
      viewAll: "View All",
      noArchiveEntries: "No public Archive entries yet.",
      noDailyRecords: "No public Daily records yet.",
      thisWeek: "this week"
    },
    input: {
      title: "Input",
      heading: "Records entering the system",
      subtitle: "Archive holds longer thoughts and media. Daily records changing conditions of the body, environment, and artistic practice.",
      loading: "Loading the latest Input…",
      archive: "Archive",
      latestArchive: "Latest Archive",
      latestDaily: "Latest Daily",
      viewAll: "View All",
      noArchiveEntries: "No public Archive entries yet.",
      noDailyRecords: "No public Daily entries yet.",
      loadError: "The latest Input records could not be loaded."
    },
    process: {
      title: "Process",
      heading: "Records becoming patterns and relationships",
      subtitle: "Accumulated rhythms, numeric data, System readings, and semantic connections generated from Input.",
      loading: "Loading Process…",
      loadError: "Process data could not be loaded.",
      stats: "Stats",
      accumulatedRhythms: "Accumulated Rhythms",
      openStats: "Open Stats",
      making: "Making",
      learning: "Learning",
      moving: "Moving",
      bodyWeather: "Body Weather",
      mindWeather: "Mind Weather",
      energyTone: "Energy Tone",
      data: "Data",
      numericData: "Numeric Data",
      openData: "Open Data",
      dataSubtitle: "Numeric body, Body Moving, making, learning, and weather data for mapping and external systems.",
      exportCsv: "Export CSV",
      exportJson: "Export JSON",
      mappingFields: "Mapping Fields",
      publicRecords: "{count} public records available.",
      system: "System",
      currentSystemReading: "Current System Reading",
      viewFull: "View Full",
      currentMode: "Current Mode",
      overview: "Overview",
      openQuestion: "Open Question",
      noSystemReading: "No public System reading yet.",
      weave: "Weave",
      latestSemanticSnapshot: "Latest Semantic Snapshot",
      viewWeave: "View Weave",
      records: "Records",
      connections: "Connections",
      threshold: "Threshold",
      noWeaveSnapshot: "No public Weave snapshot yet.",
      preview: "Preview",
      loadingData: "Loading numeric data…",
      totalPublic: "total public",
      periodReading: "Period Reading",
      periodReadingSubtitle: "A nightly reading of recent relationships among body, environment, practice, artistic input, and creation.",
      generatedAutomatically: "Generated automatically once each night.",
      loadingSystemReading: "Loading the latest System reading…",
      noSystemReadingYet: "No System Reading Yet",
      noSystemReadingText: "The first reading will appear after the nightly update runs.",
      recurringSignals: "Recurring Signals",
      noRecurringSignals: "No recurring signals were identified.",
      shifts: "Shifts",
      noShifts: "No clear shifts were identified.",
      relationships: "Relationships",
      noRelationships: "No grounded relationships were identified.",
      exportLatestReading: "Export Latest Reading",
      semanticConnections: "Semantic Connections",
      weaveSubtitle: "Daily records are connected by meaning, atmosphere, artistic input, body signals, and recurring concerns.",
      loadingWeave: "Loading the latest Weave…",
      noWeaveSnapshotYet: "No Weave Snapshot Yet",
      noWeaveSnapshotText: "The first semantic network will appear after the nightly update runs.",
      strongestConnections: "Strongest Connections",
      noConnections: "No connection reached the current similarity threshold.",
      firstRecord: "First Record",
      secondRecord: "Second Record",
      artisticInput: "Artistic Input",
      unresolved: "Unresolved"
    },
    archive: {
      title: "Writing, Videos, and Process",
      subtitle: "Essays, reflections, project records, videos, and references collected in one memory layer.",
      reading: "Reading Archive…",
      updateMemory: "Update Archive Memory",
      closeForm: "Close Form",
      newArchive: "New Archive",
      publicNotice: "Public Archive entries are visible here. Sign in to add or manage entries.",
      search: "Search Archive",
      searchPlaceholder: "Search title, text, or tags",
      archiveLabel: "archive",
      entry: "entry",
      entries: "entries",
      loading: "Loading Archive…",
      emptyTitle: "No Archive Entries",
      emptyMessage: "No entry matches the current filter.",
      previousArchive: "Previous Archive",
      legacyVideoTitle: "Legacy Video Archive",
      legacyVideoSubtitle: "Videos stored in the original video_archive table remain here until they are moved into the unified Archive."
    },
    daily: {
      loading: "Loading Daily…",
      editDaily: "Edit Daily",
      newDaily: "New Daily",
      cancelEdit: "Cancel Edit",
      weatherFor: "Weather for",
      collectingWeather: "Collecting weather for the selected date…",
      weatherError: "Weather could not be collected. Check your browser location permission.",
      tryAgain: "Try Again",
      high: "High",
      low: "Low",
      source: "Source",
      publicTitle: "Public Daily Records",
      publicSubtitle: "Public observations of body, environment, Body Moving, making, learning, and artistic practice.",
      signInPrompt: "Sign in to create or manage Daily entries.",
      exportJson: "Export Daily JSON",
      archiveTitle: "Daily Archive",
      record: "record",
      records: "records",
      loadingRecords: "Loading Daily records…",
      noEntries: "No public Daily entries yet."
    },
    common: {
      admin: "Admin",
      updated: "Updated",
      public: "Public",
      private: "Private",
      viewAll: "View All",
      viewMore: "View More",
      close: "Close",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      daily: "Daily",
      body: "Body",
      bodyPractice: "Body Practice",
      environment: "Environment",
      making: "Making",
      learning: "Learning",
      artisticInput: "Artistic Input",
      collection: "Collection",
      observation: "Observation",
      alignment: "Alignment",
      tomorrow: "Tomorrow",
      noBodyData: "No body data recorded.",
      noBodyPractice: "No body practice recorded.",
      noWeatherData: "Weather data was not collected.",
      noMakingRecord: "No Making record.",
      noLearningRecord: "No Learning record.",
      noArtisticInput: "No artistic input recorded.",
      noCollectedMedia: "No collected media.",
      noTomorrow: "Nothing recorded for tomorrow.",
      noPreviewText: "No preview text.",
      watch: "Watch",
      openVideo: "Open video",
      openExternalLink: "Open external link",
      video: "Video",
      archiveEntry: "Archive Entry",
      archiveTitle: "Archive title",
      date: "Date",
      title: "Title",
      type: "Type",
      bodyLabel: "Body",
      descriptionOrTranscript: "Description or Transcript",
      url: "URL",
      tags: "Tags",
      publicArchive: "Public Archive",
      publicArchiveHelp: "Public entries can be shown on the Archive page. Private entries remain visible only to the signed-in owner.",
      saveDaily: "Save Daily",
      saving: "Saving…",
      updateArchive: "Update Archive",
      saveArchive: "Save Archive",
      newArchive: "New Archive",
      editArchive: "Edit Archive",
      bodyState: "Body State",
      breathingState: "Breathing State",
      energy: "Energy",
      mood: "Mood",
      weight: "Weight",
      bodyTemperature: "Body Temperature",
      bodyMoving: "Body Moving",
      bodyMovingNotes: "Body Moving Notes",
      bodyMovingType: "Type",
      bodyMovingTime: "Time",
      bodyMovingIntensity: "Intensity",
      practice: "Practice",
      makingNotes: "Making Notes",
      learningSubject: "Subject",
      referenceNote: "Reference Note",
      notes: "Notes",
      optional: "Optional",
      weather: "Weather",
      temperature: "Temperature",
      humidity: "Humidity",
      pressure: "Pressure",
      wind: "Wind",
      sunrise: "Sunrise",
      sunset: "Sunset",
      time: "Time",
      project: "Project",
      creator: "Creator",
      makePublic: "Make Public",
      makePrivate: "Make Private"
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
    home: {
      practiceRhythm: "실천 리듬",
      making: "만들기",
      learning: "배우기",
      bodyMoving: "몸 움직임",
      bodyWeather: "몸 날씨",
      energyTone: "에너지 톤",
      currentMode: "현재 모드",
      today: "오늘",
      softSuggestion: "부드러운 제안",
      loadingSuggestion: "제안을 불러오는 중…",
      noSuggestion: "다음 제안은 밤 업데이트 후에 나타납니다.",
      input: "입력",
      latestArchive: "최근 아카이브",
      latestDaily: "최근 일일 기록",
      viewAll: "모두 보기",
      noArchiveEntries: "아직 공개된 아카이브 항목이 없습니다.",
      noDailyRecords: "아직 공개된 일일 기록이 없습니다.",
      thisWeek: "이번 주"
    },
    input: {
      title: "입력",
      heading: "시스템으로 들어오는 기록",
      subtitle: "아카이브는 더 긴 생각과 미디어를 담습니다. 일일 기록은 몸, 환경, 예술적 실천의 변화를 기록합니다.",
      loading: "최근 입력 기록을 불러오는 중…",
      archive: "아카이브",
      latestArchive: "최근 아카이브",
      latestDaily: "최근 일일 기록",
      viewAll: "모두 보기",
      noArchiveEntries: "아직 공개된 아카이브 항목이 없습니다.",
      noDailyRecords: "아직 공개된 일일 기록이 없습니다.",
      loadError: "최근 입력 기록을 불러오지 못했습니다."
    },
    process: {
      title: "과정",
      heading: "기록이 패턴과 관계로 자라납니다",
      subtitle: "입력에서 생성된 누적 리듬, 숫자 데이터, 시스템 읽기, 의미 연결입니다.",
      loading: "과정을 불러오는 중…",
      loadError: "과정 데이터를 불러오지 못했습니다.",
      stats: "통계",
      accumulatedRhythms: "누적된 리듬",
      openStats: "통계 열기",
      making: "만들기",
      learning: "배우기",
      moving: "움직임",
      bodyWeather: "몸 날씨",
      mindWeather: "마음 날씨",
      energyTone: "에너지 톤",
      data: "데이터",
      numericData: "숫자 데이터",
      openData: "데이터 열기",
      dataSubtitle: "매핑과 외부 시스템을 위한 몸, 몸 움직임, 만들기, 배우기, 날씨의 숫자 데이터입니다.",
      exportCsv: "CSV 내보내기",
      exportJson: "JSON 내보내기",
      mappingFields: "매핑 필드",
      publicRecords: "{count}개의 공개 기록이 있습니다.",
      system: "시스템",
      currentSystemReading: "현재 시스템 읽기",
      viewFull: "전체 보기",
      currentMode: "현재 모드",
      overview: "개요",
      openQuestion: "열린 질문",
      noSystemReading: "아직 공개된 시스템 읽기가 없습니다.",
      weave: "위브",
      latestSemanticSnapshot: "최근 의미 스냅샷",
      viewWeave: "위브 보기",
      records: "기록",
      connections: "연결",
      threshold: "임계값",
      noWeaveSnapshot: "아직 공개된 위브 스냅샷이 없습니다.",
      preview: "미리보기",
      loadingData: "숫자 데이터를 불러오는 중…",
      totalPublic: "공개된 총계",
      periodReading: "기간 읽기",
      periodReadingSubtitle: "최근 몸, 환경, 실천, 예술적 입력, 창작 사이의 관계를 밤마다 읽어냅니다.",
      generatedAutomatically: "매일 밤 자동으로 생성됩니다.",
      loadingSystemReading: "최신 시스템 읽기를 불러오는 중…",
      noSystemReadingYet: "아직 시스템 읽기가 없습니다",
      noSystemReadingText: "첫 읽기는 밤 업데이트 이후에 나타납니다.",
      recurringSignals: "반복되는 신호",
      noRecurringSignals: "반복되는 신호가 확인되지 않았습니다.",
      shifts: "변화",
      noShifts: "명확한 변화가 확인되지 않았습니다.",
      relationships: "관계",
      noRelationships: "근거 있는 관계가 확인되지 않았습니다.",
      exportLatestReading: "최신 읽기 내보내기",
      semanticConnections: "의미 연결",
      weaveSubtitle: "일일 기록은 의미, 분위기, 예술적 입력, 몸의 신호, 반복되는 관심사로 연결됩니다.",
      loadingWeave: "최신 위브를 불러오는 중…",
      noWeaveSnapshotYet: "아직 위브 스냅샷이 없습니다",
      noWeaveSnapshotText: "첫 의미 네트워크는 밤 업데이트 이후에 나타납니다.",
      strongestConnections: "가장 강한 연결",
      noConnections: "현재 유사도 임계값에 도달한 연결이 없습니다.",
      firstRecord: "첫 기록",
      secondRecord: "두 번째 기록",
      artisticInput: "예술적 입력",
      unresolved: "미해결"
    },
    archive: {
      title: "글쓰기, 비디오, 그리고 과정",
      subtitle: "에세이, 성찰, 프로젝트 기록, 비디오, 참고 자료를 하나의 기억 층위에 모아 둡니다.",
      reading: "아카이브 읽는 중…",
      updateMemory: "아카이브 메모리 갱신",
      closeForm: "폼 닫기",
      newArchive: "새 아카이브",
      publicNotice: "공개 아카이브 항목은 여기에서 보입니다. 로그인해 항목을 추가하거나 관리하세요.",
      search: "아카이브 검색",
      searchPlaceholder: "제목, 텍스트, 태그 검색",
      archiveLabel: "아카이브",
      entry: "항목",
      entries: "항목",
      loading: "아카이브 불러오는 중…",
      emptyTitle: "아카이브 항목 없음",
      emptyMessage: "현재 필터와 일치하는 항목이 없습니다.",
      previousArchive: "이전 아카이브",
      legacyVideoTitle: "레거시 비디오 아카이브",
      legacyVideoSubtitle: "원래 video_archive 테이블에 저장된 비디오는 통합 아카이브로 옮겨질 때까지 여기에 남습니다."
    },
    daily: {
      loading: "일일 기록 불러오는 중…",
      editDaily: "일일 기록 수정",
      newDaily: "새 일일 기록",
      cancelEdit: "수정 취소",
      weatherFor: "날씨 기록 날짜",
      collectingWeather: "선택한 날짜의 날씨를 수집하는 중…",
      weatherError: "날씨를 수집하지 못했습니다. 브라우저 위치 권한을 확인하세요.",
      tryAgain: "다시 시도",
      high: "최고",
      low: "최저",
      source: "출처",
      publicTitle: "공개 일일 기록",
      publicSubtitle: "몸, 환경, 몸 움직임, 만들기, 배우기, 예술적 실천에 대한 공개 관찰입니다.",
      signInPrompt: "로그인해 일일 기록을 만들거나 관리하세요.",
      exportJson: "일일 JSON 내보내기",
      archiveTitle: "일일 아카이브",
      record: "기록",
      records: "기록",
      loadingRecords: "일일 기록을 불러오는 중…",
      noEntries: "아직 공개된 일일 기록이 없습니다."
    },
    common: {
      admin: "관리자",
      updated: "업데이트됨",
      public: "공개",
      private: "비공개",
      viewAll: "모두 보기",
      viewMore: "더 보기",
      close: "닫기",
      edit: "편집",
      delete: "삭제",
      cancel: "취소",
      daily: "일일",
      body: "몸",
      bodyPractice: "몸 연습",
      environment: "환경",
      making: "만들기",
      learning: "배우기",
      artisticInput: "예술적 입력",
      collection: "수집",
      observation: "관찰",
      alignment: "정렬",
      tomorrow: "내일",
      noBodyData: "기록된 몸 데이터가 없습니다.",
      noBodyPractice: "기록된 몸 연습이 없습니다.",
      noWeatherData: "날씨 데이터가 수집되지 않았습니다.",
      noMakingRecord: "기록된 만들기 항목이 없습니다.",
      noLearningRecord: "기록된 배우기 항목이 없습니다.",
      noArtisticInput: "기록된 예술적 입력이 없습니다.",
      noCollectedMedia: "수집된 미디어가 없습니다.",
      noTomorrow: "내일에 대한 기록이 없습니다.",
      noPreviewText: "미리보기 텍스트가 없습니다.",
      watch: "보기",
      openVideo: "비디오 열기",
      openExternalLink: "외부 링크 열기",
      video: "비디오",
      archiveEntry: "아카이브 항목",
      archiveTitle: "아카이브 제목",
      date: "날짜",
      title: "제목",
      type: "유형",
      bodyLabel: "본문",
      descriptionOrTranscript: "설명 또는 대본",
      url: "URL",
      tags: "태그",
      publicArchive: "공개 아카이브",
      publicArchiveHelp: "공개 항목은 아카이브 페이지에 표시될 수 있습니다. 비공개 항목은 로그인한 소유자만 볼 수 있습니다.",
      saveDaily: "일일 기록 저장",
      saving: "저장 중…",
      updateArchive: "아카이브 수정",
      saveArchive: "아카이브 저장",
      newArchive: "새 아카이브",
      editArchive: "아카이브 편집",
      bodyState: "몸 상태",
      breathingState: "호흡 상태",
      energy: "에너지",
      mood: "기분",
      weight: "체중",
      bodyTemperature: "체온",
      bodyMoving: "몸 움직임",
      bodyMovingNotes: "몸 움직임 메모",
      bodyMovingType: "유형",
      bodyMovingTime: "시간",
      bodyMovingIntensity: "강도",
      practice: "실천",
      makingNotes: "만들기 메모",
      learningSubject: "주제",
      referenceNote: "참고 메모",
      notes: "메모",
      optional: "선택 사항",
      weather: "날씨",
      temperature: "온도",
      humidity: "습도",
      pressure: "기압",
      wind: "바람",
      sunrise: "일출",
      sunset: "일몰",
      time: "시간",
      project: "프로젝트",
      creator: "창작자",
      makePublic: "공개로 전환",
      makePrivate: "비공개로 전환"
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
    home: {
      practiceRhythm: "実践のリズム",
      making: "制作",
      learning: "学習",
      bodyMoving: "身体運動",
      bodyWeather: "身体の天候",
      energyTone: "エネルギートーン",
      currentMode: "現在のモード",
      today: "今日",
      softSuggestion: "ソフトな提案",
      loadingSuggestion: "提案を読み込んでいます…",
      noSuggestion: "次の提案は夜の更新後に表示されます。",
      input: "入力",
      latestArchive: "最新のアーカイブ",
      latestDaily: "最新の日記",
      viewAll: "すべて表示",
      noArchiveEntries: "まだ公開されたアーカイブ項目はありません。",
      noDailyRecords: "まだ公開された日記はありません。",
      thisWeek: "今週"
    },
    input: {
      title: "入力",
      heading: "システムに入る記録",
      subtitle: "アーカイブには長い思考やメディアが保存されます。日記は身体、環境、芸術的実践の変化を記録します。",
      loading: "最新の入力を読み込んでいます…",
      archive: "アーカイブ",
      latestArchive: "最新のアーカイブ",
      latestDaily: "最新の日記",
      viewAll: "すべて表示",
      noArchiveEntries: "まだ公開されたアーカイブ項目はありません。",
      noDailyRecords: "まだ公開された日記はありません。",
      loadError: "最新の入力記録を読み込めませんでした。"
    },
    process: {
      title: "プロセス",
      heading: "記録がパターンと関係性へと変わります",
      subtitle: "入力から生成された累積リズム、数値データ、システム読み、意味的なつながりです。",
      loading: "プロセスを読み込んでいます…",
      loadError: "プロセスデータを読み込めませんでした。",
      stats: "統計",
      accumulatedRhythms: "累積されたリズム",
      openStats: "統計を開く",
      making: "制作",
      learning: "学習",
      moving: "運動",
      bodyWeather: "身体の天候",
      mindWeather: "心の天候",
      energyTone: "エネルギートーン",
      data: "データ",
      numericData: "数値データ",
      openData: "データを開く",
      dataSubtitle: "マッピングや外部システムのための身体、身体運動、制作、学習、天候の数値データです。",
      exportCsv: "CSV をエクスポート",
      exportJson: "JSON をエクスポート",
      mappingFields: "マッピングフィールド",
      publicRecords: "{count}件の公開記録があります。",
      system: "システム",
      currentSystemReading: "現在のシステム読み",
      viewFull: "全文を見る",
      currentMode: "現在のモード",
      overview: "概要",
      openQuestion: "未解決の問い",
      noSystemReading: "まだ公開されたシステム読みはありません。",
      weave: "ウェーブ",
      latestSemanticSnapshot: "最新の意味スナップショット",
      viewWeave: "ウェーブを見る",
      records: "記録",
      connections: "つながり",
      threshold: "閾値",
      noWeaveSnapshot: "まだ公開されたウェーブスナップショットはありません。",
      preview: "プレビュー",
      loadingData: "数値データを読み込んでいます…",
      totalPublic: "公開件数",
      periodReading: "期間読み",
      periodReadingSubtitle: "最近の身体、環境、実践、芸術的入力、創作の関係を夜ごとに読みます。",
      generatedAutomatically: "毎晩自動的に生成されます。",
      loadingSystemReading: "最新のシステム読みを読み込んでいます…",
      noSystemReadingYet: "まだシステム読みはありません",
      noSystemReadingText: "最初の読みは夜の更新後に表示されます。",
      recurringSignals: "反復するシグナル",
      noRecurringSignals: "反復するシグナルは確認されませんでした。",
      shifts: "変化",
      noShifts: "明確な変化は確認されませんでした。",
      relationships: "関係性",
      noRelationships: "根拠のある関係性は確認されませんでした。",
      exportLatestReading: "最新の読みをエクスポート",
      semanticConnections: "意味的なつながり",
      weaveSubtitle: "日々の記録は意味、雰囲気、芸術的入力、身体のシグナル、反復する関心によってつながっています。",
      loadingWeave: "最新のウェーブを読み込んでいます…",
      noWeaveSnapshotYet: "まだウェーブスナップショットはありません",
      noWeaveSnapshotText: "最初の意味ネットワークは夜の更新後に表示されます。",
      strongestConnections: "最も強いつながり",
      noConnections: "現在の類似度しきい値に達するつながりはありません。",
      firstRecord: "最初の記録",
      secondRecord: "2番目の記録",
      artisticInput: "芸術的入力",
      unresolved: "未解決"
    },
    archive: {
      title: "文章、動画、そしてプロセス",
      subtitle: "エッセイ、反省、プロジェクト記録、動画、参考資料を一つの記憶の層にまとめます。",
      reading: "アーカイブを読み込んでいます…",
      updateMemory: "アーカイブメモリを更新",
      closeForm: "フォームを閉じる",
      newArchive: "新しいアーカイブ",
      publicNotice: "公開アーカイブ項目はここで表示されます。ログインして追加または管理してください。",
      search: "アーカイブを検索",
      searchPlaceholder: "タイトル、本文、タグを検索",
      archiveLabel: "アーカイブ",
      entry: "項目",
      entries: "項目",
      loading: "アーカイブを読み込んでいます…",
      emptyTitle: "アーカイブ項目がありません",
      emptyMessage: "現在のフィルターに一致する項目はありません。",
      previousArchive: "以前のアーカイブ",
      legacyVideoTitle: "レガシー動画アーカイブ",
      legacyVideoSubtitle: "元の video_archive テーブルに保存されていた動画は、統合アーカイブに移されるまでここに残ります。"
    },
    daily: {
      loading: "日記を読み込んでいます…",
      editDaily: "日記を編集",
      newDaily: "新しい日記",
      cancelEdit: "編集をキャンセル",
      weatherFor: "天気の記録日",
      collectingWeather: "選択した日付の天気を収集しています…",
      weatherError: "天気を収集できませんでした。ブラウザの位置情報の許可を確認してください。",
      tryAgain: "もう一度試す",
      high: "高い",
      low: "低い",
      source: "出典",
      publicTitle: "公開日記",
      publicSubtitle: "身体、環境、身体運動、制作、学習、芸術的実践に関する公開観察です。",
      signInPrompt: "ログインして日記を作成または管理してください。",
      exportJson: "日記 JSON をエクスポート",
      archiveTitle: "日記アーカイブ",
      record: "件",
      records: "件",
      loadingRecords: "日記を読み込んでいます…",
      noEntries: "まだ公開された日記はありません。"
    },
    common: {
      admin: "管理者",
      updated: "更新済み",
      public: "公開",
      private: "非公開",
      viewAll: "すべて表示",
      viewMore: "もっと見る",
      close: "閉じる",
      edit: "編集",
      delete: "削除",
      cancel: "キャンセル",
      daily: "日記",
      body: "身体",
      bodyPractice: "身体実践",
      environment: "環境",
      making: "制作",
      learning: "学習",
      artisticInput: "芸術的入力",
      collection: "収集",
      observation: "観察",
      alignment: "整合",
      tomorrow: "明日",
      noBodyData: "記録された身体データはありません。",
      noBodyPractice: "記録された身体実践はありません。",
      noWeatherData: "天気データは収集されませんでした。",
      noMakingRecord: "記録された制作はありません。",
      noLearningRecord: "記録された学習はありません。",
      noArtisticInput: "記録された芸術的入力はありません。",
      noCollectedMedia: "収集されたメディアはありません。",
      noTomorrow: "明日の記録はありません。",
      noPreviewText: "プレビューテキストがありません。",
      watch: "見る",
      openVideo: "動画を開く",
      openExternalLink: "外部リンクを開く",
      video: "動画",
      archiveEntry: "アーカイブ項目",
      archiveTitle: "アーカイブタイトル",
      date: "日付",
      title: "タイトル",
      type: "種類",
      bodyLabel: "本文",
      descriptionOrTranscript: "説明または書き起こし",
      url: "URL",
      tags: "タグ",
      publicArchive: "公開アーカイブ",
      publicArchiveHelp: "公開項目はアーカイブページに表示されることがあります。非公開項目はログインした所有者のみが閲覧できます。",
      saveDaily: "日記を保存",
      saving: "保存中…",
      updateArchive: "アーカイブを更新",
      saveArchive: "アーカイブを保存",
      newArchive: "新しいアーカイブ",
      editArchive: "アーカイブを編集",
      bodyState: "身体状態",
      breathingState: "呼吸状態",
      energy: "エネルギー",
      mood: "気分",
      weight: "体重",
      bodyTemperature: "体温",
      bodyMoving: "身体運動",
      bodyMovingNotes: "身体運動メモ",
      bodyMovingType: "種類",
      bodyMovingTime: "時間",
      bodyMovingIntensity: "強度",
      practice: "実践",
      makingNotes: "制作メモ",
      learningSubject: "テーマ",
      referenceNote: "参考メモ",
      notes: "メモ",
      optional: "任意",
      weather: "天気",
      temperature: "温度",
      humidity: "湿度",
      pressure: "気圧",
      wind: "風",
      sunrise: "日の出",
      sunset: "日の入り",
      time: "時間",
      project: "プロジェクト",
      creator: "作成者",
      makePublic: "公開する",
      makePrivate: "非公開にする"
    }
  }
};

function normalizeLocaleValue(value) {
  if (!value) {
    return null;
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

  return null;
}

function getBrowserLocale(preferredLanguages = []) {
  if (typeof navigator === "undefined") {
    return null;
  }

  const candidates = [];

  if (Array.isArray(preferredLanguages) && preferredLanguages.length) {
    candidates.push(...preferredLanguages);
  }

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

  return null;
}

function getLocaleFromCountry(country) {
  if (!country) {
    return null;
  }

  const normalizedCountry = country.toUpperCase();

  if (normalizedCountry === "KR") {
    return "ko";
  }

  if (normalizedCountry === "JP") {
    return "ja";
  }

  return "en";
}

function getStoredLocale() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem("softsystems_locale");
    if (!stored) {
      return null;
    }

    const normalized = normalizeLocaleValue(stored);
    return SUPPORTED_LOCALES.includes(normalized) ? normalized : null;
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

export function getInitialLocale({ browserLanguages = null, country = null } = {}) {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = getStoredLocale();
  if (stored) {
    return stored;
  }

  const browserLocale = getBrowserLocale(browserLanguages ?? []);
  if (browserLocale) {
    return browserLocale;
  }

  return getLocaleFromCountry(country) || "en";
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
  return normalizeLocaleValue(value) || "en";
}

export function setLocalePreference(locale) {
  const normalized = normalizeLocale(locale);
  setStoredLocale(normalized);
  return normalized;
}

export function getLocaleFromStorage() {
  return getStoredLocale();
}

export function getBrowserLocaleValue(preferredLanguages = []) {
  return getBrowserLocale(preferredLanguages);
}

export function getLocaleFromCountryCode(country) {
  return getLocaleFromCountry(country);
}
