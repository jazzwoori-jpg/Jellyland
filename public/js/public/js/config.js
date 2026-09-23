/* =========================================================
   JELLY LAND 콘텐츠 설정 파일
   - 이 파일만 수정하면 게임 속 프로필/사진/앨범/영상이 바뀝니다.
   - 글자는 { ko: "한국어", en: "English", ja: "日本語" } 형태로 쓰면
     사용자가 고른 언어로 보여요. 그냥 "글자"만 써도 돼요(모든 언어에서 똑같이 보임).
   - 사진은 public/img/photos/ 폴더에 넣고 경로를 적어주세요.
   ========================================================= */
window.JELLY_CONFIG = {
  artist: {
    name: { ko: "조젤리", en: "Jo Jelly", ja: "Jo Jelly" },
    nameEn: { ko: "Jo Jelly", en: "조젤리", ja: "조젤리" },
    title: { ko: "피아니스트 · 키보디스트", en: "Pianist · Keyboardist", ja: "ピアニスト · キーボーディスト" },
    // 프로필 대표 사진
    photo: "img/photos/jojelly-01.jpg",
    bio: [
      {
        ko: "안녕하세요, 피아니스트 조젤리(Jo Jelly)입니다.",
        en: "Hi, I'm Jo Jelly, a pianist.",
        ja: "こんにちは、ピアニストの Jo Jelly（조젤리）です。",
      },
      {
        ko: "JELLY LAND에 오신 걸 환영해요! 광장을 자유롭게 돌아다니며 사진, 앨범, 영상을 구경하고 팬 라운지에서 함께 이야기 나눠요.",
        en: "Welcome to JELLY LAND! Wander around the plaza, check out photos, albums and videos, and come chat with me in the Fan Lounge.",
        ja: "JELLY LAND へようこそ！広場を自由に歩き回って、写真・アルバム・動画を楽しんだら、ファンラウンジで一緒にお話ししましょう。",
      },
    ],
    links: [
      { label: "YouTube", url: "https://www.youtube.com/@Jo_Jelly" },
      { label: "Instagram", url: "https://www.instagram.com/j0jelly/" },
      { label: "Threads", url: "https://www.threads.com/@j0jelly" },
    ],
  },

  // 포토 갤러리 — src: 이미지 경로, caption: 설명
  photos: [
    { src: "img/photos/jojelly-01.jpg", caption: { ko: "프로필 · 퍼플", en: "Profile · Purple", ja: "プロフィール · パープル" } },
    { src: "img/photos/jojelly-04.jpg", caption: { ko: "프로필 · 퍼플 2", en: "Profile · Purple 2", ja: "プロフィール · パープル 2" } },
    { src: "img/photos/jojelly-05.jpg", caption: { ko: "프로필 · 퍼플 3", en: "Profile · Purple 3", ja: "プロフィール · パープル 3" } },
    { src: "img/photos/jojelly-02.jpg", caption: { ko: "프로필 · 샹들리에", en: "Profile · Chandelier", ja: "プロフィール · シャンデリア" } },
    { src: "img/photos/jojelly-03.jpg", caption: { ko: "프로필 · 앤티크 룸", en: "Profile · Antique Room", ja: "プロフィール · アンティークルーム" } },
  ],

  // 앨범 기록관 — 최신 순 (아래는 예시 데이터예요. 실제 정보로 바꿔주세요)
  albums: [
    {
      title: { ko: "앨범 제목을 입력하세요", en: "Album title", ja: "アルバムタイトル" },
      year: "2026",
      type: "EP",
      cover: "img/photos/album1.svg",
      desc: { ko: "앨범 소개 문구를 입력하세요.", en: "Album description.", ja: "アルバム紹介文。" },
      tracks: ["Track 1", "Track 2", "Track 3"],
      link: "",
    },
    {
      title: { ko: "싱글 제목을 입력하세요", en: "Single title", ja: "シングルタイトル" },
      year: "2025",
      type: "Single",
      cover: "img/photos/album2.svg",
      desc: { ko: "싱글 소개 문구를 입력하세요.", en: "Single description.", ja: "シングル紹介文。" },
      tracks: ["Track 1"],
      link: "",
    },
    {
      title: { ko: "첫 번째 앨범", en: "First Album", ja: "ファーストアルバム" },
      year: "2024",
      type: "Album",
      cover: "img/photos/album3.svg",
      desc: { ko: "데뷔 앨범 소개 문구를 입력하세요.", en: "Debut album description.", ja: "デビューアルバム紹介文。" },
      tracks: ["Track 1", "Track 2", "Track 3", "Track 4"],
      link: "",
    },
  ],

  // 젤리 시네마 — YouTube 영상 ID (주소의 v= 뒤 11자리)
  videos: [
    { id: "Y8aVeGVmZ8U", title: "Can't Stop! - Jo Jelly Live Session Clip. 1" },
    { id: "VwYQ7LHTiS4", title: "NORD LIVE: Seoul Sessions - Don't stop" },
    { id: "B3D7DS_C-Hg", title: "NORD LIVE: Seoul Sessions: Jo Jelly" },
  ],
};
