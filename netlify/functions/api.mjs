// JELLY LAND API — Netlify Functions (v2) + Netlify Blobs
// 경로: /api/*
//   POST /api/signup    {email, password, lang}
//   POST /api/login     {email, password}
//   GET  /api/me
//   POST /api/avatar    {nickname, avatar}
//   POST /api/settings  {lang}
//   POST /api/sync      {scene, x, y, dir, since}  ← 위치 + 새 채팅 + 공지를 한 번에 (빠르고 저렴)
//   GET  /api/chat?room=plaza|lounge&since=0
//   POST /api/chat      {room, text, notice?}   ← 보낼 때 한/영/일 3개 언어로 자동 번역해 저장
//   DELETE /api/chat?key=...        (아티스트 전용)
//   POST /api/daily                 ← 첫 접속 환영 100코인 + 하루 한 번 출석 100코인 (한국 시간 기준)
//   POST /api/shop/buy  {item}      ← 젤리젤리샵 구매
//   POST /api/game/start            ← 점프점프 젤리월드 시작
//   POST /api/game/finish {run, m}  ← 결과 제출 (100m 마다 5코인, 한 판 최대 200코인)
//   GET  /api/game/top              ← 점프점프 젤리월드 랭킹 TOP 10
//   POST /api/slot/spin             ← 🎰 럭키젤리! (참가비 20코인, 결과는 서버에서 확률로 결정)
//   GET  /api/rec?page · POST /api/rec {notes, title} · DELETE /api/rec?key  ← 🎹 "젤리에게 들려줘!" 피아노 녹음 게시판 (하루 3개, 10초)
//   GET  /api/mail  · POST /api/mail/read · DELETE /api/mail?ts=  ← 내 쪽지함
//   GET  /api/admin/users · POST /api/admin/mail {to, text} · POST /api/admin/delete {id} · POST /api/admin/rank {game,id,m,mode}  ← 관리자 전용 회원관리
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const store = (name) => getStore({ name, consistency: "strong" });
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
// code는 화면에서 사용자 언어로 바꿔 보여주기 위한 키
const err = (code, status = 400) => json({ error: code, code }, status);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LANGS = ["ko", "en", "ja"];
const ROOMS = ["plaza", "lounge"];
const CHAT_TTL = 5 * 60 * 1000; // 채팅은 5분 뒤 사라짐
const HOST_OUTFITS = [1, 7, 8, 9]; // 호스트(조젤리) 전용 의상 번호 — public/js/avatar.js 의 host: true 와 같아야 함
// ---- 젤리코인 ----
// 젤리젤리샵 상품 — public/js/shop.js 와 같아야 함 (가격은 10코인 단위)
const SHOP = {
  h_buns: { kind: "hair", idx: 6, price: 100 },
  w_candy: { kind: "wand", idx: 1, price: 200 },
  o_gingham: { kind: "outfit", idx: 10, price: 300 },
  h_heart: { kind: "hair", idx: 7, price: 500 },
  w_note: { kind: "wand", idx: 2, price: 800 },
  o_cherry: { kind: "outfit", idx: 11, price: 1200 },
  h_bigbow: { kind: "hair", idx: 8, price: 1800 },
  o_moon: { kind: "outfit", idx: 12, price: 2500 },
  w_rainbow: { kind: "wand", idx: 3, price: 3500 },
  o_idol: { kind: "outfit", idx: 13, price: 5000 },
  h_galaxy: { kind: "hair", idx: 9, price: 7000 },
  o_fairy: { kind: "outfit", idx: 14, price: 9000 },
  w_piano: { kind: "wand", idx: 4, price: 12000 },
  o_aurora: { kind: "outfit", idx: 15, price: 15000 },
  o_royal: { kind: "outfit", idx: 16, price: 30000 },
  // 말풍선 (호스트·관리자 말풍선은 역할로 자동 적용, 판매 안 함)
  b_yellow: { kind: "bubble", idx: 1, price: 700 },
  b_blue: { kind: "bubble", idx: 2, price: 700 },
  b_green: { kind: "bubble", idx: 3, price: 700 },
  b_dots: { kind: "bubble", idx: 4, price: 1000 },
  b_rainbow: { kind: "bubble", idx: 5, price: 1500 },
  b_star: { kind: "bubble", idx: 6, price: 2000 },
  b_gold: { kind: "bubble", idx: 7, price: 3000 },
};
// 🫧 분수대 보물상자 퀴즈 — [한국어, English, 日本語, [정답, 오답, 오답, 오답]] (보기는 문자열 하나면 3개 언어 공통, 아니면 [ko, en, ja])
// 정답은 항상 첫 번째 보기 — 서버가 섞어서 보냄 (정답은 브라우저로 보내지 않음)
const QUIZ = [
  ["노르웨이의 수도는?", "What is the capital of Norway?", "ノルウェーの首都は？", [["오슬로", "Oslo", "オスロ"], ["스톡홀름", "Stockholm", "ストックホルム"], ["코펜하겐", "Copenhagen", "コペンハーゲン"], ["헬싱키", "Helsinki", "ヘルシンキ"]]],
  ["테슬라 CEO 일론 머스크가 세운 우주항공 기업은?", "Which space company was founded by Tesla CEO Elon Musk?", "テスラCEOのイーロン・マスクが設立した宇宙企業は？", [["스페이스X", "SpaceX", "スペースX"], ["블루 오리진", "Blue Origin", "ブルーオリジン"], ["보잉", "Boeing", "ボーイング"], ["버진 갤럭틱", "Virgin Galactic", "ヴァージン・ギャラクティック"]]],
  ["일본의 수도는?", "What is the capital of Japan?", "日本の首都は？", [["도쿄", "Tokyo", "東京"], ["오사카", "Osaka", "大阪"], ["교토", "Kyoto", "京都"], ["나고야", "Nagoya", "名古屋"]]],
  ["호주의 수도는?", "What is the capital of Australia?", "オーストラリアの首都は？", [["캔버라", "Canberra", "キャンベラ"], ["시드니", "Sydney", "シドニー"], ["멜버른", "Melbourne", "メルボルン"], ["브리즈번", "Brisbane", "ブリスベン"]]],
  ["캐나다의 수도는?", "What is the capital of Canada?", "カナダの首都は？", [["오타와", "Ottawa", "オタワ"], ["토론토", "Toronto", "トロント"], ["밴쿠버", "Vancouver", "バンクーバー"], ["몬트리올", "Montreal", "モントリオール"]]],
  ["브라질의 수도는?", "What is the capital of Brazil?", "ブラジルの首都は？", [["브라질리아", "Brasília", "ブラジリア"], ["리우데자네이루", "Rio de Janeiro", "リオデジャネイロ"], ["상파울루", "São Paulo", "サンパウロ"], ["살바도르", "Salvador", "サルバドール"]]],
  ["튀르키예(터키)의 수도는?", "What is the capital of Türkiye (Turkey)?", "トルコの首都は？", [["앙카라", "Ankara", "アンカラ"], ["이스탄불", "Istanbul", "イスタンブール"], ["이즈미르", "Izmir", "イズミル"], ["안탈리아", "Antalya", "アンタルヤ"]]],
  ["스위스의 수도는?", "What is the capital of Switzerland?", "スイスの首都は？", [["베른", "Bern", "ベルン"], ["취리히", "Zurich", "チューリッヒ"], ["제네바", "Geneva", "ジュネーブ"], ["바젤", "Basel", "バーゼル"]]],
  ["이탈리아의 수도는?", "What is the capital of Italy?", "イタリアの首都は？", [["로마", "Rome", "ローマ"], ["밀라노", "Milan", "ミラノ"], ["베네치아", "Venice", "ヴェネツィア"], ["나폴리", "Naples", "ナポリ"]]],
  ["프랑스의 수도는?", "What is the capital of France?", "フランスの首都は？", [["파리", "Paris", "パリ"], ["리옹", "Lyon", "リヨン"], ["마르세유", "Marseille", "マルセイユ"], ["니스", "Nice", "ニース"]]],
  ["스페인의 수도는?", "What is the capital of Spain?", "スペインの首都は？", [["마드리드", "Madrid", "マドリード"], ["바르셀로나", "Barcelona", "バルセロナ"], ["세비야", "Seville", "セビリア"], ["발렌시아", "Valencia", "バレンシア"]]],
  ["독일의 수도는?", "What is the capital of Germany?", "ドイツの首都は？", [["베를린", "Berlin", "ベルリン"], ["뮌헨", "Munich", "ミュンヘン"], ["프랑크푸르트", "Frankfurt", "フランクフルト"], ["함부르크", "Hamburg", "ハンブルク"]]],
  ["미국의 수도는?", "What is the capital of the United States?", "アメリカの首都は？", [["워싱턴 D.C.", "Washington, D.C.", "ワシントンD.C."], ["뉴욕", "New York", "ニューヨーク"], ["로스앤젤레스", "Los Angeles", "ロサンゼルス"], ["시카고", "Chicago", "シカゴ"]]],
  ["대한민국의 수도는?", "What is the capital of South Korea?", "韓国の首都は？", [["서울", "Seoul", "ソウル"], ["부산", "Busan", "釜山"], ["인천", "Incheon", "仁川"], ["대전", "Daejeon", "大田"]]],
  ["영국의 수도는?", "What is the capital of the United Kingdom?", "イギリスの首都は？", [["런던", "London", "ロンドン"], ["맨체스터", "Manchester", "マンチェスター"], ["리버풀", "Liverpool", "リバプール"], ["에든버러", "Edinburgh", "エディンバラ"]]],
  ["태양계에서 가장 큰 행성은?", "What is the largest planet in the Solar System?", "太陽系で一番大きい惑星は？", [["목성", "Jupiter", "木星"], ["토성", "Saturn", "土星"], ["지구", "Earth", "地球"], ["해왕성", "Neptune", "海王星"]]],
  ["태양에서 가장 가까운 행성은?", "Which planet is closest to the Sun?", "太陽に一番近い惑星は？", [["수성", "Mercury", "水星"], ["금성", "Venus", "金星"], ["화성", "Mars", "火星"], ["지구", "Earth", "地球"]]],
  ["'붉은 행성'이라고 불리는 행성은?", "Which planet is called the 'Red Planet'?", "「赤い惑星」と呼ばれる惑星は？", [["화성", "Mars", "火星"], ["금성", "Venus", "金星"], ["목성", "Jupiter", "木星"], ["수성", "Mercury", "水星"]]],
  ["크고 아름다운 고리로 유명한 행성은?", "Which planet is famous for its large, beautiful rings?", "大きく美しい環で有名な惑星は？", [["토성", "Saturn", "土星"], ["화성", "Mars", "火星"], ["수성", "Mercury", "水星"], ["금성", "Venus", "金星"]]],
  ["물의 화학식은?", "What is the chemical formula for water?", "水の化学式は？", ["H₂O", "CO₂", "O₂", "NaCl"]],
  ["1기압에서 물이 끓는 온도는?", "At what temperature does water boil at sea level (1 atm)?", "1気圧で水が沸騰する温度は？", ["100℃", "90℃", "80℃", "120℃"]],
  ["1기압에서 물이 어는 온도는?", "At what temperature does water freeze at 1 atm?", "1気圧で水が凍る温度は？", ["0℃", "4℃", "-10℃", "10℃"]],
  ["윤년이 아닌 해의 1년은 며칠일까요?", "How many days are in a non-leap year?", "うるう年ではない1年は何日？", ["365", "360", "366", "364"]],
  ["윤년의 2월은 며칠까지 있을까요?", "How many days does February have in a leap year?", "うるう年の2月は何日まで？", ["29", "28", "30", "31"]],
  ["거미의 다리는 몇 개일까요?", "How many legs does a spider have?", "クモの脚は何本？", ["8", "6", "10", "4"]],
  ["곤충의 다리는 몇 개일까요?", "How many legs does an insect have?", "昆虫の脚は何本？", ["6", "8", "4", "10"]],
  ["세계에서 가장 넓은 바다(대양)는?", "What is the largest ocean in the world?", "世界で一番広い海（大洋）は？", [["태평양", "Pacific Ocean", "太平洋"], ["대서양", "Atlantic Ocean", "大西洋"], ["인도양", "Indian Ocean", "インド洋"], ["북극해", "Arctic Ocean", "北極海"]]],
  ["세계에서 가장 높은 산은?", "What is the highest mountain in the world?", "世界で一番高い山は？", [["에베레스트산", "Mount Everest", "エベレスト"], ["K2", "K2", "K2"], ["킬리만자로산", "Mount Kilimanjaro", "キリマンジャロ"], ["몽블랑", "Mont Blanc", "モンブラン"]]],
  ["세계에서 면적이 가장 넓은 나라는?", "Which country has the largest land area?", "世界で面積が一番広い国は？", [["러시아", "Russia", "ロシア"], ["캐나다", "Canada", "カナダ"], ["중국", "China", "中国"], ["미국", "United States", "アメリカ"]]],
  ["'모나리자'를 그린 화가는?", "Who painted the 'Mona Lisa'?", "「モナ・リザ」を描いた画家は？", [["레오나르도 다빈치", "Leonardo da Vinci", "レオナルド・ダ・ヴィンチ"], ["미켈란젤로", "Michelangelo", "ミケランジェロ"], ["라파엘로", "Raphael", "ラファエロ"], ["피카소", "Picasso", "ピカソ"]]],
  ["'별이 빛나는 밤'을 그린 화가는?", "Who painted 'The Starry Night'?", "「星月夜」を描いた画家は？", [["빈센트 반 고흐", "Vincent van Gogh", "ゴッホ"], ["클로드 모네", "Claude Monet", "モネ"], ["폴 세잔", "Paul Cézanne", "セザンヌ"], ["폴 고갱", "Paul Gauguin", "ゴーギャン"]]],
  ["'운명 교향곡'(교향곡 5번)을 작곡한 사람은?", "Who composed the 'Fate' Symphony (Symphony No. 5)?", "「運命」（交響曲第5番）を作曲したのは？", [["베토벤", "Beethoven", "ベートーヴェン"], ["모차르트", "Mozart", "モーツァルト"], ["바흐", "Bach", "バッハ"], ["쇼팽", "Chopin", "ショパン"]]],
  ["'피아노의 시인'이라고 불리는 작곡가는?", "Which composer is called the 'Poet of the Piano'?", "「ピアノの詩人」と呼ばれる作曲家は？", [["쇼팽", "Chopin", "ショパン"], ["리스트", "Liszt", "リスト"], ["슈베르트", "Schubert", "シューベルト"], ["브람스", "Brahms", "ブラームス"]]],
  ["일반적인 그랜드 피아노의 건반 수는?", "How many keys does a standard piano have?", "一般的なピアノの鍵盤の数は？", ["88", "76", "61", "100"]],
  ["계이름 '솔' 바로 다음 음은?", "In solfège, which note comes right after 'Sol'?", "ドレミで「ソ」の次の音は？", [["라", "La", "ラ"], ["시", "Ti (Si)", "シ"], ["파", "Fa", "ファ"], ["도", "Do", "ド"]]],
  ["음악에서 '여리게'를 뜻하는 셈여림표는?", "Which dynamic marking means 'soft'?", "音楽で「弱く」を意味する記号は？", ["p", "f", "ff", "sfz"]],
  ["비발디가 작곡한 유명한 바이올린 협주곡 모음은?", "Which famous set of violin concertos did Vivaldi compose?", "ヴィヴァルディが作曲した有名なヴァイオリン協奏曲集は？", [["사계", "The Four Seasons", "四季"], ["합창", "Choral", "合唱"], ["신세계로부터", "From the New World", "新世界より"], ["백조의 호수", "Swan Lake", "白鳥の湖"]]],
  ["'백조의 호수'를 작곡한 사람은?", "Who composed 'Swan Lake'?", "「白鳥の湖」を作曲したのは？", [["차이콥스키", "Tchaikovsky", "チャイコフスキー"], ["드뷔시", "Debussy", "ドビュッシー"], ["비발디", "Vivaldi", "ヴィヴァルディ"], ["하이든", "Haydn", "ハイドン"]]],
  ["'반짝반짝 작은 별' 주제에 의한 12개의 변주곡을 작곡한 사람은?", "Who wrote 12 Variations on 'Twinkle, Twinkle, Little Star' (Ah vous dirai-je, Maman)?", "「きらきら星変奏曲」を作曲したのは？", [["모차르트", "Mozart", "モーツァルト"], ["베토벤", "Beethoven", "ベートーヴェン"], ["바흐", "Bach", "バッハ"], ["하이든", "Haydn", "ハイドン"]]],
  ["일반적인 기타의 줄은 몇 개일까요?", "How many strings does a standard guitar have?", "一般的なギターの弦は何本？", ["6", "4", "5", "12"]],
  ["바이올린의 줄은 몇 개일까요?", "How many strings does a violin have?", "ヴァイオリンの弦は何本？", ["4", "5", "6", "3"]],
  ["무지개는 보통 몇 가지 색으로 표현할까요?", "How many colors is a rainbow usually said to have?", "虹は一般的に何色で表される？", ["7", "5", "6", "8"]],
  ["빛의 삼원색은 빨강, 초록, 그리고?", "The three primary colors of light are red, green, and…?", "光の三原色は赤、緑、そして？", [["파랑", "Blue", "青"], ["노랑", "Yellow", "黄"], ["보라", "Purple", "紫"], ["흰색", "White", "白"]]],
  ["한글(훈민정음)을 만든 왕은?", "Which king created Hangul, the Korean alphabet?", "ハングル（訓民正音）を作った王は？", [["세종대왕", "King Sejong the Great", "世宗大王"], ["태조", "King Taejo", "太祖"], ["정조", "King Jeongjo", "正祖"], ["영조", "King Yeongjo", "英祖"]]],
  ["대한민국의 화폐 단위는?", "What is the currency of South Korea?", "韓国の通貨単位は？", [["원", "Won", "ウォン"], ["엔", "Yen", "円"], ["위안", "Yuan", "元"], ["달러", "Dollar", "ドル"]]],
  ["일본의 화폐 단위는?", "What is the currency of Japan?", "日本の通貨単位は？", [["엔", "Yen", "円"], ["원", "Won", "ウォン"], ["위안", "Yuan", "元"], ["바트", "Baht", "バーツ"]]],
  ["영국의 화폐 단위는?", "What is the currency of the United Kingdom?", "イギリスの通貨単位は？", [["파운드", "Pound", "ポンド"], ["유로", "Euro", "ユーロ"], ["달러", "Dollar", "ドル"], ["프랑", "Franc", "フラン"]]],
  ["올림픽 오륜기의 고리는 몇 개일까요?", "How many rings are on the Olympic flag?", "オリンピックの五輪マークの輪はいくつ？", ["5", "4", "6", "7"]],
  ["축구 경기에서 한 팀은 몇 명이 뛸까요?", "How many players from one team are on the field in soccer?", "サッカーで1チーム何人がプレーする？", ["11", "9", "10", "12"]],
  ["농구 경기에서 한 팀은 코트에 몇 명이 뛸까요?", "How many players from one team are on the court in basketball?", "バスケットボールで1チーム何人がコートに出る？", ["5", "6", "7", "4"]],
  ["야구에서 수비하는 선수는 몇 명일까요?", "How many players are on the field for the defending team in baseball?", "野球で守備につく選手は何人？", ["9", "10", "11", "8"]],
  ["체스에서 잡히면(체크메이트) 지는 말은?", "In chess, which piece must be protected from checkmate?", "チェスでチェックメイトされると負ける駒は？", [["킹", "King", "キング"], ["퀸", "Queen", "クイーン"], ["룩", "Rook", "ルーク"], ["비숍", "Bishop", "ビショップ"]]],
  ["삼각형의 세 각을 모두 더하면?", "What is the sum of the angles of a triangle?", "三角形の3つの角の和は？", ["180°", "90°", "270°", "360°"]],
  ["육각형의 변은 몇 개일까요?", "How many sides does a hexagon have?", "六角形の辺はいくつ？", ["6", "5", "7", "8"]],
  ["12 × 12 = ?", "12 × 12 = ?", "12 × 12 = ？", ["144", "124", "142", "132"]],
  ["1킬로미터는 몇 미터일까요?", "How many meters are in 1 kilometer?", "1キロメートルは何メートル？", ["1000", "100", "10000", "500"]],
  ["1킬로그램은 몇 그램일까요?", "How many grams are in 1 kilogram?", "1キログラムは何グラム？", ["1000", "100", "10000", "500"]],
  ["로마 숫자 'X'는 몇일까요?", "What number is the Roman numeral 'X'?", "ローマ数字の「X」はいくつ？", ["10", "5", "50", "100"]],
  ["로마 숫자 'V'는 몇일까요?", "What number is the Roman numeral 'V'?", "ローマ数字の「V」はいくつ？", ["5", "1", "10", "50"]],
  ["1부터 10까지 모두 더하면?", "What is the sum of the numbers 1 through 10?", "1から10までをすべて足すと？", ["55", "45", "50", "60"]],
  ["가장 작은 소수(prime number)는?", "What is the smallest prime number?", "一番小さい素数は？", ["2", "1", "3", "0"]],
  ["원주율(π)의 근삿값은?", "What is the approximate value of pi (π)?", "円周率（π）の近似値は？", ["3.14", "2.71", "1.41", "1.73"]],
  ["사람 몸에서 가장 큰 기관은?", "What is the largest organ of the human body?", "人の体で一番大きい器官は？", [["피부", "Skin", "皮膚"], ["간", "Liver", "肝臓"], ["폐", "Lungs", "肺"], ["심장", "Heart", "心臓"]]],
  ["피를 온몸으로 보내는 기관은?", "Which organ pumps blood around the body?", "血液を全身に送る器官は？", [["심장", "Heart", "心臓"], ["폐", "Lungs", "肺"], ["위", "Stomach", "胃"], ["간", "Liver", "肝臓"]]],
  ["성인의 뼈는 보통 몇 개일까요?", "How many bones does an adult human usually have?", "大人の骨は一般的に何本？", ["206", "186", "226", "250"]],
  ["사람의 심장은 몇 개의 방으로 나뉠까요?", "How many chambers does the human heart have?", "人の心臓はいくつの部屋に分かれている？", ["4", "2", "3", "6"]],
  ["사랑니를 포함한 성인의 영구치는 모두 몇 개일까요?", "How many permanent teeth does an adult have, including wisdom teeth?", "親知らずを含めた大人の永久歯は何本？", ["32", "28", "24", "36"]],
  ["식물이 빛을 이용해 양분을 만드는 과정은?", "What is the process plants use to make food from light?", "植物が光を使って養分を作る働きは？", [["광합성", "Photosynthesis", "光合成"], ["호흡", "Respiration", "呼吸"], ["증산 작용", "Transpiration", "蒸散"], ["발효", "Fermentation", "発酵"]]],
  ["지구의 공기에서 가장 많은 기체는?", "Which gas makes up most of Earth's air?", "地球の空気で一番多い気体は？", [["질소", "Nitrogen", "窒素"], ["산소", "Oxygen", "酸素"], ["이산화탄소", "Carbon dioxide", "二酸化炭素"], ["아르곤", "Argon", "アルゴン"]]],
  ["우리가 숨 쉴 때 꼭 필요한 기체는?", "Which gas do we need to breathe?", "私たちが呼吸するのに必要な気体は？", [["산소", "Oxygen", "酸素"], ["질소", "Nitrogen", "窒素"], ["헬륨", "Helium", "ヘリウム"], ["수소", "Hydrogen", "水素"]]],
  ["풍선을 둥둥 띄울 때 흔히 넣는 기체는?", "Which gas is commonly used to make balloons float?", "風船を浮かせるためによく使う気体は？", [["헬륨", "Helium", "ヘリウム"], ["산소", "Oxygen", "酸素"], ["질소", "Nitrogen", "窒素"], ["이산화탄소", "Carbon dioxide", "二酸化炭素"]]],
  ["자연에서 가장 단단한 광물은?", "What is the hardest natural mineral?", "自然界で一番硬い鉱物は？", [["다이아몬드", "Diamond", "ダイヤモンド"], ["금", "Gold", "金"], ["철", "Iron", "鉄"], ["수정", "Quartz", "水晶"]]],
  ["금의 원소 기호는?", "What is the chemical symbol for gold?", "金の元素記号は？", ["Au", "Ag", "Fe", "Gd"]],
  ["철의 원소 기호는?", "What is the chemical symbol for iron?", "鉄の元素記号は？", ["Fe", "Au", "Cu", "Zn"]],
  ["지구에서 가장 가까운 별(항성)은?", "What is the closest star to Earth?", "地球に一番近い恒星は？", [["태양", "The Sun", "太陽"], ["북극성", "Polaris", "北極星"], ["시리우스", "Sirius", "シリウス"], ["베가", "Vega", "ベガ"]]],
  ["지구의 하나뿐인 자연 위성은?", "What is Earth's only natural satellite?", "地球の唯一の自然の衛星は？", [["달", "The Moon", "月"], ["포보스", "Phobos", "フォボス"], ["타이탄", "Titan", "タイタン"], ["유로파", "Europa", "エウロパ"]]],
  ["인류 최초로 달에 발을 디딘 사람은?", "Who was the first person to walk on the Moon?", "人類で初めて月に降り立ったのは？", [["닐 암스트롱", "Neil Armstrong", "ニール・アームストロング"], ["유리 가가린", "Yuri Gagarin", "ユーリイ・ガガーリン"], ["버즈 올드린", "Buzz Aldrin", "バズ・オルドリン"], ["존 글렌", "John Glenn", "ジョン・グレン"]]],
  ["인류 최초로 우주를 비행한 사람은?", "Who was the first human to travel into space?", "人類で初めて宇宙を飛行したのは？", [["유리 가가린", "Yuri Gagarin", "ユーリイ・ガガーリン"], ["닐 암스트롱", "Neil Armstrong", "ニール・アームストロング"], ["앨런 셰퍼드", "Alan Shepard", "アラン・シェパード"], ["존 글렌", "John Glenn", "ジョン・グレン"]]],
  ["지구가 태양 주위를 한 바퀴 도는 데 걸리는 시간은 약?", "About how long does Earth take to orbit the Sun once?", "地球が太陽の周りを1周するのにかかる時間は約？", [["1년", "1 year", "1年"], ["1달", "1 month", "1か月"], ["1일", "1 day", "1日"], ["10년", "10 years", "10年"]]],
  ["지구가 스스로 한 바퀴 도는(자전) 데 걸리는 시간은 약?", "About how long does Earth take to spin once on its axis?", "地球が1回自転するのにかかる時間は約？", [["하루(24시간)", "1 day (24 hours)", "1日（24時間）"], ["1년", "1 year", "1年"], ["1주일", "1 week", "1週間"], ["1시간", "1 hour", "1時間"]]],
  ["전화기 발명가로 널리 알려진 사람은?", "Who is widely known as the inventor of the telephone?", "電話の発明者として広く知られているのは？", [["알렉산더 그레이엄 벨", "Alexander Graham Bell", "グラハム・ベル"], ["토머스 에디슨", "Thomas Edison", "エジソン"], ["니콜라 테슬라", "Nikola Tesla", "ニコラ・テスラ"], ["제임스 와트", "James Watt", "ジェームズ・ワット"]]],
  ["1903년 최초의 동력 비행에 성공한 형제는?", "Which brothers made the first powered airplane flight in 1903?", "1903年に初めて動力飛行に成功した兄弟は？", [["라이트 형제", "The Wright brothers", "ライト兄弟"], ["뤼미에르 형제", "The Lumière brothers", "リュミエール兄弟"], ["그림 형제", "The Brothers Grimm", "グリム兄弟"], ["마르크스 형제", "The Marx Brothers", "マルクス兄弟"]]],
  ["사과가 떨어지는 것을 보고 만유인력을 떠올렸다는 과학자는?", "Which scientist is said to have thought of gravity after seeing an apple fall?", "リンゴが落ちるのを見て万有引力を思いついたとされる科学者は？", [["아이작 뉴턴", "Isaac Newton", "ニュートン"], ["알베르트 아인슈타인", "Albert Einstein", "アインシュタイン"], ["갈릴레오 갈릴레이", "Galileo Galilei", "ガリレオ"], ["찰스 다윈", "Charles Darwin", "ダーウィン"]]],
  ["상대성 이론을 발표한 과학자는?", "Which scientist developed the theory of relativity?", "相対性理論を発表した科学者は？", [["알베르트 아인슈타인", "Albert Einstein", "アインシュタイン"], ["아이작 뉴턴", "Isaac Newton", "ニュートン"], ["마리 퀴리", "Marie Curie", "キュリー夫人"], ["스티븐 호킹", "Stephen Hawking", "ホーキング"]]],
  ["'종의 기원'을 쓴 과학자는?", "Who wrote 'On the Origin of Species'?", "『種の起源』を書いた科学者は？", [["찰스 다윈", "Charles Darwin", "ダーウィン"], ["그레고어 멘델", "Gregor Mendel", "メンデル"], ["루이 파스퇴르", "Louis Pasteur", "パスツール"], ["아이작 뉴턴", "Isaac Newton", "ニュートン"]]],
  ["아이폰을 만드는 회사는?", "Which company makes the iPhone?", "iPhoneを作っている会社は？", [["애플", "Apple", "アップル"], ["삼성", "Samsung", "サムスン"], ["구글", "Google", "グーグル"], ["소니", "Sony", "ソニー"]]],
  ["윈도우(Windows) 운영체제를 만든 회사는?", "Which company makes the Windows operating system?", "Windowsを作った会社は？", [["마이크로소프트", "Microsoft", "マイクロソフト"], ["애플", "Apple", "アップル"], ["IBM", "IBM", "IBM"], ["인텔", "Intel", "インテル"]]],
  ["갤럭시 스마트폰을 만드는 회사는?", "Which company makes Galaxy smartphones?", "Galaxyスマートフォンを作っている会社は？", [["삼성", "Samsung", "サムスン"], ["LG", "LG", "LG"], ["애플", "Apple", "アップル"], ["샤오미", "Xiaomi", "シャオミ"]]],
  ["유튜브를 소유한 회사는?", "Which company owns YouTube?", "YouTubeを所有している会社は？", [["구글", "Google", "グーグル"], ["메타", "Meta", "メタ"], ["아마존", "Amazon", "アマゾン"], ["마이크로소프트", "Microsoft", "マイクロソフト"]]],
  ["인스타그램을 소유한 회사는?", "Which company owns Instagram?", "Instagramを所有している会社は？", [["메타", "Meta", "メタ"], ["구글", "Google", "グーグル"], ["아마존", "Amazon", "アマゾン"], ["애플", "Apple", "アップル"]]],
  ["'슈퍼 마리오'를 만든 게임 회사는?", "Which game company created 'Super Mario'?", "「スーパーマリオ」を作ったゲーム会社は？", [["닌텐도", "Nintendo", "任天堂"], ["소니", "Sony", "ソニー"], ["세가", "Sega", "セガ"], ["캡콤", "Capcom", "カプコン"]]],
  ["포켓몬 '피카츄'의 타입은?", "What type is the Pokémon Pikachu?", "ポケモン「ピカチュウ」のタイプは？", [["전기", "Electric", "でんき"], ["불꽃", "Fire", "ほのお"], ["물", "Water", "みず"], ["풀", "Grass", "くさ"]]],
  ["'해리 포터' 시리즈의 작가는?", "Who wrote the 'Harry Potter' series?", "「ハリー・ポッター」シリーズの作者は？", [["J.K. 롤링", "J.K. Rowling", "J・K・ローリング"], ["J.R.R. 톨킨", "J.R.R. Tolkien", "トールキン"], ["C.S. 루이스", "C.S. Lewis", "C・S・ルイス"], ["로알드 달", "Roald Dahl", "ロアルド・ダール"]]],
  ["'반지의 제왕'의 작가는?", "Who wrote 'The Lord of the Rings'?", "「指輪物語」の作者は？", [["J.R.R. 톨킨", "J.R.R. Tolkien", "トールキン"], ["J.K. 롤링", "J.K. Rowling", "J・K・ローリング"], ["C.S. 루이스", "C.S. Lewis", "C・S・ルイス"], ["셰익스피어", "Shakespeare", "シェイクスピア"]]],
  ["'로미오와 줄리엣'을 쓴 작가는?", "Who wrote 'Romeo and Juliet'?", "「ロミオとジュリエット」を書いたのは？", [["셰익스피어", "Shakespeare", "シェイクスピア"], ["괴테", "Goethe", "ゲーテ"], ["톨스토이", "Tolstoy", "トルストイ"], ["찰스 디킨스", "Charles Dickens", "ディケンズ"]]],
  ["'어린 왕자'를 쓴 작가는?", "Who wrote 'The Little Prince'?", "「星の王子さま」を書いたのは？", [["생텍쥐페리", "Antoine de Saint-Exupéry", "サン＝テグジュペリ"], ["안데르센", "Hans Christian Andersen", "アンデルセン"], ["그림 형제", "The Brothers Grimm", "グリム兄弟"], ["톨스토이", "Tolstoy", "トルストイ"]]],
  ["동화 '인어공주'를 쓴 작가는?", "Who wrote the fairy tale 'The Little Mermaid'?", "童話「人魚姫」を書いたのは？", [["안데르센", "Hans Christian Andersen", "アンデルセン"], ["그림 형제", "The Brothers Grimm", "グリム兄弟"], ["이솝", "Aesop", "イソップ"], ["샤를 페로", "Charles Perrault", "ペロー"]]],
  ["자유의 여신상이 있는 도시는?", "In which city is the Statue of Liberty?", "自由の女神像がある都市は？", [["뉴욕", "New York", "ニューヨーク"], ["워싱턴 D.C.", "Washington, D.C.", "ワシントンD.C."], ["보스턴", "Boston", "ボストン"], ["필라델피아", "Philadelphia", "フィラデルフィア"]]],
  ["에펠탑이 있는 도시는?", "In which city is the Eiffel Tower?", "エッフェル塔がある都市は？", [["파리", "Paris", "パリ"], ["런던", "London", "ロンドン"], ["로마", "Rome", "ローマ"], ["브뤼셀", "Brussels", "ブリュッセル"]]],
  ["피사의 사탑이 있는 나라는?", "In which country is the Leaning Tower of Pisa?", "ピサの斜塔がある国は？", [["이탈리아", "Italy", "イタリア"], ["스페인", "Spain", "スペイン"], ["그리스", "Greece", "ギリシャ"], ["프랑스", "France", "フランス"]]],
  ["만리장성이 있는 나라는?", "In which country is the Great Wall?", "万里の長城がある国は？", [["중국", "China", "中国"], ["몽골", "Mongolia", "モンゴル"], ["일본", "Japan", "日本"], ["인도", "India", "インド"]]],
  ["타지마할이 있는 나라는?", "In which country is the Taj Mahal?", "タージ・マハルがある国は？", [["인도", "India", "インド"], ["파키스탄", "Pakistan", "パキスタン"], ["이란", "Iran", "イラン"], ["튀르키예", "Türkiye", "トルコ"]]],
  ["기자의 피라미드와 스핑크스로 유명한 나라는?", "Which country is famous for the Pyramids of Giza and the Sphinx?", "ギザのピラミッドとスフィンクスで有名な国は？", [["이집트", "Egypt", "エジプト"], ["멕시코", "Mexico", "メキシコ"], ["그리스", "Greece", "ギリシャ"], ["모로코", "Morocco", "モロッコ"]]],
  ["야생 캥거루가 사는 나라는?", "In which country do wild kangaroos live?", "野生のカンガルーが住む国は？", [["호주", "Australia", "オーストラリア"], ["뉴질랜드", "New Zealand", "ニュージーランド"], ["남아프리카공화국", "South Africa", "南アフリカ"], ["브라질", "Brazil", "ブラジル"]]],
  ["자이언트 판다가 주로 먹는 것은?", "What do giant pandas mainly eat?", "ジャイアントパンダが主に食べるものは？", [["대나무", "Bamboo", "竹"], ["사과", "Apples", "リンゴ"], ["물고기", "Fish", "魚"], ["꿀", "Honey", "はちみつ"]]],
  ["세계에서 가장 큰 동물은?", "What is the largest animal in the world?", "世界で一番大きい動物は？", [["대왕고래(흰긴수염고래)", "Blue whale", "シロナガスクジラ"], ["아프리카코끼리", "African elephant", "アフリカゾウ"], ["기린", "Giraffe", "キリン"], ["향유고래", "Sperm whale", "マッコウクジラ"]]],
  ["육지에서 가장 빠른 동물은?", "What is the fastest land animal?", "陸上で一番速い動物は？", [["치타", "Cheetah", "チーター"], ["사자", "Lion", "ライオン"], ["말", "Horse", "ウマ"], ["타조", "Ostrich", "ダチョウ"]]],
  ["세상에서 키가 가장 큰 동물은?", "What is the tallest animal in the world?", "世界で一番背が高い動物は？", [["기린", "Giraffe", "キリン"], ["코끼리", "Elephant", "ゾウ"], ["타조", "Ostrich", "ダチョウ"], ["낙타", "Camel", "ラクダ"]]],
  ["알을 낳는 포유류는?", "Which of these mammals lays eggs?", "卵を産む哺乳類は？", [["오리너구리", "Platypus", "カモノハシ"], ["박쥐", "Bat", "コウモリ"], ["돌고래", "Dolphin", "イルカ"], ["캥거루", "Kangaroo", "カンガルー"]]],
  ["누에고치에서 얻는 실은?", "Which fiber comes from silkworm cocoons?", "カイコのまゆから取れる糸は？", [["비단(실크)", "Silk", "絹（シルク）"], ["면", "Cotton", "綿"], ["양모", "Wool", "羊毛"], ["나일론", "Nylon", "ナイロン"]]],
  ["물고기가 물속에서 숨 쉬는 기관은?", "What organ do fish use to breathe underwater?", "魚が水の中で呼吸する器官は？", [["아가미", "Gills", "えら"], ["폐", "Lungs", "肺"], ["지느러미", "Fins", "ひれ"], ["비늘", "Scales", "うろこ"]]],
  ["개구리의 어린 시절 모습은?", "What is a baby frog called?", "カエルの子どもの姿は？", [["올챙이", "Tadpole", "オタマジャクシ"], ["애벌레", "Caterpillar", "いもむし"], ["번데기", "Pupa", "さなぎ"], ["병아리", "Chick", "ひよこ"]]],
  ["애벌레가 나비가 되기 직전의 단계는?", "What stage comes right before a caterpillar becomes a butterfly?", "いもむしがチョウになる直前の段階は？", [["번데기", "Pupa (chrysalis)", "さなぎ"], ["올챙이", "Tadpole", "オタマジャクシ"], ["알", "Egg", "卵"], ["유충", "Larva", "幼虫"]]],
  ["세계에서 가장 큰 섬은?", "What is the largest island in the world?", "世界で一番大きい島は？", [["그린란드", "Greenland", "グリーンランド"], ["마다가스카르", "Madagascar", "マダガスカル"], ["보르네오", "Borneo", "ボルネオ島"], ["뉴기니", "New Guinea", "ニューギニア島"]]],
  ["남아메리카 서쪽을 따라 길게 뻗은 산맥은?", "Which mountain range runs along the west side of South America?", "南アメリカの西側に長く続く山脈は？", [["안데스산맥", "The Andes", "アンデス山脈"], ["알프스산맥", "The Alps", "アルプス山脈"], ["로키산맥", "The Rockies", "ロッキー山脈"], ["히말라야산맥", "The Himalayas", "ヒマラヤ山脈"]]],
  ["제주도에 있는 산은?", "Which mountain is on Jeju Island?", "済州島にある山は？", [["한라산", "Hallasan", "漢拏山"], ["설악산", "Seoraksan", "雪岳山"], ["지리산", "Jirisan", "智異山"], ["북한산", "Bukhansan", "北漢山"]]],
  ["일본에서 가장 높은 산은?", "What is the highest mountain in Japan?", "日本で一番高い山は？", [["후지산", "Mount Fuji", "富士山"], ["아소산", "Mount Aso", "阿蘇山"], ["다테야마", "Mount Tate", "立山"], ["기타다케", "Mount Kita", "北岳"]]],
  ["북반구에서 낮이 가장 긴 날은?", "In the Northern Hemisphere, which day has the longest daylight?", "北半球で昼が一番長い日は？", [["하지", "Summer solstice", "夏至"], ["동지", "Winter solstice", "冬至"], ["춘분", "Spring equinox", "春分"], ["추분", "Autumn equinox", "秋分"]]],
  ["크리스마스는 몇 월 며칠일까요?", "What is the date of Christmas Day?", "クリスマスは何月何日？", [["12월 25일", "December 25", "12月25日"], ["12월 24일", "December 24", "12月24日"], ["1월 1일", "January 1", "1月1日"], ["11월 25일", "November 25", "11月25日"]]],
  ["눈 결정은 보통 어떤 모양일까요?", "What shape are snowflakes usually?", "雪の結晶はふつうどんな形？", [["육각형", "Hexagon", "六角形"], ["사각형", "Square", "四角形"], ["오각형", "Pentagon", "五角形"], ["팔각형", "Octagon", "八角形"]]],
  ["꿀벌이 꽃에서 모아 만드는 것은?", "What do honeybees make from flower nectar?", "ミツバチが花の蜜から作るものは？", [["꿀", "Honey", "はちみつ"], ["우유", "Milk", "牛乳"], ["설탕", "Sugar", "砂糖"], ["잼", "Jam", "ジャム"]]],
  ["바닷물이 짠 이유가 되는 주된 성분은?", "What mainly makes seawater salty?", "海水がしょっぱい主な成分は？", [["소금(염화나트륨)", "Salt (sodium chloride)", "塩（塩化ナトリウム）"], ["설탕", "Sugar", "砂糖"], ["철", "Iron", "鉄"], ["산소", "Oxygen", "酸素"]]],
  ["번개가 친 뒤 천둥소리가 늦게 들리는 이유는?", "Why do we hear thunder after we see lightning?", "稲妻のあとに雷の音が遅れて聞こえる理由は？", [["빛이 소리보다 빨라서", "Light travels faster than sound", "光が音より速いから"], ["소리가 빛보다 빨라서", "Sound travels faster than light", "音が光より速いから"], ["구름이 소리를 붙잡아서", "Clouds hold the sound", "雲が音を止めるから"], ["바람이 불어서", "Because of the wind", "風が吹くから"]]],
  ["한국의 광복절은 몇 월 며칠일까요?", "On what date is Korea's Liberation Day (Gwangbokjeol)?", "韓国の光復節は何月何日？", [["8월 15일", "August 15", "8月15日"], ["3월 1일", "March 1", "3月1日"], ["10월 3일", "October 3", "10月3日"], ["6월 6일", "June 6", "6月6日"]]],
  ["오리가미(종이접기)로 유명한 전통 종이 공예의 나라는?", "Origami, the art of paper folding, is traditionally associated with which country?", "折り紙が伝統文化として知られる国は？", [["일본", "Japan", "日本"], ["이탈리아", "Italy", "イタリア"], ["멕시코", "Mexico", "メキシコ"], ["이집트", "Egypt", "エジプト"]]],
  ["김치의 주재료로 가장 흔히 쓰이는 채소는?", "Which vegetable is most commonly used to make kimchi?", "キムチの主な材料として最もよく使われる野菜は？", [["배추", "Napa cabbage", "白菜"], ["감자", "Potato", "じゃがいも"], ["토마토", "Tomato", "トマト"], ["옥수수", "Corn", "とうもろこし"]]],
  ["초밥(스시)의 나라로 유명한 곳은?", "Sushi is a traditional food from which country?", "寿司が伝統料理として有名な国は？", [["일본", "Japan", "日本"], ["중국", "China", "中国"], ["태국", "Thailand", "タイ"], ["베트남", "Vietnam", "ベトナム"]]],
  ["피자의 고향으로 알려진 나라는?", "Pizza is known to have originated in which country?", "ピザの発祥の地として知られる国は？", [["이탈리아", "Italy", "イタリア"], ["미국", "United States", "アメリカ"], ["프랑스", "France", "フランス"], ["그리스", "Greece", "ギリシャ"]]],
  ["신호등에서 '멈춤'을 뜻하는 색은?", "Which traffic light color means 'stop'?", "信号で「止まれ」を意味する色は？", [["빨간색", "Red", "赤"], ["초록색", "Green", "緑"], ["노란색", "Yellow", "黄"], ["파란색", "Blue", "青"]]],
  ["알파벳은 모두 몇 글자일까요?", "How many letters are in the English alphabet?", "英語のアルファベットは全部で何文字？", ["26", "24", "25", "28"]],
  ["일주일은 며칠일까요?", "How many days are in a week?", "1週間は何日？", ["7", "5", "6", "8"]],
  ["1분은 몇 초일까요?", "How many seconds are in a minute?", "1分は何秒？", ["60", "100", "30", "90"]],
  ["북극곰이 사는 곳은?", "Where do polar bears live?", "ホッキョクグマが住んでいる場所は？", [["북극", "The Arctic", "北極"], ["남극", "Antarctica", "南極"], ["사막", "The desert", "砂漠"], ["열대 우림", "The rainforest", "熱帯雨林"]]],
  ["달걀을 낳는 동물은?", "Which animal lays the eggs we usually eat?", "私たちがふだん食べる卵を産む動物は？", [["닭", "Chicken", "ニワトリ"], ["소", "Cow", "ウシ"], ["돼지", "Pig", "ブタ"], ["양", "Sheep", "ヒツジ"]]],
  ["세계에서 가장 많은 사람이 사는 대륙은?", "Which continent has the largest population?", "世界で一番人口が多い大陸は？", [["아시아", "Asia", "アジア"], ["아프리카", "Africa", "アフリカ"], ["유럽", "Europe", "ヨーロッパ"], ["남아메리카", "South America", "南アメリカ"]]],
];
const SEA_O2_MS = 15000, SEA_GRACE_MS = 2500, SEA_NEED = 2, SEA_COINS = 400, SEA_COOLDOWN = 3 * 3600 * 1000; // 숨 15초 · 2문제 · 400코인 · 3시간
const ART_PER_DAY = 3, ART_COINS = 50, ART_MAX = 400, ART_MAX_BYTES = 350000; // 그림 하루 3장 · 첫 그림 +50코인
const EMOTES = 8;
const WELCOME_COINS = 100, DAILY_COINS = 100, GB_COINS = 50;
const GAME_MAX = 200, GAME_DAY_MAX = 600, GAME_STEP_M = 100, GAME_STEP_COINS = 5; // 한 판 최대 200 · 하루 최대 600
const MAIL_MAX = 60;
const REC_PER_DAY = 3, REC_MAX_MS = 5000, REC_MAX_NOTES = 300, REC_TTL = 7 * 24 * 3600 * 1000; // 하루 3개 · 5초 · 1주일 뒤 자동 삭제
// 미니게임 속도 공식 (public/js/minigame.js 와 같음): 속도 = min(400, 150 + 4·t) px/s, 10px = 1m
// 10만 m(100만 px)부터는 속도 = 400 + 0.001·(거리 − 100만 px) → 끝없이 조금씩 빨라짐 (지수적으로 증가)
function maxMeters(sec) {
  const tc = (400 - 150) / 4;
  const base = (s) => (s <= tc ? 150 * s + 2 * s * s : 150 * tc + 2 * tc * tc + 400 * (s - tc));
  const X0 = 1e6, K = 0.001, tA = tc + (X0 - base(tc)) / 400;
  const px = sec <= tA ? base(sec) : X0 + (400 / K) * (Math.exp(Math.min(700, K * (sec - tA))) - 1);
  return px / 10;
}
const kstDay = (ts = Date.now()) => new Date(ts + 9 * 3600 * 1000).toISOString().slice(0, 10);
const shopItemFor = (kind, idx) => Object.entries(SHOP).find(([, v]) => v.kind === kind && v.idx === idx);
const keyTs = (k) => +k.split("/")[2].split("-")[0];
const b64u = (buf) => Buffer.from(buf).toString("base64url");

// ---- 서명 키: 환경변수 JWT_SECRET 우선, 없으면 Blobs에 자동 생성·저장 ----
let cachedSecret = null;
async function getSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (cachedSecret) return cachedSecret;
  const cfg = store("jl-config");
  let s = await cfg.get("secret");
  if (!s) {
    s = crypto.randomBytes(48).toString("hex");
    await cfg.set("secret", s);
  }
  cachedSecret = s;
  return s;
}
async function signToken(payload) {
  const body = b64u(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
  const sig = crypto.createHmac("sha256", await getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
async function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expect = crypto.createHmac("sha256", await getSecret()).update(body).digest("base64url");
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

function hashPassword(pw, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString("hex") };
}
function checkPassword(pw, salt, hash) {
  return crypto.timingSafeEqual(crypto.scryptSync(pw, salt, 64), Buffer.from(hash, "hex"));
}

const artistEmails = () =>
  (process.env.ARTIST_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
// 관리자: 호스트(ARTIST_EMAILS) + ADMIN_EMAILS (환경변수, 쉼표로 여러 개)
const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const roleOf = (email) => (artistEmails().includes(email) ? "artist" : adminEmails().includes(email) ? "admin" : "fan");
const isStaff = (role) => role === "artist" || role === "admin";
const userKey = (email) => "u/" + crypto.createHash("sha256").update(email).digest("hex");
const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  nickname: u.nickname || "",
  avatar: u.avatar || null,
  lang: LANGS.includes(u.lang) ? u.lang : "ko",
  role: roleOf(u.email),
  coins: u.coins | 0,
  inv: Array.isArray(u.inv) ? u.inv : [],
  daily: u.lastDaily || null,
  gameLeft: u.gameDay === kstDay() ? Math.max(0, GAME_DAY_MAX - (u.gameCoins | 0)) : GAME_DAY_MAX,
  gbToday: u.gbLastDay === kstDay(),
  slotLeft: u.slotDay === kstDay() ? Math.max(0, 20 - (u.slotCount | 0)) : 20,
});

// 토큰에 닉네임/아바타를 담아 두면 /sync 때 회원 정보를 읽지 않아도 돼서 빠르고 저렴해요
const tokenFor = (u) => signToken({ email: u.email, id: u.id, n: u.nickname || "", a: u.avatar || null });
async function tokenPayload(req) {
  return verifyToken((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
}
async function auth(req) {
  const p = await verifyToken((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
  if (!p) return null;
  return (await store("jl-users").get(userKey(p.email), { type: "json" })) || null;
}
// 탈퇴 처리된 회원 id 목록 (sync 는 토큰만 보므로 따로 확인) — 30초 캐시
let delCache = { at: 0, set: new Set() };
async function deletedIds(force) {
  if (!force && Date.now() - delCache.at < 30000) return delCache.set;
  const arr = (await store("jl-config").get("deleted", { type: "json" })) || [];
  delCache = { at: Date.now(), set: new Set(arr) };
  return delCache.set;
}
const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, n);

// ================= 🔔 웹 푸시 알림 (홈 화면에 추가한 앱 · 안드로이드 크롬) =================
// 외부 라이브러리 없이 표준(RFC 8291 aes128gcm + RFC 8292 VAPID)대로 직접 암호화해서 보냄
const b64uDec = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
let vapidCache = null;
async function getVapid() {
  if (vapidCache) return vapidCache;
  const cfg = store("jl-config");
  let v = await cfg.get("vapid", { type: "json" });
  if (!v) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const pj = publicKey.export({ format: "jwk" });
    v = { pub: b64u(Buffer.concat([Buffer.from([4]), b64uDec(pj.x), b64uDec(pj.y)])), jwk: privateKey.export({ format: "jwk" }) };
    await cfg.setJSON("vapid", v);
  }
  vapidCache = { pub: v.pub, key: crypto.createPrivateKey({ key: v.jwk, format: "jwk" }) };
  return vapidCache;
}
const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();
function encryptPush(sub, payload) {
  const uaPub = b64uDec(sub.keys.p256dh), auth = b64uDec(sub.keys.auth);
  const ecdh = crypto.createECDH("prime256v1"); ecdh.generateKeys();
  const asPub = ecdh.getPublicKey(), secret = ecdh.computeSecret(uaPub);
  const prkKey = hmac(auth, secret);
  const ikm = hmac(prkKey, Buffer.concat([Buffer.from("WebPush: info\0"), uaPub, asPub, Buffer.from([1])]));
  const salt = crypto.randomBytes(16), prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.concat([Buffer.from("Content-Encoding: aes128gcm\0"), Buffer.from([1])])).subarray(0, 16);
  const nonce = hmac(prk, Buffer.concat([Buffer.from("Content-Encoding: nonce\0"), Buffer.from([1])])).subarray(0, 12);
  const c = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const ct = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
}
async function vapidHeader(endpoint) {
  const v = await getVapid(), aud = new URL(endpoint).origin;
  const head = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" })), body = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "https://jellyland.netlify.app" }));
  const sig = crypto.sign("sha256", Buffer.from(`${head}.${body}`), { key: v.key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${v.pub}`;
}
// 알림 문구 (받는 사람 언어로)
const PUSH_TEXT = {
  host: { ko: ["👑 Jo Jelly 등장!", "조젤리가 젤리랜드에 들어왔어요! 지금 놀러 오세요 ♪"], en: ["👑 Jo Jelly is here!", "Jo Jelly just entered JELLY LAND! Come say hi ♪"], ja: ["👑 Jo Jelly 登場！", "Jo Jelly がゼリーランドに来ました！今すぐ遊びに来てね ♪"] },
  mail: { ko: ["✉️ 새 쪽지가 왔어요", "{from}: {text}"], en: ["✉️ New message", "{from}: {text}"], ja: ["✉️ 新しいメッセージ", "{from}: {text}"] },
};
// uids: 받을 회원 id 목록 (null = 알림을 켠 모든 회원)
async function sendPush(uids, kind, vars = {}, exclude = null) {
  const ps = store("jl-push");
  const { blobs } = await ps.list({ prefix: "s/" });
  const keys = blobs.map((b) => b.key).filter((k) => (!uids || uids.includes(k.split("/")[1])) && k.split("/")[1] !== exclude);
  let sent = 0;
  for (let i = 0; i < keys.length; i += 40) {
    await Promise.all(keys.slice(i, i + 40).map(async (k) => {
      try {
        const rec = await ps.get(k, { type: "json" }); if (!rec) return;
        const tx = PUSH_TEXT[kind][rec.lang] || PUSH_TEXT[kind].ko;
        const fill = (s) => s.replace("{from}", vars.from || "").replace("{text}", String(vars.text || "").slice(0, 80));
        const payload = JSON.stringify({ title: fill(tx[0]), body: fill(tx[1]), url: "/", tag: kind });
        const r = await fetch(rec.sub.endpoint, { method: "POST", headers: { Authorization: await vapidHeader(rec.sub.endpoint), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "high" }, body: encryptPush(rec.sub, payload), signal: withTimeout(6000) });
        if (r.status === 404 || r.status === 410) await ps.delete(k); // 알림을 끈 기기는 정리
        else if (r.ok) sent++;
      } catch {}
    }));
  }
  return sent;
}

// ================= 번역 =================
// 1) 환경변수 DEEPL_API_KEY 가 있으면 DeepL (무료 플랜: 월 50만 자)
// 2) 없으면 MyMemory 무료 API (키 불필요, 하루 사용량 제한 있음 — MYMEMORY_EMAIL 설정 시 한도 증가)
function detectLang(text) {
  if (/[가-힣ㄱ-ㆎ]/.test(text)) return "ko";
  if (/[぀-ヿㇰ-ㇿ一-鿿]/.test(text)) return "ja";
  return "en";
}
const withTimeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

async function translateDeepL(text, from, to) {
  const key = process.env.DEEPL_API_KEY;
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const target = { ko: "KO", en: "EN-US", ja: "JA" }[to];
  const r = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { authorization: `DeepL-Auth-Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ text: [text], source_lang: from.toUpperCase(), target_lang: target }),
    signal: withTimeout(5000),
  });
  if (!r.ok) throw new Error("deepl " + r.status);
  const d = await r.json();
  return d.translations?.[0]?.text || null;
}
async function translateMyMemory(text, from, to) {
  const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : "";
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}${email}`, { signal: withTimeout(5000) });
  if (!r.ok) throw new Error("mymemory " + r.status);
  const d = await r.json();
  const out = d?.responseData?.translatedText;
  if (Number(d?.responseStatus) !== 200 || !out || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) throw new Error("mymemory quota");
  return out;
}
async function translateAll(text) {
  const src = detectLang(text);
  const tr = { [src]: text };
  // 이모지·숫자·기호만 있는 메시지는 번역하지 않음
  if (!/[\p{L}]/u.test(text)) { for (const l of LANGS) tr[l] = text; return { lang: src, tr }; }
  await Promise.all(LANGS.filter((l) => l !== src).map(async (to) => {
    try {
      tr[to] = process.env.DEEPL_API_KEY ? await translateDeepL(text, src, to) : await translateMyMemory(text, src, to);
    } catch (e) {
      console.warn("translate failed", src, to, e.message);
    }
  }));
  return { lang: src, tr };
}

// ================= 라우터 =================
export default async (req) => {
  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const method = req.method;
  let body = {};
  if (method === "POST") { try { body = await req.json(); } catch { body = {}; } }

  try {
    if (route === "push/key") return json({ key: (await getVapid()).pub });
    // 🎨 그림 이미지 (로그인 없이 <img> 로 보기)
    if (route === "art/img" && method === "GET") {
      const id = String(url.searchParams.get("id") || "");
      if (!/^[0-9a-z-]{8,40}$/.test(id)) return err("notfound", 404);
      const d = await store("jl-art").get("i/" + id);
      const m = d && /^data:image\/png;base64,(.+)$/.exec(d);
      if (!m) return err("notfound", 404);
      return new Response(Buffer.from(m[1], "base64"), { headers: { "content-type": "image/png", "cache-control": "public, max-age=604800, immutable" } });
    }
    if (route === "health") return json({ ok: true, translator: process.env.DEEPL_API_KEY ? "deepl" : "mymemory" });

    if (route === "signup" && method === "POST") {
      const email = clean(body.email, 120).toLowerCase();
      const password = String(body.password || "");
      if (!EMAIL_RE.test(email)) return err("email");
      if (password.length < 6) return err("pw6");
      const users = store("jl-users");
      const key = userKey(email);
      if (await users.get(key)) return err("exists", 409);
      const { salt, hash } = hashPassword(password);
      const user = {
        id: crypto.randomUUID(), email, salt, hash, nickname: "", avatar: null,
        lang: LANGS.includes(body.lang) ? body.lang : "ko", createdAt: Date.now(), coins: 0, inv: [],
      };
      await users.setJSON(key, user);
      return json({ token: await tokenFor(user), user: publicUser(user) });
    }

    if (route === "login" && method === "POST") {
      const email = clean(body.email, 120).toLowerCase();
      const user = await store("jl-users").get(userKey(email), { type: "json" });
      if (!user || !checkPassword(String(body.password || ""), user.salt, user.hash)) return err("login", 401);
      return json({ token: await tokenFor(user), user: publicUser(user) });
    }

    // ---------- 실시간 동기화: 위치 + 새 채팅 + 공지 (한 번의 요청) ----------
    if (route === "sync" && method === "POST") {
      const tp = await tokenPayload(req);
      if (!tp) return err("auth", 401);
      if (tp.n === undefined) return err("auth", 401); // 예전 토큰 → 다시 로그인
      const role = roleOf(tp.email);
      if ((await deletedIds()).has(tp.id)) return err("gone", 401); // 탈퇴 처리된 회원
      const scene = ROOMS.includes(body.scene) ? body.scene : "plaza";
      const other = scene === "plaza" ? "lounge" : "plaza";
      const ps = store("jl-presence");
      const cs = store("jl-chat");
      const now = Date.now();
      const since = +body.since || 0;
      const [cur, oth, last] = await Promise.all([
        ps.get("room/" + scene, { type: "json" }).then((v) => v || {}),
        ps.get("room/" + other, { type: "json" }).then((v) => v || {}),
        cs.get("last/" + scene, { type: "json" }).then((v) => v || { ts: 0, notice: null }),
      ]);
      const mine = cur[tp.id];
      const entry = {
        id: tp.id, name: tp.n, avatar: tp.a, role,
        x: Math.round(+body.x || 0), y: Math.round(+body.y || 0), dir: clean(body.dir, 5), seat: (clean(body.seat, 12) === "throne" && role !== "artist" ? null : clean(body.seat, 12)) || null, // 공주 의자는 호스트만
        vx: Math.max(-200, Math.min(200, Math.round(+body.vx || 0))), vy: Math.max(-200, Math.min(200, Math.round(+body.vy || 0))), ts: now,
      };
      // 😊 이모티콘 반응: 새로 보낸 것만 4초 동안 다른 사람에게 보임
      if (body.emo && Number.isInteger(body.emo.e) && body.emo.e >= 0 && body.emo.e < EMOTES) entry.emo = { e: body.emo.e, k: clean(String(body.emo.k || ""), 12), t: now };
      else if (mine && mine.emo && now - mine.emo.t < 4000) entry.emo = mine.emo;
      // 위치가 그대로이고 최근에 저장했다면 쓰기를 건너뜀 (비용 절약)
      const unchanged = mine && mine.x === entry.x && mine.y === entry.y && mine.dir === entry.dir && mine.seat === entry.seat && mine.vx === entry.vx && mine.vy === entry.vy && mine.name === entry.name && (mine.emo && mine.emo.k) === (entry.emo && entry.emo.k) &&
        JSON.stringify(mine.avatar) === JSON.stringify(entry.avatar) && now - mine.ts < 8000;
      const writes = [];
      for (const k of Object.keys(cur)) if (now - cur[k].ts > 15000) { delete cur[k]; }
      if (!unchanged) { cur[tp.id] = entry; writes.push(ps.setJSON("room/" + scene, cur)); }
      if (oth[tp.id]) { delete oth[tp.id]; writes.push(ps.setJSON("room/" + other, oth)); }
      let messages = [];
      if (last.ts > since) {
        const { blobs } = await cs.list({ prefix: `m/${scene}/` });
        const fresh = blobs.map((b) => b.key).sort().slice(-50).filter((k) => keyTs(k) >= since && keyTs(k) > now - CHAT_TTL);
        messages = (await Promise.all(fresh.map((k) => cs.get(k, { type: "json" }).then((m) => m && { ...m, key: k })))).filter(Boolean);
      }
      await Promise.all(writes);
      const fresh = (o) => Object.values(o).filter((p) => now - p.ts < 12000);
      return json({
        others: fresh(cur).filter((p) => p.id !== tp.id),
        online: fresh(cur).length + fresh(oth).filter((p) => p.id !== tp.id).length + (cur[tp.id] ? 0 : 1),
        messages, notice: last.notice || null, lastTs: last.ts, now,
      });
    }

    // ---------- 이하 로그인 필요 ----------
    const user = await auth(req);
    if (!user) return err("auth", 401);
    // 👑 호스트는 코인이 항상 100만 이상
    if (roleOf(user.email) === "artist" && (user.coins | 0) < 1000000) { user.coins = 1000000; await store("jl-users").setJSON(userKey(user.email), user); }
    const me = publicUser(user);
    const saveUser = () => store("jl-users").setJSON(userKey(user.email), user);

    if (route === "me") return json({ user: me, token: await tokenFor(user) });

    if (route === "avatar" && method === "POST") {
      const nickname = clean(body.nickname, 12);
      if (!nickname) return err("nick");
      const a = body.avatar || {};
      const n = (v, max = 9) => Math.max(0, Math.min(max, v | 0));
      user.nickname = nickname;
      const isHost = me.role === "artist";
      const owns = (kind, idx) => { const it = shopItemFor(kind, idx); return !it || isHost || (user.inv || []).includes(it[0]); };
      let outfit = n(a.outfit, 16), hair = n(a.hair, 13), wand = n(a.wand, 4), bubble = n(a.bubble, 7);
      if (HOST_OUTFITS.includes(outfit) && !isHost) outfit = 0; // 호스트 전용 의상은 호스트만
      if (!owns("outfit", outfit)) outfit = 0;                  // 샵 아이템은 산 사람만
      if (!owns("hair", hair)) hair = 0;
      if (!owns("wand", wand)) wand = 0;
      if (!owns("bubble", bubble)) bubble = 0;
      user.avatar = { gender: a.gender === "m" ? "m" : "f", hair, hairColor: n(a.hairColor), skin: n(a.skin), outfit, eye: n(a.eye), ...(wand ? { wand } : {}), ...(bubble ? { bubble } : {}) };
      await saveUser();
      return json({ user: publicUser(user), token: await tokenFor(user) });
    }

    if (route === "settings" && method === "POST") {
      if (LANGS.includes(body.lang)) user.lang = body.lang;
      await saveUser();
      return json({ user: publicUser(user), token: await tokenFor(user) });
    }

    // ---------- 젤리코인: 환영 + 출석 ----------
    if (route === "daily" && method === "POST") {
      const gained = {};
      if (!user.welcomed) { user.welcomed = true; user.coins = (user.coins | 0) + WELCOME_COINS; gained.welcome = WELCOME_COINS; }
      const today = kstDay();
      if (user.lastDaily !== today) { user.lastDaily = today; user.coins = (user.coins | 0) + DAILY_COINS; gained.daily = DAILY_COINS; }
      if (gained.welcome || gained.daily) await saveUser();
      return json({ user: publicUser(user), gained });
    }

    // ---------- 젤리젤리샵 ----------
    if (route === "shop/buy" && method === "POST") {
      const id = String(body.item || "");
      const it = SHOP[id];
      if (!it) return err("notfound", 404);
      user.inv = Array.isArray(user.inv) ? user.inv : [];
      if (user.inv.includes(id)) return json({ user: publicUser(user), owned: true });
      if ((user.coins | 0) < it.price) return err("coins", 400);
      user.coins = (user.coins | 0) - it.price;
      user.inv.push(id);
      await saveUser();
      return json({ user: publicUser(user) });
    }

    // ---------- 미니게임: 점프점프 젤리월드 ----------
    const gameLeft = () => (user.gameDay === kstDay() ? Math.max(0, GAME_DAY_MAX - (user.gameCoins | 0)) : GAME_DAY_MAX);
    // 게임 종류: jump = 점프점프 젤리월드, up = 올라올라 (코인은 두 게임 합쳐 하루 600)
    const GAMES = { jump: { top: "top", best: "best" }, up: { top: "top_up", best: "bestUp" } };
    const gameOf = (g) => (GAMES[g] ? g : "jump");
    const runSig = async (t0, g) => crypto.createHmac("sha256", await getSecret()).update(g === "jump" ? `run.${user.id}.${t0}` : `run.${user.id}.${t0}.${g}`).digest("base64url").slice(0, 22);
    if (route === "game/start" && method === "POST") {
      const t0 = Date.now(), g = gameOf(body.game);
      return json({ run: `${t0}.${await runSig(t0, g)}${g === "jump" ? "" : "." + g}`, dayLeft: gameLeft() });
    }
    if (route === "game/finish" && method === "POST") {
      const [t0s, sig, gRaw] = String(body.run || "").split(".");
      const t0 = +t0s, g = gameOf(gRaw || "jump"), G = GAMES[g];
      if (!t0 || sig !== (await runSig(t0, g))) return err("forbidden", 400);
      if ((user.lastRun || 0) >= t0) return json({ user: publicUser(user), coins: 0, dup: true, dayLeft: gameLeft() }); // 같은 판 중복 제출
      const sec = (Date.now() - t0) / 1000;
      if (sec > 12 * 3600) return err("forbidden", 400); // 한 판 최대 12시간 (예전 1시간 제한 때문에 긴 기록이 저장되지 않던 문제 수정)
      // 시간에 비해 너무 먼 거리(높이)는 인정 안 함 — 올라올라는 초당 최대 약 50m
      const m = Math.max(0, Math.min(+body.m || 0, g === "up" ? sec * 90 + 300 : maxMeters(sec) * 1.1 + 20));
      const left = gameLeft();
      const coins = Math.min(GAME_MAX, left, Math.floor(m / GAME_STEP_M) * GAME_STEP_COINS);
      if (user.gameDay !== kstDay()) { user.gameDay = kstDay(); user.gameCoins = 0; }
      user.gameCoins = (user.gameCoins | 0) + coins;
      user.lastRun = t0;
      user.coins = (user.coins | 0) + coins;
      if (m > (user[G.best] | 0)) user[G.best] = Math.floor(m);
      await saveUser();
      // 랭킹 TOP 10 (한 사람당 최고 기록 1개)
      let rank = 0;
      const gs = store("jl-game");
      let top = (await gs.get(G.top, { type: "json" })) || [];
      const mine = top.find((e) => e.id === user.id);
      const mm = Math.floor(m);
      const qualifies = mm > 0 && (!mine || mm > mine.m) && (top.length < 10 || mm > top[top.length - 1].m || mine);
      if (qualifies) {
        top = top.filter((e) => e.id !== user.id);
        top.push({ id: user.id, name: me.nickname || "?", avatar: me.avatar, role: me.role, m: mm, ts: Date.now() });
        top.sort((a, b) => b.m - a.m || a.ts - b.ts);
        top = top.slice(0, 10);
        await gs.setJSON(G.top, top);
        rank = top.findIndex((e) => e.id === user.id) + 1;
      }
      return json({ user: publicUser(user), coins, best: user[G.best] | 0, rank, top, dayLeft: gameLeft(), game: g });
    }
    if (route === "game/top" && method === "GET") {
      const gs = store("jl-game");
      if (url.searchParams.get("game") === "all") { // 광장 랭킹 게시판용: 두 게임 1위
        const [a, b] = await Promise.all([gs.get("top", { type: "json" }), gs.get("top_up", { type: "json" })]);
        return json({ jump: (a || [])[0] || null, up: (b || [])[0] || null });
      }
      const g = gameOf(url.searchParams.get("game"));
      const top = (await gs.get(GAMES[g].top, { type: "json" })) || [];
      return json({ top, best: user[GAMES[g].best] | 0 });
    }

    // ---------- 🎰 럭키젤리! ----------
    // 참가비 20코인 · 하루 20번 · 확률 (10만 분율): Jelly! 3개 1/300 → 100배 · Jelly! 2개 1/100 → 10배 · 사과 3개 1/16 → 3배 · 하트 3개 1/16 → 3배
    //                  별 1개 이상 40% → 참가비 돌려받음 · 나머지(약 46%) → 참가비 잃음
    if (route === "slot/spin" && method === "POST") {
      const BET = 20, SLOT_PER_DAY = 20;
      if (user.slotDay !== kstDay()) { user.slotDay = kstDay(); user.slotCount = 0; }
      if ((user.slotCount | 0) >= SLOT_PER_DAY) return err("slotDaily", 429); // 하루 20번까지
      if ((user.coins | 0) < BET) return err("coins", 400);
      const J = "jelly", A = "apple", Hh = "heart", S = "star";
      const OTHERS = ["grape", "bell", "note", "candy", "clover", "lemon"];
      const pick = (arr) => arr[crypto.randomInt(arr.length)];
      const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
      const r = crypto.randomInt(100000);
      let outcome, reels, mult;
      if (r < 333) { outcome = "jackpot"; mult = 100; reels = [J, J, J]; }
      else if (r < 1333) { outcome = "jelly2"; mult = 10; reels = shuffle([J, J, pick([A, Hh, ...OTHERS])]); }
      else if (r < 7583) { outcome = "apple"; mult = 3; reels = [A, A, A]; }
      else if (r < 13833) { outcome = "heart"; mult = 3; reels = [Hh, Hh, Hh]; }
      else if (r < 53833) { // 별: 1~2개 + 나머지 (Jelly! 는 최대 1개, 같은 그림 3개는 안 나오게)
        outcome = "star"; mult = 1;
        const stars = crypto.randomInt(10) < 8 ? 1 : 2;
        const rest = []; while (rest.length < 3 - stars) { const c = pick([J, A, Hh, ...OTHERS]); if (c === J && rest.includes(J)) continue; rest.push(c); }
        reels = shuffle([...Array(stars).fill(S), ...rest]);
      } else { // 꽝: 별 없음 · Jelly! 최대 1개 · 3개 같은 그림 없음
        outcome = "lose"; mult = 0;
        do { reels = [0, 1, 2].map(() => pick([J, A, Hh, ...OTHERS])); } while (reels.filter((x) => x === J).length >= 2 || (reels[0] === reels[1] && reels[1] === reels[2]));
      }
      const payout = BET * mult;
      user.coins = (user.coins | 0) - BET + payout;
      user.slotSpins = (user.slotSpins | 0) + 1;
      user.slotCount = (user.slotCount | 0) + 1;
      await saveUser();
      if (outcome === "jackpot") { try { const gs = store("jl-game"); const list = (await gs.get("slot_jackpots", { type: "json" })) || []; list.unshift({ name: me.nickname, ts: Date.now() }); await gs.setJSON("slot_jackpots", list.slice(0, 20)); } catch {} }
      return json({ reels, outcome, payout, bet: BET, user: publicUser(user) });
    }

    // ---------- 🎹 젤리에게 들려줘! (피아노 녹음 게시판) ----------
    if (route === "rec") {
      const rs = store("jl-rec");
      if (method === "GET") {
        const { blobs } = await rs.list({ prefix: "r/" });
        const cut = Date.now() - REC_TTL;
        const recTs = (k) => +k.split("/").pop().split("-")[0];
        const old = blobs.map((b) => b.key).filter((k) => recTs(k) < cut);
        if (old.length) await Promise.all(old.slice(0, 40).map((k) => rs.delete(k).catch(() => {}))); // 1주일 지난 녹음 정리
        const keys = blobs.map((b) => b.key).filter((k) => recTs(k) >= cut).sort().reverse();
        const page = Math.max(0, +url.searchParams.get("page") || 0);
        const entries = (await Promise.all(keys.slice(page * 15, page * 15 + 15).map((k) => rs.get(k, { type: "json" }).then((e) => e && { ...e, key: k })))).filter(Boolean);
        const today = kstDay();
        return json({ entries, total: keys.length, left: isStaff(me.role) ? 99 : user.recDay === today ? Math.max(0, REC_PER_DAY - (user.recCount | 0)) : REC_PER_DAY });
      }
      if (method === "POST") {
        const today = kstDay();
        if (user.recDay !== today) { user.recDay = today; user.recCount = 0; }
        if (!isStaff(me.role) && (user.recCount | 0) >= REC_PER_DAY) return err("recDaily", 429);
        // 음표 목록만 저장: [시작ms, 건반(midi), 길이ms]
        const raw = Array.isArray(body.notes) ? body.notes.slice(0, REC_MAX_NOTES) : [];
        const notes = [];
        for (const n of raw) {
          if (!Array.isArray(n)) continue;
          const t0 = Math.round(+n[0]), m = Math.round(+n[1]), d = Math.round(+n[2]);
          if (!(t0 >= 0 && t0 <= REC_MAX_MS && m >= 21 && m <= 108)) continue;
          notes.push([t0, m, Math.max(30, Math.min(REC_MAX_MS + 3000, d || 300))]);
        }
        if (!notes.length) return err("recEmpty");
        const ts = Date.now();
        const key = `r/${String(ts).padStart(15, "0")}-${crypto.randomBytes(3).toString("hex")}`;
        const e = { id: user.id, name: me.nickname || "?", role: me.role, avatar: me.avatar, title: clean(body.title, 30), notes, len: Math.min(REC_MAX_MS, Math.max(...notes.map((n) => n[0]))), ts };
        user.recCount = (user.recCount | 0) + 1;
        await Promise.all([rs.setJSON(key, e), saveUser()]);
        return json({ entry: { ...e, key }, left: isStaff(me.role) ? 99 : REC_PER_DAY - user.recCount });
      }
      if (method === "DELETE") {
        const key = url.searchParams.get("key") || "";
        if (!key.startsWith("r/")) return err("forbidden", 400);
        const e = await rs.get(key, { type: "json" });
        if (!e) return json({ ok: true });
        if (!isStaff(me.role)) return err("forbidden", 403); // 호스트·관리자만 삭제
        await rs.delete(key);
        return json({ ok: true });
      }
    }

    // ---------- 🔔 알림 구독 ----------
    if (route === "push/sub") {
      const ps = store("jl-push");
      const sub = body.sub || {};
      if (method === "POST") {
        if (!sub.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) return err("msg");
        const k = `s/${user.id}/${crypto.createHash("sha256").update(sub.endpoint).digest("hex").slice(0, 24)}`;
        await ps.setJSON(k, { sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, uid: user.id, lang: me.lang, ts: Date.now() });
        return json({ ok: true });
      }
      if (method === "DELETE") {
        const ep = url.searchParams.get("ep") || "";
        const k = `s/${user.id}/${crypto.createHash("sha256").update(ep).digest("hex").slice(0, 24)}`;
        try { await ps.delete(k); } catch {}
        return json({ ok: true });
      }
    }
    // 👑 호스트 입장 → 알림을 켠 모든 회원에게 푸시 (30분에 한 번)
    if (route === "push/host" && method === "POST") {
      if (me.role !== "artist") return err("forbidden", 403);
      const cfg = store("jl-config");
      const last = +(await cfg.get("hostPushAt")) || 0;
      if (Date.now() - last < 30 * 60 * 1000) return json({ ok: true, skipped: true });
      await cfg.set("hostPushAt", String(Date.now()));
      const sent = await sendPush(null, "host", {}, user.id);
      return json({ ok: true, sent });
    }

    // ---------- ✉️ 쪽지함 ----------
    if (route === "mail" || route === "mail/read") {
      const ms = store("jl-mail");
      const boxKey = "box/" + user.id;
      let box = (await ms.get(boxKey, { type: "json" })) || [];
      if (route === "mail" && method === "GET") return json({ box, unread: box.filter((m) => !m.read).length });
      if (route === "mail/read" && method === "POST") { if (box.some((m) => !m.read)) { box = box.map((m) => ({ ...m, read: true })); await ms.setJSON(boxKey, box); } return json({ ok: true, unread: 0 }); }
      if (route === "mail" && method === "DELETE") { const ts = +url.searchParams.get("ts"); box = box.filter((m) => m.ts !== ts); await ms.setJSON(boxKey, box); return json({ box, unread: box.filter((m) => !m.read).length }); }
    }

    // ---------- 🫧 분수대 속 보물상자 (퀴즈) ----------
    if (route.startsWith("sea/") && method === "POST") {
      const now = Date.now();
      const lockLeft = () => Math.max(0, (user.seaAt || 0) + SEA_COOLDOWN - now);
      const lang = LANGS.includes(body.lang) ? LANGS.indexOf(body.lang) : 0;
      if (route === "sea/dive") {
        user.sea = { t0: now, ok: 0, q: -1 };
        await saveUser();
        return json({ o2: SEA_O2_MS, need: SEA_NEED, coins: SEA_COINS, lockLeft: lockLeft() });
      }
      const sea = user.sea;
      if (!sea || now - sea.t0 > SEA_O2_MS + SEA_GRACE_MS) return err("seaTimeout", 400);
      if (lockLeft() > 0) return err("seaLocked", 400);
      if (route === "sea/q") {
        const seen = Array.isArray(user.seaSeen) ? user.seaSeen : [];
        let pool = QUIZ.map((_, i) => i).filter((i) => !seen.includes(i));
        if (!pool.length) pool = QUIZ.map((_, i) => i);
        const qi = pool[crypto.randomInt(pool.length)];
        const perm = [0, 1, 2, 3];
        for (let i = 3; i > 0; i--) { const j = crypto.randomInt(i + 1); [perm[i], perm[j]] = [perm[j], perm[i]]; }
        sea.q = qi; sea.perm = perm;
        user.seaSeen = [...seen.filter((i) => i !== qi), qi].slice(-100);
        await saveUser();
        const Q = QUIZ[qi], pick = (c) => (typeof c === "string" ? c : c[lang]);
        return json({ q: Q[lang], choices: perm.map((i) => pick(Q[3][i])), ok: sea.ok, need: SEA_NEED, left: Math.max(0, SEA_O2_MS - (now - sea.t0)) });
      }
      if (route === "sea/answer") {
        if (!(sea.q >= 0) || !Array.isArray(sea.perm)) return err("msg");
        const choice = body.choice | 0;
        const answer = sea.perm.indexOf(0);
        const correct = choice === answer;
        sea.q = -1; sea.perm = null;
        if (correct) sea.ok = (sea.ok | 0) + 1;
        if (sea.ok >= SEA_NEED) {
          user.sea = null; user.seaAt = now;
          user.coins = (user.coins | 0) + SEA_COINS;
          await saveUser();
          return json({ correct, answer, ok: SEA_NEED, opened: true, coins: SEA_COINS, lockLeft: SEA_COOLDOWN, user: publicUser(user) });
        }
        await saveUser();
        return json({ correct, answer, ok: sea.ok, opened: false });
      }
      return err("notfound", 404);
    }

    // ---------- 🎨 젤리에게 그려줘! (그림판 갤러리) ----------
    if (route.startsWith("art")) {
      const as = store("jl-art");
      const today = kstDay();
      const artLeft = () => (isStaff(me.role) ? 99 : user.artDay === today ? Math.max(0, ART_PER_DAY - (user.artCount | 0)) : ART_PER_DAY);
      const loadIdx = async () => (await as.get("idx", { type: "json" })) || [];
      const view = (e) => ({ id: e.id, uid: e.uid, name: e.name, role: e.role, avatar: e.avatar, title: e.title, ts: e.ts, likes: (e.likes || []).length, liked: (e.likes || []).includes(user.id) });
      if (route === "art" && method === "GET") {
        const idx = await loadIdx();
        const sort = url.searchParams.get("sort") === "top" ? "top" : "new";
        const list = idx.slice();
        if (sort === "top") list.sort((a, b) => (b.likes || []).length - (a.likes || []).length || b.ts - a.ts);
        else list.sort((a, b) => b.ts - a.ts || (b.id > a.id ? 1 : -1));
        const page = Math.max(0, +url.searchParams.get("page") || 0), PER = 12;
        return json({ items: list.slice(page * PER, page * PER + PER).map(view), total: list.length, left: artLeft() });
      }
      if (route === "art" && method === "POST") {
        if (artLeft() <= 0) return err("artDaily", 429);
        const img = String(body.img || "");
        if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(img) || img.length > ART_MAX_BYTES * 1.37) return err("artBig", 400);
        const title = clean(body.title, 30);
        const ts = Date.now();
        const id = `${ts.toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
        const e = { id, uid: user.id, name: me.nickname || "?", role: me.role, avatar: me.avatar, title, ts, likes: [] };
        await as.set("i/" + id, img);
        let idx = await loadIdx();
        idx.push(e);
        let drop = [];
        if (idx.length > ART_MAX) { idx.sort((a, b) => b.ts - a.ts); drop = idx.slice(ART_MAX); idx = idx.slice(0, ART_MAX); }
        await as.setJSON("idx", idx);
        for (const d of drop) { try { await as.delete("i/" + d.id); } catch {} }
        let gained = 0;
        if (user.artDay !== today) { user.artDay = today; user.artCount = 0; }
        if ((user.artCount | 0) === 0 && user.artCoinDay !== today) { gained = ART_COINS; user.coins = (user.coins | 0) + ART_COINS; user.artCoinDay = today; }
        user.artCount = (user.artCount | 0) + 1;
        await saveUser();
        return json({ item: view(e), left: artLeft(), gained, user: publicUser(user) });
      }
      if (route === "art/like" && method === "POST") {
        const idx = await loadIdx();
        const e = idx.find((x) => x.id === body.id);
        if (!e) return err("notfound", 404);
        e.likes = e.likes || [];
        if (e.likes.includes(user.id)) e.likes = e.likes.filter((u) => u !== user.id); else e.likes.push(user.id);
        await as.setJSON("idx", idx);
        return json({ item: view(e) });
      }
      if (route === "art" && method === "DELETE") {
        const id = url.searchParams.get("id") || "";
        const idx = await loadIdx();
        const e = idx.find((x) => x.id === id);
        if (!e) return json({ ok: true });
        if (e.uid !== user.id && !isStaff(me.role)) return err("forbidden", 403); // 그린 사람 · 호스트 · 관리자만
        await as.setJSON("idx", idx.filter((x) => x.id !== id));
        try { await as.delete("i/" + id); } catch {}
        return json({ ok: true });
      }
    }

    // ---------- 🛠 관리자: 회원관리 ----------
    if (route.startsWith("admin/")) {
      if (!isStaff(me.role)) return err("forbidden", 403);
      const us = store("jl-users");
      const allUsers = async () => {
        const { blobs } = await us.list({ prefix: "u/" });
        return (await Promise.all(blobs.map((b) => us.get(b.key, { type: "json" }).then((u) => u && { ...u, _key: b.key })))).filter(Boolean);
      };
      const ms = store("jl-mail");
      const sendMail = async (id, m) => { const k = "box/" + id; const box = (await ms.get(k, { type: "json" })) || []; box.unshift(m); await ms.setJSON(k, box.slice(0, MAIL_MAX)); };
      if (route === "admin/users" && method === "GET") {
        const list = (await allUsers()).map((u) => ({ id: u.id, email: u.email, nickname: u.nickname || "", avatar: u.avatar || null, role: roleOf(u.email), coins: u.coins | 0, createdAt: u.createdAt || 0, best: u.best | 0, bestUp: u.bestUp | 0 }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        return json({ users: list });
      }
      if (route === "admin/mail" && method === "POST") {
        const text = String(body.text || "").replace(/\r/g, "").replace(/[\u0000-\u0009\u000b-\u001f]/g, "").trim().slice(0, 500);
        if (!text) return err("msg");
        const m = { ts: Date.now(), from: me.nickname || "관리자", fromRole: me.role, text, read: false, all: body.to === "all" };
        if (body.to === "all") {
          const list = await allUsers();
          for (let i = 0; i < list.length; i += 20) await Promise.all(list.slice(i, i + 20).map((u) => sendMail(u.id, m)));
          try { await sendPush(null, "mail", { from: m.from, text }, user.id); } catch {}
          return json({ ok: true, sent: list.length });
        }
        const target = (await allUsers()).find((u) => u.id === body.to);
        if (!target) return err("notfound", 404);
        await sendMail(target.id, m);
        try { await sendPush([target.id], "mail", { from: m.from, text }); } catch {}
        return json({ ok: true, sent: 1 });
      }
      // 🪙 코인 지급·회수·설정 (관리자 본인 포함 누구에게나)
      if (route === "admin/coins" && method === "POST") {
        const target = (await allUsers()).find((u) => u.id === body.id);
        if (!target) return err("notfound", 404);
        const amt = Math.floor(+body.amount || 0), mode = body.mode === "set" ? "set" : "add";
        if (!Number.isFinite(amt)) return err("msg");
        const before = target.coins | 0;
        let after = mode === "set" ? amt : before + amt;
        after = Math.max(0, Math.min(100000000, after));
        const tk = target._key; delete target._key;
        target.coins = after;
        if (roleOf(target.email) === "artist") target.coins = Math.max(1000000, after);
        await us.setJSON(tk, target);
        const diff = target.coins - before;
        if (diff > 0 && target.id !== user.id) { try { await sendMail(target.id, { ts: Date.now(), from: me.nickname || "관리자", fromRole: me.role, text: `🎁 젤리코인 ${diff.toLocaleString()}개를 선물로 받았어요!`, read: false, gift: diff }); await sendPush([target.id], "mail", { from: me.nickname || "관리자", text: `🎁 젤리코인 ${diff.toLocaleString()}개를 선물로 받았어요!` }); } catch {} }
        if (target.id === user.id) user.coins = target.coins;
        return json({ ok: true, id: target.id, coins: target.coins, diff, user: target.id === user.id ? publicUser(target) : undefined });
      }
      // 🏆 랭킹 기록 직접 수정/삭제 {game:"jump"|"up", id, m, mode?:"remove"}
      if (route === "admin/rank" && method === "POST") {
        const GK = { jump: { top: "top", best: "best" }, up: { top: "top_up", best: "bestUp" } }[body.game];
        if (!GK) return err("msg");
        const target = (await allUsers()).find((u) => u.id === body.id);
        if (!target) return err("notfound", 404);
        const m = body.mode === "remove" ? 0 : Math.floor(+body.m || 0);
        if (!Number.isFinite(m) || m < 0 || m > 100000000) return err("msg");
        const tk = target._key; delete target._key;
        target[GK.best] = m;
        await us.setJSON(tk, target);
        if (target.id === user.id) user[GK.best] = m;
        const gs3 = store("jl-game");
        let top = (await gs3.get(GK.top, { type: "json" })) || [];
        const old = top.find((e) => e.id === target.id);
        top = top.filter((e) => e.id !== target.id);
        if (m > 0) top.push({ id: target.id, name: target.nickname || "?", avatar: target.avatar || null, role: roleOf(target.email), m, ts: old ? old.ts : Date.now() });
        top.sort((a, b) => b.m - a.m || a.ts - b.ts);
        top = top.slice(0, 10);
        await gs3.setJSON(GK.top, top);
        return json({ ok: true, id: target.id, game: body.game, m, rank: top.findIndex((e) => e.id === target.id) + 1, top });
      }
      if (route === "admin/delete" && method === "POST") {
        const target = (await allUsers()).find((u) => u.id === body.id);
        if (!target) return err("notfound", 404);
        if (isStaff(roleOf(target.email))) return err("forbidden", 403); // 관리자 계정은 탈퇴시킬 수 없음
        await us.delete(target._key);
        const cfg = store("jl-config");
        const del = (await cfg.get("deleted", { type: "json" })) || [];
        if (!del.includes(target.id)) { del.push(target.id); await cfg.setJSON("deleted", del.slice(-2000)); }
        await deletedIds(true);
        try { await ms.delete("box/" + target.id); } catch {}
        try {
          const gs2 = store("jl-game");
          for (const k of ["top", "top_up"]) { const top = (await gs2.get(k, { type: "json" })) || []; if (top.some((e) => e.id === target.id)) await gs2.setJSON(k, top.filter((e) => e.id !== target.id)); }
        } catch {}
        // 접속 중이면 광장/라운지에서 바로 사라지게
        try {
          const ps = store("jl-presence");
          for (const r of ROOMS) { const cur = (await ps.get("room/" + r, { type: "json" })) || {}; if (cur[target.id]) { delete cur[target.id]; await ps.setJSON("room/" + r, cur); } }
        } catch {}
        return json({ ok: true });
      }
    }

    // ---------- 접속자 위치 공유 ----------
    if (route === "presence" && method === "POST") {
      const ps = store("jl-presence");
      const scene = ROOMS.includes(body.scene) ? body.scene : "plaza";
      const now = Date.now();
      await ps.setJSON("p/" + user.id, {
        id: user.id, name: me.nickname, avatar: me.avatar, role: me.role, lang: me.lang, scene,
        x: +body.x || 0, y: +body.y || 0, dir: clean(body.dir, 5), moving: !!body.moving, ts: now,
      });
      const { blobs } = await ps.list({ prefix: "p/" });
      const all = await Promise.all(blobs.map((b) => ps.get(b.key, { type: "json" }).then((v) => [b.key, v])));
      const others = [];
      for (const [key, p] of all) {
        if (!p) continue;
        if (now - p.ts > 60000) { ps.delete(key).catch(() => {}); continue; }
        if (now - p.ts < 12000 && p.id !== user.id && p.scene === scene) others.push(p);
      }
      const online = all.filter(([, p]) => p && now - p.ts < 12000).length;
      return json({ others, online });
    }

    // ---------- 방명록 (팬 라운지) ----------
    if (route === "guestbook") {
      const gs = store("jl-guestbook");
      if (method === "GET") {
        const { blobs } = await gs.list({ prefix: "g/" });
        const keys = blobs.map((b) => b.key).sort().reverse();
        const page = Math.max(0, +url.searchParams.get("page") || 0);
        const slice = keys.slice(page * 20, page * 20 + 20);
        const entries = (await Promise.all(slice.map((k) => gs.get(k, { type: "json" }).then((e) => e && { ...e, key: k })))).filter(Boolean);
        return json({ entries, total: keys.length });
      }
      if (method === "POST") {
        const text = String(body.text || "").replace(/\r/g, "").replace(/[\u0000-\u0009\u000b-\u001f]/g, "").trim().slice(0, 300).replace(/\n{3,}/g, "\n\n");
        if (!text) return err("msg");
        const lastKey = "u/" + user.id;
        const ts = Date.now();
        const today = kstDay(ts);
        if (!isStaff(me.role) && user.gbLastDay === today) return err("gbDaily", 429); // 하루에 1개만
        const last = +(await gs.get(lastKey)) || 0;
        if (ts - last < 30000) return err("slow", 429); // 관리자도 30초에 한 번
        const key = `g/${String(ts).padStart(15, "0")}-${crypto.randomBytes(3).toString("hex")}`;
        const e = { id: user.id, name: me.nickname || "?", role: me.role, avatar: me.avatar, text, ts };
        // 방명록 작성 보상: 50코인 (하루 1번)
        let coins = 0;
        if (user.gbLastDay !== today) { user.gbLastDay = today; user.coins = (user.coins | 0) + GB_COINS; coins = GB_COINS; }
        await Promise.all([gs.setJSON(key, e), gs.set(lastKey, String(ts)), saveUser()]);
        return json({ entry: { ...e, key }, coins, user: publicUser(user) });
      }
      if (method === "DELETE") {
        const key = url.searchParams.get("key") || "";
        if (!key.startsWith("g/")) return err("forbidden", 400);
        const e = await gs.get(key, { type: "json" });
        if (!e) return json({ ok: true });
        if (!isStaff(me.role) && e.id !== user.id) return err("forbidden", 403); // 본인 글 또는 관리자만 삭제
        await gs.delete(key);
        return json({ ok: true });
      }
    }

    // ---------- 채팅 (광장 / 팬 라운지) ----------
    if (route === "chat") {
      const cs = store("jl-chat");
      const room = ROOMS.includes(url.searchParams.get("room") || body.room) ? (url.searchParams.get("room") || body.room) : "lounge";
      if (method === "GET") {
        const since = +url.searchParams.get("since") || 0;
        const { blobs } = await cs.list({ prefix: `m/${room}/` });
        const keys = blobs.map((b) => b.key).sort().slice(-50);
        // since 이후 메시지만 가져옴 (키에 시간이 들어 있음)
        const fresh = keys.filter((k) => keyTs(k) >= since && keyTs(k) > Date.now() - CHAT_TTL); // 5분 지난 메시지는 제외
        const msgs = (await Promise.all(fresh.map((k) => cs.get(k, { type: "json" }).then((m) => m && { ...m, key: k })))).filter(Boolean);
        const notice = await cs.get(`notice/${room}`, { type: "json" });
        return json({ messages: msgs, notice: notice || null });
      }
      if (method === "POST") {
        const text = clean(body.text, 200);
        if (!text) return err("msg");
        const { lang, tr } = await translateAll(text);
        if (body.notice) {
          if (!isStaff(me.role)) return err("notice", 403);
          const n = { text, lang, tr, ts: Date.now(), name: me.nickname };
          await cs.setJSON(`notice/${room}`, n);
          const lst = (await cs.get("last/" + room, { type: "json" })) || {};
          await cs.setJSON("last/" + room, { ts: Math.max(lst.ts || 0, n.ts), notice: n });
          return json({ notice: n });
        }
        const ts = Date.now();
        const key = `m/${room}/${String(ts).padStart(15, "0")}-${crypto.randomBytes(3).toString("hex")}`;
        const m = { id: user.id, name: me.nickname || "?", role: me.role, text, lang, tr, ts };
        await cs.setJSON(key, m);
        // 5분 지난 메시지 정리 (저장 공간 절약)
        try {
          const { blobs } = await cs.list({ prefix: `m/${room}/` });
          const old = blobs.map((b) => b.key).filter((k) => keyTs(k) < ts - CHAT_TTL).slice(0, 30);
          await Promise.all(old.map((k) => cs.delete(k)));
        } catch {}
        const lst = (await cs.get("last/" + room, { type: "json" })) || {};
        await cs.setJSON("last/" + room, { ts, notice: lst.notice || null });
        return json({ message: { ...m, key } });
      }
      if (method === "DELETE") {
        if (!isStaff(me.role)) return err("forbidden", 403);
        const key = url.searchParams.get("key") || "";
        if (key.startsWith("notice/")) {
          await cs.delete(key);
          const r = key.split("/")[1];
          const lst = (await cs.get("last/" + r, { type: "json" })) || {};
          await cs.setJSON("last/" + r, { ts: lst.ts || 0, notice: null });
          return json({ ok: true });
        }
        if (!key.startsWith("m/")) return err("forbidden", 400);
        await cs.delete(key);
        return json({ ok: true });
      }
    }
    return err("notfound", 404);
  } catch (e) {
    console.error(e);
    return err("server", 500);
  }
};

export const config = { path: "/api/*" };
