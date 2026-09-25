/* JELLY LAND 다국어 (한국어 / English / 日本語) */
(function () {
  const D = {
    ko: {
      subtitle: "♪ 피아니스트 조젤리의 프로필 월드 ♪",
      enter: "🍬 입장하기", login: "로그인", signup: "회원가입",
      email: "이메일", emailId: "이메일 (로그인 아이디)", password: "비밀번호", password6: "비밀번호 (6자 이상)", password2: "비밀번호 확인",
      loginGo: "로그인하고 입장 ▶", signupGo: "회원가입 ✦", language: "사용 언어",
      authHint: "가입한 이메일이 로그인 아이디가 돼요.<br>다음 단계에서 나만의 캐릭터를 만들어요!",
      welcomeBack: "{name} 님, 다시 오셨네요!", enterWorld: "JELLY LAND 입장 ▶", switchAcc: "다른 계정으로 로그인",
      pwMismatch: "비밀번호가 서로 달라요.", signedUp: "🎉 가입 완료! 캐릭터를 만들어볼까요?",
      creatorTitle: "✂ 나만의 캐릭터 만들기", random: "🎲 랜덤", nickname: "닉네임", nickPh: "광장에서 보일 이름 (최대 12자)",
      gender: "성별", female: "여자", male: "남자", hair: "헤어 스타일", hairColor: "헤어 컬러", eyeColor: "눈 색", eyes: ["블루", "브라운", "퍼플", "그린", "루비"], skin: "피부색", outfit: "옷",
      cancel: "취소", enterBang: "JELLY LAND 입장! ▶", save: "저장하기 ✓", needNick: "닉네임을 입력해주세요!", saved: "✨ 저장했어요!",
      edit: "👕 꾸미기", help: "❔ 도움말", logout: "로그아웃", langBtn: "🌐 언어",
      mapPlaza: "광장 지도", mapLounge: "팬 라운지", online: "🟢 접속 중 {n}명", onlineShort: "🟢 접속 중", demoSolo: "데모 모드 (혼자 플레이)",
      chatPlaza: "💬 광장 채팅", chatLounge: "💬 팬 라운지 채팅", chatPh: "메시지 입력", send: "보내기", noticeOpt: "공지로 등록 (아티스트 전용)",
      noticeLabel: "조젤리 공지", noticeDone: "📢 공지가 등록됐어요", translated: "번역됨 · 원문", del: "삭제",
      welcome: "🍬 {name}님, JELLY LAND에 오신 걸 환영해요!", enteredLounge: "💬 팬 라운지에 입장했어요!",
      artistHello: "JELLY LAND에 온 걸 환영해요! ♪",
      bGallery: "포토 갤러리", bAlbums: "앨범 기록관", bCinema: "젤리 시네마", bLounge: "팬 라운지",
      zProfile: "조젤리 프로필", zGuide: "안내 게시판", zExit: "광장으로 나가기",
      actEnter: "들어가기", actView: "보기",
      npc: ["젤리 주민", "건반 요정", "음표 수집가"],
      loungeScreen: "팬 라운지에 오신 걸 환영해요",
      galleryIntro: "📷 조젤리의 순간들을 모아둔 갤러리예요. 사진을 누르면 크게 볼 수 있어요.", back: "◀ 목록으로",
      albumsIntro: "💿 조젤리의 발매 이력이에요.", listen: "▶ 듣기", albRelease: "발매일", albGenre: "장르", albLabel: "발매사", albAgency: "기획사", albCredits: "크레딧", albTracks: "수록곡", albAbout: "앨범 소개", noVideo: "등록된 영상이 없어요.", ytChannel: "YouTube 채널 가기 ↗",
      gGallery: "📷 갤러리", gAlbums: "💿 앨범", gVideo: "🎬 영상",
      guideTitle: "❔ JELLY LAND 안내",
      guide: [
        "<b>이동</b> — 방향키 / WASD, 또는 바닥을 클릭(탭)하면 그곳으로 걸어가요. 모바일은 왼쪽 아래 조이스틱!",
        "<b>입장·보기</b> — 건물 문 앞에서 <b>E</b> 또는 <b>스페이스</b> (모바일은 <b>A</b> 버튼). 건물을 눌러도 자동으로 걸어가 들어가요.",
        "💬 <b>채팅</b> — 광장과 팬 라운지에서 같은 장소에 있는 사람들과 채팅할 수 있어요. 다른 언어로 쓴 메시지는 내 언어로 자동 번역돼요.",
        "📷 <b>포토 갤러리</b> · 💿 <b>앨범 기록관</b> · 🎬 <b>젤리 시네마</b> · 💬 <b>팬 라운지</b>",
        "🎹 <b>중앙 무대</b> — 조젤리를 누르면 프로필을 볼 수 있어요.",
        "🗺 오른쪽 위 지도를 누르면 크게 볼 수 있어요. 🌐 버튼으로 언어를 바꿀 수 있어요.",
      ],
      langTitle: "🌐 언어 설정", langChanged: "🌐 언어를 바꿨어요",
      hairs: ["웨이브 트윈테일", "롱 웨이브", "단발", "숏컷", "포니테일", "삐죽머리"],
      skins: ["밀키", "피치", "허니", "캐러멜", "코코아"],
      hairColors: ["블랙", "브라운", "캐러멜", "블론드", "딸기", "포도", "민트", "실버"],
      outfits: ["마법소녀", "곰돌이 후디 (Can't Stop!)", "피아노 턱시도", "세일러", "민트 원피스", "블랙 재킷", "딸기 오버롤"],
      e_email: "올바른 이메일 주소를 입력해주세요.", e_pw6: "비밀번호는 6자 이상이어야 해요.", e_exists: "이미 가입된 이메일이에요. 로그인해주세요.", e_login: "이메일 또는 비밀번호가 올바르지 않아요.", e_auth: "로그인이 필요해요.", e_nick: "닉네임을 입력해주세요.", e_notice: "공지는 조젤리만 작성할 수 있어요.", e_forbidden: "권한이 없어요.", e_msg: "메시지를 입력해주세요.", e_server: "서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.", e_net: "인터넷 연결을 확인해주세요.",
      close: "닫기", err: "요청에 실패했어요.",
    },
    en: {
      subtitle: "♪ Pianist Jo Jelly's Profile World ♪",
      enter: "🍬 Enter", login: "Log in", signup: "Sign up",
      email: "Email", emailId: "Email (your login ID)", password: "Password", password6: "Password (6+ characters)", password2: "Confirm password",
      loginGo: "Log in & Enter ▶", signupGo: "Sign up ✦", language: "Language",
      authHint: "Your email becomes your login ID.<br>Next, you'll create your own character!",
      welcomeBack: "Welcome back, {name}!", enterWorld: "Enter JELLY LAND ▶", switchAcc: "Log in with another account",
      pwMismatch: "Passwords don't match.", signedUp: "🎉 Signed up! Let's make your character.",
      creatorTitle: "✂ Create Your Character", random: "🎲 Random", nickname: "Nickname", nickPh: "Name shown in the world (max 12)",
      gender: "Gender", female: "Female", male: "Male", hair: "Hair style", hairColor: "Hair color", eyeColor: "Eye color", eyes: ["Blue", "Brown", "Purple", "Green", "Ruby"], skin: "Skin tone", outfit: "Outfit",
      cancel: "Cancel", enterBang: "Enter JELLY LAND! ▶", save: "Save ✓", needNick: "Please enter a nickname!", saved: "✨ Saved!",
      edit: "👕 Style", help: "❔ Help", logout: "Log out", langBtn: "🌐 Lang",
      mapPlaza: "Plaza Map", mapLounge: "Fan Lounge", online: "🟢 {n} online", onlineShort: "🟢 Online", demoSolo: "Demo mode (solo)",
      chatPlaza: "💬 Plaza Chat", chatLounge: "💬 Fan Lounge Chat", chatPh: "Type a message", send: "Send", noticeOpt: "Post as notice (artist only)",
      noticeLabel: "Notice from Jo Jelly", noticeDone: "📢 Notice posted", translated: "Translated · original", del: "Delete",
      welcome: "🍬 Welcome to JELLY LAND, {name}!", enteredLounge: "💬 You entered the Fan Lounge!",
      artistHello: "Welcome to JELLY LAND! ♪",
      bGallery: "Photo Gallery", bAlbums: "Album Archive", bCinema: "Jelly Cinema", bLounge: "Fan Lounge",
      zProfile: "Jo Jelly's Profile", zGuide: "Info Board", zExit: "Back to the Plaza",
      actEnter: "Enter", actView: "View",
      npc: ["Jelly Villager", "Key Fairy", "Note Collector"],
      loungeScreen: "Welcome to the Fan Lounge",
      galleryIntro: "📷 A gallery of Jo Jelly's moments. Tap a photo to enlarge it.", back: "◀ Back",
      albumsIntro: "💿 Jo Jelly's discography.", listen: "▶ Listen", albRelease: "Released", albGenre: "Genre", albLabel: "Label", albAgency: "Agency", albCredits: "Credits", albTracks: "Tracklist", albAbout: "About", noVideo: "No videos yet.", ytChannel: "Visit YouTube channel ↗",
      gGallery: "📷 Gallery", gAlbums: "💿 Albums", gVideo: "🎬 Videos",
      guideTitle: "❔ JELLY LAND Guide",
      guide: [
        "<b>Move</b> — Arrow keys / WASD, or click (tap) the ground to walk there. On mobile, use the joystick at bottom-left!",
        "<b>Enter / View</b> — Press <b>E</b> or <b>Space</b> in front of a door (<b>A</b> button on mobile). Tapping a building walks you in automatically.",
        "💬 <b>Chat</b> — Talk with people in the same place (Plaza or Fan Lounge). Messages in other languages are auto-translated into yours.",
        "📷 <b>Photo Gallery</b> · 💿 <b>Album Archive</b> · 🎬 <b>Jelly Cinema</b> · 💬 <b>Fan Lounge</b>",
        "🎹 <b>Center Stage</b> — Tap Jo Jelly to see her profile.",
        "🗺 Tap the map (top-right) to enlarge it. Change language with the 🌐 button.",
      ],
      langTitle: "🌐 Language", langChanged: "🌐 Language changed",
      hairs: ["Wavy twin tails", "Long wavy", "Bob", "Short", "Ponytail", "Spiky"],
      skins: ["Milky", "Peach", "Honey", "Caramel", "Cocoa"],
      hairColors: ["Black", "Brown", "Caramel", "Blonde", "Strawberry", "Grape", "Mint", "Silver"],
      outfits: ["Magical Girl", "Bear Hoodie (Can't Stop!)", "Piano Tuxedo", "Sailor", "Mint Dress", "Black Jacket", "Berry Overalls"],
      e_email: "Please enter a valid email address.", e_pw6: "Password must be at least 6 characters.", e_exists: "This email is already registered. Please log in.", e_login: "Incorrect email or password.", e_auth: "Please log in.", e_nick: "Please enter a nickname.", e_notice: "Only Jo Jelly can post notices.", e_forbidden: "Not allowed.", e_msg: "Please enter a message.", e_server: "Server error. Please try again shortly.", e_net: "Please check your internet connection.",
      close: "Close", err: "Request failed.",
    },
    ja: {
      subtitle: "♪ ピアニスト Jo Jelly のプロフィールワールド ♪",
      enter: "🍬 入場する", login: "ログイン", signup: "新規登録",
      email: "メールアドレス", emailId: "メールアドレス（ログインID）", password: "パスワード", password6: "パスワード（6文字以上）", password2: "パスワード（確認）",
      loginGo: "ログインして入場 ▶", signupGo: "新規登録 ✦", language: "使用言語",
      authHint: "登録したメールアドレスがログインIDになります。<br>次はあなただけのキャラクターを作りましょう！",
      welcomeBack: "{name}さん、おかえりなさい！", enterWorld: "JELLY LAND に入場 ▶", switchAcc: "別のアカウントでログイン",
      pwMismatch: "パスワードが一致しません。", signedUp: "🎉 登録完了！キャラクターを作りましょう",
      creatorTitle: "✂ キャラクターを作る", random: "🎲 ランダム", nickname: "ニックネーム", nickPh: "ワールドで表示される名前（12文字まで）",
      gender: "性別", female: "女の子", male: "男の子", hair: "ヘアスタイル", hairColor: "ヘアカラー", eyeColor: "目の色", eyes: ["ブルー", "ブラウン", "パープル", "グリーン", "ルビー"], skin: "肌の色", outfit: "服",
      cancel: "キャンセル", enterBang: "JELLY LAND に入場！ ▶", save: "保存する ✓", needNick: "ニックネームを入力してください！", saved: "✨ 保存しました！",
      edit: "👕 着せ替え", help: "❔ ヘルプ", logout: "ログアウト", langBtn: "🌐 言語",
      mapPlaza: "広場マップ", mapLounge: "ファンラウンジ", online: "🟢 {n}人がオンライン", onlineShort: "🟢 オンライン", demoSolo: "デモモード（ひとりプレイ）",
      chatPlaza: "💬 広場チャット", chatLounge: "💬 ファンラウンジチャット", chatPh: "メッセージを入力", send: "送信", noticeOpt: "お知らせとして投稿（アーティスト専用）",
      noticeLabel: "Jo Jelly からのお知らせ", noticeDone: "📢 お知らせを投稿しました", translated: "翻訳済み · 原文", del: "削除",
      welcome: "🍬 {name}さん、JELLY LAND へようこそ！", enteredLounge: "💬 ファンラウンジに入りました！",
      artistHello: "JELLY LAND へようこそ！ ♪",
      bGallery: "フォトギャラリー", bAlbums: "アルバム資料館", bCinema: "ゼリーシネマ", bLounge: "ファンラウンジ",
      zProfile: "Jo Jelly プロフィール", zGuide: "案内掲示板", zExit: "広場に戻る",
      actEnter: "入る", actView: "見る",
      npc: ["ゼリー住民", "鍵盤の妖精", "音符コレクター"],
      loungeScreen: "ファンラウンジへようこそ",
      galleryIntro: "📷 Jo Jelly の瞬間を集めたギャラリーです。写真をタップすると拡大できます。", back: "◀ 一覧へ",
      albumsIntro: "💿 Jo Jelly のリリース履歴です。", listen: "▶ 聴く", albRelease: "発売日", albGenre: "ジャンル", albLabel: "発売元", albAgency: "事務所", albCredits: "クレジット", albTracks: "収録曲", albAbout: "アルバム紹介", noVideo: "動画はまだありません。", ytChannel: "YouTube チャンネルへ ↗",
      gGallery: "📷 ギャラリー", gAlbums: "💿 アルバム", gVideo: "🎬 動画",
      guideTitle: "❔ JELLY LAND ガイド",
      guide: [
        "<b>移動</b> — 矢印キー / WASD、または地面をクリック（タップ）するとそこまで歩きます。スマホは左下のジョイスティック！",
        "<b>入場・閲覧</b> — ドアの前で <b>E</b> または <b>スペース</b>（スマホは <b>A</b> ボタン）。建物をタップすると自動で歩いて入ります。",
        "💬 <b>チャット</b> — 同じ場所（広場・ファンラウンジ）にいる人とチャットできます。他の言語のメッセージは自動で翻訳されます。",
        "📷 <b>フォトギャラリー</b> · 💿 <b>アルバム資料館</b> · 🎬 <b>ゼリーシネマ</b> · 💬 <b>ファンラウンジ</b>",
        "🎹 <b>中央ステージ</b> — Jo Jelly をタップするとプロフィールが見られます。",
        "🗺 右上のマップをタップすると拡大します。🌐 ボタンで言語を変更できます。",
      ],
      langTitle: "🌐 言語設定", langChanged: "🌐 言語を変更しました",
      hairs: ["ウェーブツインテール", "ロングウェーブ", "ボブ", "ショート", "ポニーテール", "ツンツン"],
      skins: ["ミルキー", "ピーチ", "ハニー", "キャラメル", "ココア"],
      hairColors: ["ブラック", "ブラウン", "キャラメル", "ブロンド", "いちご", "ぶどう", "ミント", "シルバー"],
      outfits: ["魔法少女", "くまパーカー (Can't Stop!)", "ピアノタキシード", "セーラー", "ミントワンピース", "ブラックジャケット", "いちごオーバーオール"],
      e_email: "正しいメールアドレスを入力してください。", e_pw6: "パスワードは6文字以上で入力してください。", e_exists: "このメールアドレスは登録済みです。ログインしてください。", e_login: "メールアドレスまたはパスワードが正しくありません。", e_auth: "ログインが必要です。", e_nick: "ニックネームを入力してください。", e_notice: "お知らせは Jo Jelly のみ投稿できます。", e_forbidden: "権限がありません。", e_msg: "メッセージを入力してください。", e_server: "サーバーエラーが発生しました。しばらくしてからもう一度お試しください。", e_net: "インターネット接続を確認してください。",
      close: "閉じる", err: "リクエストに失敗しました。",
    },
  };
  const LANGS = [{ code: "ko", label: "한국어" }, { code: "en", label: "English" }, { code: "ja", label: "日本語" }];
  const detect = () => { const n = (navigator.language || "ko").slice(0, 2); return D[n] ? n : "en"; };
  let lang = (() => { try { return localStorage.getItem("jl_lang") || detect(); } catch { return detect(); } })();
  if (!D[lang]) lang = "ko";

  function t(key, vars) {
    let s = D[lang][key] ?? D.ko[key] ?? key;
    if (vars && typeof s === "string") for (const k in vars) s = s.replace("{" + k + "}", vars[k]);
    return s;
  }
  // config 값이 {ko, en, ja} 객체이면 현재 언어를 고름
  function L(v) { return v && typeof v === "object" && !Array.isArray(v) ? v[lang] ?? v.ko ?? v.en ?? "" : v; }
  function apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => (el.innerHTML = t(el.dataset.i18n)));
    root.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    document.documentElement.lang = lang;
  }
  window.I18N = {
    LANGS, t, L, apply,
    get lang() { return lang; },
    set(l) { if (!D[l]) return; lang = l; try { localStorage.setItem("jl_lang", l); } catch {} apply(); },
  };
})();
