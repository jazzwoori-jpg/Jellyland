/* =========================================================
   JELLY LAND 콘텐츠 설정 파일
   - 이 파일만 수정하면 게임 속 프로필/사진/앨범/영상이 바뀝니다.
   - 사진은 public/img/photos/ 폴더에 넣고 경로를 적어주세요.
   ========================================================= */
window.JELLY_CONFIG = {
  artist: {
    name: "조젤리",
    nameEn: "Jo Jelly",
    title: "Pianist · Keyboardist",
    // 프로필 대표 사진 (정사각형 권장)
    photo: "img/photos/profile.svg",
    bio: [
      "안녕하세요, 피아니스트 조젤리(Jo Jelly)입니다.",
      "JELLY LAND에 오신 걸 환영해요! 광장을 자유롭게 돌아다니며 사진, 앨범, 영상을 구경하고 팬 라운지에서 함께 이야기 나눠요.",
      "(이 소개글은 public/js/config.js 에서 수정할 수 있어요)",
    ],
    links: [
      { label: "YouTube", url: "https://www.youtube.com/@Jo_Jelly" },
      { label: "Instagram", url: "https://www.instagram.com/j0jelly/" },
      { label: "Threads", url: "https://www.threads.com/@j0jelly" },
    ],
  },

  // 포토 갤러리 — src: 이미지 경로, caption: 설명
  photos: [
    { src: "img/photos/photo1.svg", caption: "프로필 사진 #1" },
    { src: "img/photos/photo2.svg", caption: "프로필 사진 #2" },
    { src: "img/photos/photo3.svg", caption: "라이브 현장" },
    { src: "img/photos/photo4.svg", caption: "스튜디오에서" },
    { src: "img/photos/photo5.svg", caption: "무대 뒤에서" },
    { src: "img/photos/photo6.svg", caption: "공연 포스터" },
  ],

  // 앨범 기록관 — 최신 순으로 적어주세요 (아래는 예시 데이터입니다)
  albums: [
    {
      title: "앨범 제목을 입력하세요",
      year: "2026",
      type: "EP",
      cover: "img/photos/album1.svg",
      desc: "앨범 소개 문구를 입력하세요.",
      tracks: ["Track 1", "Track 2", "Track 3"],
      link: "",
    },
    {
      title: "싱글 제목을 입력하세요",
      year: "2025",
      type: "Single",
      cover: "img/photos/album2.svg",
      desc: "싱글 소개 문구를 입력하세요.",
      tracks: ["Track 1"],
      link: "",
    },
    {
      title: "첫 번째 앨범",
      year: "2024",
      type: "Album",
      cover: "img/photos/album3.svg",
      desc: "데뷔 앨범 소개 문구를 입력하세요.",
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
