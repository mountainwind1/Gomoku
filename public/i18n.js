const TRANSLATIONS = {
  zh: {
    title:              '五子棋',
    findGame:           '开始对局',
    playAgain:          '再来一局',
    initialStatus:      '点击"开始对局"寻找对手',
    connected:          '已连接',
    disconnected:       '未连接',
    searching:          '正在寻找对手…',
    waiting:            '等待另一位玩家加入…',
    blackFirst:         '执黑先行',
    whiteSecond:        '执白后行',
    yourTurn:           '轮到你落子！',
    opponentTurnBlack:  '等待对手（黑棋）落子…',
    opponentTurn:       '等待对手落子…',
    forbidden:          '禁手：{reason}，请重新落子',
    overline:           '长连禁手',
    doubleFour:         '四四禁手',
    doubleThree:        '三三禁手',
    draw:               '平局！',
    win:                '你赢了！🎉',
    lose:               '你输了。',
    opponentLeft:       '对手已断线，游戏结束。',
    welcomeTitle:       '欢迎来到五子棋',
    welcomeBack:        '欢迎回来，{name}！',
    enterName:          '请输入你的名字',
    namePlaceholder:    '你的名字（最多 20 字符）',
    confirm:            '确认',
    continueAs:         '继续',
    newUser:            '新建用户',
    onlineCount:        '在线 {n} 人',
    onlineList:         '在线玩家',
    statusIdle:         '空闲',
    statusWaiting:      '等待中',
    statusInGame:       '对局中',
    randomMatch:        '随机匹配',
    challengePlayer:    '挑战玩家',
    chooseOpponent:     '选择对手',
    noIdlePlayers:      '暂无空闲玩家',
    challengeSent:      '已向 {name} 发起挑战，等待回应…',
    cancelChallenge:    '取消挑战',
    incomingChallenge:  '{name} 向你发起挑战！',
    accept:             '接受',
    decline:            '拒绝',
    challengeDeclined:  '{name} 拒绝了挑战',
    challengeCancelled: '{name} 取消了挑战',
    challenge:          '挑战',
  },
  en: {
    title:              'Gomoku',
    findGame:           'Find Game',
    playAgain:          'Play Again',
    initialStatus:      'Click "Find Game" to start',
    connected:          'Connected',
    disconnected:       'Disconnected',
    searching:          'Searching for opponent…',
    waiting:            'Waiting for another player…',
    blackFirst:         'Playing Black (First)',
    whiteSecond:        'Playing White (Second)',
    yourTurn:           'Your turn!',
    opponentTurnBlack:  'Waiting for opponent (Black)…',
    opponentTurn:       'Waiting for opponent…',
    forbidden:          'Forbidden: {reason} — try again',
    overline:           'Overline',
    doubleFour:         'Double Four',
    doubleThree:        'Double Three',
    draw:               "It's a draw!",
    win:                'You win! 🎉',
    lose:               'You lose.',
    opponentLeft:       'Opponent disconnected. Game over.',
    welcomeTitle:       'Welcome to Gomoku',
    welcomeBack:        'Welcome back, {name}!',
    enterName:          'Enter your name',
    namePlaceholder:    'Your name (max 20 chars)',
    confirm:            'Confirm',
    continueAs:         'Continue',
    newUser:            'New User',
    onlineCount:        '{n} online',
    onlineList:         'Online Players',
    statusIdle:         'Idle',
    statusWaiting:      'Waiting',
    statusInGame:       'In Game',
    randomMatch:        'Random Match',
    challengePlayer:    'Challenge',
    chooseOpponent:     'Choose Opponent',
    noIdlePlayers:      'No idle players',
    challengeSent:      'Challenge sent to {name}…',
    cancelChallenge:    'Cancel',
    incomingChallenge:  '{name} challenges you!',
    accept:             'Accept',
    decline:            'Decline',
    challengeDeclined:  '{name} declined',
    challengeCancelled: '{name} cancelled',
    challenge:          'Challenge',
  },
  ja: {
    title:              '五目並べ',
    findGame:           '対局開始',
    playAgain:          'もう一局',
    initialStatus:      '「対局開始」を押して対戦相手を探す',
    connected:          '接続済み',
    disconnected:       '未接続',
    searching:          '対戦相手を探しています…',
    waiting:            '他のプレイヤーを待っています…',
    blackFirst:         '黒番（先手）',
    whiteSecond:        '白番（後手）',
    yourTurn:           'あなたの番です！',
    opponentTurnBlack:  '相手（黒）の番を待っています…',
    opponentTurn:       '相手の番を待っています…',
    forbidden:          '禁手：{reason} — やり直してください',
    overline:           '長連',
    doubleFour:         '四四',
    doubleThree:        '三三',
    draw:               '引き分け！',
    win:                'あなたの勝ちです！🎉',
    lose:               '負けました。',
    opponentLeft:       '相手が切断しました。ゲーム終了。',
    welcomeTitle:       '五目並べへようこそ',
    welcomeBack:        'おかえり、{name}さん！',
    enterName:          '名前を入力してください',
    namePlaceholder:    '名前（最大20文字）',
    confirm:            '確認',
    continueAs:         '続ける',
    newUser:            '新しいユーザー',
    onlineCount:        '{n}人オンライン',
    onlineList:         'オンラインプレイヤー',
    statusIdle:         '待機中',
    statusWaiting:      'マッチング中',
    statusInGame:       '対局中',
    randomMatch:        'ランダムマッチ',
    challengePlayer:    '挑戦する',
    chooseOpponent:     '対戦相手を選ぶ',
    noIdlePlayers:      '空きプレイヤーなし',
    challengeSent:      '{name}に挑戦しました…',
    cancelChallenge:    'キャンセル',
    incomingChallenge:  '{name}があなたに挑戦！',
    accept:             '受ける',
    decline:            '断る',
    challengeDeclined:  '{name}が断りました',
    challengeCancelled: '{name}がキャンセルしました',
    challenge:          '挑戦',
  },
  ms: {
    title:              'Gomoku',
    findGame:           'Cari Permainan',
    playAgain:          'Main Semula',
    initialStatus:      'Klik "Cari Permainan" untuk bermula',
    connected:          'Disambung',
    disconnected:       'Terputus',
    searching:          'Mencari lawan…',
    waiting:            'Menunggu pemain lain…',
    blackFirst:         'Main Hitam (Pertama)',
    whiteSecond:        'Main Putih (Kedua)',
    yourTurn:           'Giliran anda!',
    opponentTurnBlack:  'Menunggu lawan (Hitam)…',
    opponentTurn:       'Menunggu lawan…',
    forbidden:          'Terlarang: {reason} — cuba lagi',
    overline:           'Sambungan Lebih',
    doubleFour:         'Empat Ganda',
    doubleThree:        'Tiga Ganda',
    draw:               'Seri!',
    win:                'Anda menang! 🎉',
    lose:               'Anda kalah.',
    opponentLeft:       'Lawan terputus. Permainan tamat.',
    welcomeTitle:       'Selamat Datang ke Gomoku',
    welcomeBack:        'Selamat kembali, {name}!',
    enterName:          'Masukkan nama anda',
    namePlaceholder:    'Nama anda (maks 20 aksara)',
    confirm:            'Sahkan',
    continueAs:         'Teruskan',
    newUser:            'Pengguna Baru',
    onlineCount:        '{n} dalam talian',
    onlineList:         'Pemain Dalam Talian',
    statusIdle:         'Sedia',
    statusWaiting:      'Menunggu',
    statusInGame:       'Bermain',
    randomMatch:        'Padanan Rawak',
    challengePlayer:    'Cabar Pemain',
    chooseOpponent:     'Pilih Lawan',
    noIdlePlayers:      'Tiada pemain sedia',
    challengeSent:      'Cabaran dihantar ke {name}…',
    cancelChallenge:    'Batal',
    incomingChallenge:  '{name} mencabar anda!',
    accept:             'Terima',
    decline:            'Tolak',
    challengeDeclined:  '{name} menolak',
    challengeCancelled: '{name} membatalkan',
    challenge:          'Cabar',
  },
  vi: {
    title:              'Cờ Gomoku',
    findGame:           'Tìm Trận',
    playAgain:          'Chơi Lại',
    initialStatus:      'Nhấp "Tìm Trận" để bắt đầu',
    connected:          'Đã kết nối',
    disconnected:       'Mất kết nối',
    searching:          'Đang tìm đối thủ…',
    waiting:            'Đang chờ người chơi khác…',
    blackFirst:         'Đi quân Đen (Trước)',
    whiteSecond:        'Đi quân Trắng (Sau)',
    yourTurn:           'Đến lượt bạn!',
    opponentTurnBlack:  'Chờ đối thủ (Đen)…',
    opponentTurn:       'Chờ đối thủ…',
    forbidden:          'Cấm: {reason} — thử lại',
    overline:           'Dài quá 5',
    doubleFour:         'Tứ Tứ',
    doubleThree:        'Tam Tam',
    draw:               'Hòa!',
    win:                'Bạn thắng! 🎉',
    lose:               'Bạn thua.',
    opponentLeft:       'Đối thủ mất kết nối. Trò chơi kết thúc.',
    welcomeTitle:       'Chào mừng đến Cờ Gomoku',
    welcomeBack:        'Chào mừng trở lại, {name}!',
    enterName:          'Nhập tên của bạn',
    namePlaceholder:    'Tên của bạn (tối đa 20 ký tự)',
    confirm:            'Xác nhận',
    continueAs:         'Tiếp tục',
    newUser:            'Người dùng mới',
    onlineCount:        '{n} người trực tuyến',
    onlineList:         'Người chơi trực tuyến',
    statusIdle:         'Rảnh',
    statusWaiting:      'Đang chờ',
    statusInGame:       'Đang chơi',
    randomMatch:        'Kết Đôi Ngẫu Nhiên',
    challengePlayer:    'Thách Đấu',
    chooseOpponent:     'Chọn Đối Thủ',
    noIdlePlayers:      'Không có người chơi rảnh',
    challengeSent:      'Đã thách {name}…',
    cancelChallenge:    'Huỷ',
    incomingChallenge:  '{name} thách bạn!',
    accept:             'Chấp nhận',
    decline:            'Từ chối',
    challengeDeclined:  '{name} từ chối',
    challengeCancelled: '{name} đã huỷ',
    challenge:          'Thách',
  },
  th: {
    title:              'โกะโมกุ',
    findGame:           'หาเกม',
    playAgain:          'เล่นอีกครั้ง',
    initialStatus:      'คลิก "หาเกม" เพื่อเริ่ม',
    connected:          'เชื่อมต่อแล้ว',
    disconnected:       'ไม่ได้เชื่อมต่อ',
    searching:          'กำลังหาคู่ต่อสู้…',
    waiting:            'รอผู้เล่นคนอื่น…',
    blackFirst:         'เล่นหมากดำ (ก่อน)',
    whiteSecond:        'เล่นหมากขาว (หลัง)',
    yourTurn:           'ถึงตาของคุณ!',
    opponentTurnBlack:  'รอคู่ต่อสู้ (ดำ)…',
    opponentTurn:       'รอคู่ต่อสู้…',
    forbidden:          'ต้องห้าม: {reason} — ลองใหม่',
    overline:           'เกินห้า',
    doubleFour:         'สี่คู่',
    doubleThree:        'สามคู่',
    draw:               'เสมอ!',
    win:                'คุณชนะ! 🎉',
    lose:               'คุณแพ้',
    opponentLeft:       'คู่ต่อสู้ตัดการเชื่อมต่อ เกมจบแล้ว',
    welcomeTitle:       'ยินดีต้อนรับสู่โกะโมกุ',
    welcomeBack:        'ยินดีต้อนรับกลับ, {name}!',
    enterName:          'กรุณาใส่ชื่อของคุณ',
    namePlaceholder:    'ชื่อของคุณ (สูงสุด 20 ตัวอักษร)',
    confirm:            'ยืนยัน',
    continueAs:         'ดำเนินการต่อ',
    newUser:            'ผู้ใช้ใหม่',
    onlineCount:        '{n} คนออนไลน์',
    onlineList:         'ผู้เล่นออนไลน์',
    statusIdle:         'ว่าง',
    statusWaiting:      'รอ',
    statusInGame:       'กำลังเล่น',
    randomMatch:        'จับคู่สุ่ม',
    challengePlayer:    'ท้าทายผู้เล่น',
    chooseOpponent:     'เลือกคู่ต่อสู้',
    noIdlePlayers:      'ไม่มีผู้เล่นว่าง',
    challengeSent:      'ส่งคำท้าไปยัง {name}…',
    cancelChallenge:    'ยกเลิก',
    incomingChallenge:  '{name} ท้าทายคุณ!',
    accept:             'ยอมรับ',
    decline:            'ปฏิเสธ',
    challengeDeclined:  '{name} ปฏิเสธ',
    challengeCancelled: '{name} ยกเลิก',
    challenge:          'ท้า',
  },
};

const LANG_NAMES = {
  zh: '中文', en: 'English', ja: '日本語',
  ms: 'Bahasa Melayu', vi: 'Tiếng Việt', th: 'ภาษาไทย',
};

// ── Language detection ─────────────────────────────────────
function detectLang() {
  const saved = localStorage.getItem('gomoku-lang');
  if (saved && TRANSLATIONS[saved]) return saved;
  for (const nav of (navigator.languages || [navigator.language || ''])) {
    const code = nav.toLowerCase().split('-')[0];
    if (TRANSLATIONS[code]) return code;
  }
  return 'zh';
}

let currentLang = detectLang();

// ── Translation lookup ─────────────────────────────────────
function t(key, vars = {}) {
  const map = TRANSLATIONS[currentLang] || TRANSLATIONS.zh;
  const str = map[key] ?? TRANSLATIONS.zh[key] ?? key;
  return String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// ── Apply language ─────────────────────────────────────────
function applyLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('gomoku-lang', lang);
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelector('h1').textContent = t('title');

  const labelEl = document.getElementById('lang-label');
  if (labelEl) labelEl.textContent = LANG_NAMES[lang];

  document.querySelectorAll('#lang-menu [data-lang]').forEach(li => {
    li.classList.toggle('active', li.dataset.lang === lang);
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  // Placeholder attributes
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });

  document.dispatchEvent(new CustomEvent('langchange'));
}

// ── Dropdown wiring ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const switcher = document.getElementById('lang-switcher');
  const langBtn  = document.getElementById('lang-btn');
  const langMenu = document.getElementById('lang-menu');

  function openMenu()  { langMenu.hidden = false; switcher.classList.add('open'); langBtn.setAttribute('aria-expanded','true'); }
  function closeMenu() { langMenu.hidden = true;  switcher.classList.remove('open'); langBtn.setAttribute('aria-expanded','false'); }

  langBtn.addEventListener('click', e => { e.stopPropagation(); langMenu.hidden ? openMenu() : closeMenu(); });
  langMenu.addEventListener('click', e => {
    const li = e.target.closest('[data-lang]');
    if (li) { applyLanguage(li.dataset.lang); closeMenu(); }
  });
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  applyLanguage(currentLang);
});
