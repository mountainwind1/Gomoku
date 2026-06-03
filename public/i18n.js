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
  },
};

// Native display name for each language (shown in the menu)
const LANG_NAMES = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ms: 'Bahasa Melayu',
  vi: 'Tiếng Việt',
  th: 'ภาษาไทย',
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

  // Update the dropdown button label
  const labelEl = document.getElementById('lang-label');
  if (labelEl) labelEl.textContent = LANG_NAMES[lang];

  // Mark active item in menu
  document.querySelectorAll('#lang-menu [data-lang]').forEach(li => {
    li.classList.toggle('active', li.dataset.lang === lang);
  });

  // Update all static data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  document.dispatchEvent(new CustomEvent('langchange'));
}

// ── Dropdown wiring ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const switcher = document.getElementById('lang-switcher');
  const langBtn  = document.getElementById('lang-btn');
  const langMenu = document.getElementById('lang-menu');

  function openMenu() {
    langMenu.hidden = false;
    switcher.classList.add('open');
    langBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    langMenu.hidden = true;
    switcher.classList.remove('open');
    langBtn.setAttribute('aria-expanded', 'false');
  }

  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langMenu.hidden ? openMenu() : closeMenu();
  });

  langMenu.addEventListener('click', (e) => {
    const li = e.target.closest('[data-lang]');
    if (!li) return;
    applyLanguage(li.dataset.lang);
    closeMenu();
  });

  // Close on outside click or Escape
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  applyLanguage(currentLang);
});
