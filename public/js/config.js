/* =========================================================
   JELLY LAND 콘텐츠 설정 파일
   - 이 파일만 수정하면 게임 속 프로필/사진/앨범/영상이 바뀝니다.
   - 글자는 { ko: "한국어", en: "English", ja: "日本語" } 형태로 쓰면
     사용자가 고른 언어로 보여요. 그냥 "글자"만 써도 돼요(모든 언어에서 똑같이 보임).
   - 사진은 public/img/photos/ 폴더에 넣고 경로를 적어주세요.
   ========================================================= */
window.JELLY_CONFIG = {
  // ⚡ 실시간 위치 서버 (Cloudflare Workers) 주소. 비워 두면 예전 방식(조금 늦게 보임)으로 동작해요.
  realtimeUrl: "",

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
    // 2026.10 새 프로필 사진 (isNew: 갤러리에 NEW 표시)
    { src: "img/photos/jojelly-06.jpg", isNew: true, caption: { ko: "새 프로필 · 화이트 리본", en: "New Profile · White Ribbon", ja: "新プロフィール · ホワイトリボン" } },
    { src: "img/photos/jojelly-08.jpg", isNew: true, caption: { ko: "새 프로필 · 블랙", en: "New Profile · Black", ja: "新プロフィール · ブラック" } },
    { src: "img/photos/jojelly-07.jpg", isNew: true, caption: { ko: "새 프로필 · 스튜디오", en: "New Profile · Studio", ja: "新プロフィール · スタジオ" } },
    { src: "img/photos/jojelly-09.jpg", isNew: true, caption: { ko: "새 프로필 · 화이트 리본 2", en: "New Profile · White Ribbon 2", ja: "新プロフィール · ホワイトリボン 2" } },
    { src: "img/photos/jojelly-10.jpg", isNew: true, caption: { ko: "새 프로필 · 블랙 2", en: "New Profile · Black 2", ja: "新プロフィール · ブラック 2" } },
    { src: "img/photos/jojelly-01.jpg", caption: { ko: "프로필 · 퍼플", en: "Profile · Purple", ja: "プロフィール · パープル" } },
    { src: "img/photos/jojelly-04.jpg", caption: { ko: "프로필 · 퍼플 2", en: "Profile · Purple 2", ja: "プロフィール · パープル 2" } },
    { src: "img/photos/jojelly-05.jpg", caption: { ko: "프로필 · 퍼플 3", en: "Profile · Purple 3", ja: "プロフィール · パープル 3" } },
    { src: "img/photos/jojelly-02.jpg", caption: { ko: "프로필 · 샹들리에", en: "Profile · Chandelier", ja: "プロフィール · シャンデリア" } },
    { src: "img/photos/jojelly-03.jpg", caption: { ko: "프로필 · 앤티크 룸", en: "Profile · Antique Room", ja: "プロフィール · アンティークルーム" } },
  ],

  // 🎬 접속할 때마다 띄우는 영상 팝업 — until(한국시간)까지만 보임 · video: 위 videos 의 번호
  promo: {
    id: "dontstop-teaser",
    video: 0,
    until: "2026-11-07T18:00:00+09:00",
    title: { ko: "🎬 Jo Jelly 'Don't Stop' 티저 공개!", en: "🎬 Jo Jelly 'Don't Stop' Teaser!", ja: "🎬 Jo Jelly 『Don't Stop』ティザー公開！" },
    text: { ko: "새 티저 영상이 공개되었어요! 지금 바로 감상해 보세요 ♪", en: "A new teaser is out! Watch it now ♪", ja: "新しいティザー映像が公開されました！今すぐチェックしてね ♪" },
  },

  // 📢 로그인할 때 한 번 띄우는 공지 (id 를 바꾸면 새 공지로 다시 한 번 보여 줌) — go: 버튼을 누르면 갈 곳
  announce: {
    id: "photos-2026-10",
    go: "gallery",
    text: { ko: "\"Jo Jelly\"의 새로운 프로필 사진이 공개되었습니다! 포토갤러리로 가서 확인해보세요!", en: "New profile photos of \"Jo Jelly\" have been released! Head to the Photo Gallery to check them out!", ja: "「Jo Jelly」の新しいプロフィール写真が公開されました！フォトギャラリーでチェックしてね！" },
  },

  // 앨범 기록관 — 최신 순으로 위에 추가하세요
  albums: [
    {
      title: "Can't Stop! (feat. Larnell Lewis, Johannes Groth, Justin Raines)",
      year: "2026",
      date: "2026.04.22",
      type: { ko: "싱글", en: "Single", ja: "シングル" },
      genre: { ko: "재즈", en: "Jazz", ja: "ジャズ" },
      label: "3.14",
      agency: "조우리",
      cover: "img/albums/cant-stop.jpg",
      desc: {
        ko: "재즈 피아니스트 조젤리!\n30만 팔로워 조젤리!\n멈출 수 없어! 조젤리!\n\n독보적인 재즈 펑크 사운드의 곡 Can't Stop! 은 앞으로의 조젤리 음악 행보를 알리는 첫 시작이다!!\n그녀의 펑키한 피아노와 키치한 매력은 도저히 멈출 수 없어 많은 이들에게 주목받고 있다!\n이토록 대단한 조젤리의 매력을 느끼기라도 한 듯 밴드 \"Snarky Puppy\"의 드러머이자 세계적인 아티스트 \"Larnell Lewis\"가 함께 연주해 주었다.....!! 대 박 사 건!!\n\n이 멋진 곡을 듣는다면 당신도 그녀의 매력에 빠져 그녀를 팔로잉 하는 것을 멈출 수 없을 것입니다!!",
        en: "Jazz pianist Jo Jelly!\nJo Jelly with 300K followers!\nCan't stop! Jo Jelly!\n\n\"Can't Stop!\", a track with a one-of-a-kind jazz-funk sound, is the very first step announcing Jo Jelly's musical journey ahead!!\nHer funky piano and kitschy charm simply can't be stopped, and people everywhere are taking notice!\nAs if he felt Jo Jelly's amazing charm, world-class artist Larnell Lewis — drummer of the band \"Snarky Puppy\" — joined in on the track.....!! What a huge moment!!\n\nOnce you hear this wonderful song, you'll fall for her charm too — and you won't be able to stop following her!!",
        ja: "ジャズピアニスト Jo Jelly！\nフォロワー30万人の Jo Jelly！\n止まらない！Jo Jelly！\n\n唯一無二のジャズファンクサウンドの曲「Can't Stop!」は、これからの Jo Jelly の音楽活動を告げる最初の一歩！！\n彼女のファンキーなピアノとキッチュな魅力はもう止められず、多くの人から注目を集めています！\nそんな Jo Jelly の魅力を感じ取ったかのように、バンド「Snarky Puppy」のドラマーで世界的アーティストの Larnell Lewis が一緒に演奏してくれました.....!! 大事件です！！\n\nこの素敵な曲を聴けば、あなたも彼女の魅力にハマって、フォローするのが止められなくなるはず！！",
      },
      tracks: ["Can't Stop! (feat. Larnell Lewis, Johannes Groth, Justin Raines)"],
      credits: [
        ["Piano", "Jo Jelly"], ["Drum", "Larnell Lewis"], ["Bass", "Justin Raines"], ["Guitar", "Johannes Groth"],
        ["Organ", "Johannes Groth"], ["Percussion", "조한샘 (Hansam Cho)"], ["Arranged", "Jo Jelly"], ["Mixed", "Johannes Groth"],
        ["Mastered", "Thomas Berg"], ["Design Artwork", "Tape Piano"], ["Video director", "Dody"], ["A&R / Management", "Dody"],
      ],
      link: "https://www.youtube.com/watch?v=Y8aVeGVmZ8U",
    },
  ],

  // 젤리 시네마 — YouTube 영상 ID (주소의 v= 뒤 11자리) 또는 직접 올린 영상 파일(file + poster)
  videos: [
    { file: "video/dontstop-teaser.mp4", poster: "img/videos/dontstop-teaser.jpg", isNew: true, title: { ko: "Don't Stop - 티저", en: "Don't Stop - Teaser", ja: "Don't Stop - ティザー" } },
    { id: "Y8aVeGVmZ8U", title: "Can't Stop! - Jo Jelly Live Session Clip. 1" },
    { id: "VwYQ7LHTiS4", title: "NORD LIVE: Seoul Sessions - Don't stop" },
    { id: "B3D7DS_C-Hg", title: "NORD LIVE: Seoul Sessions: Jo Jelly" },
  ],
};
