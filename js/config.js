// Firebase Realtime Database REST API 기반 설정
const DB_URL = 'https://our-nation-22b63-default-rtdb.asia-southeast1.firebasedatabase.app';

const ADMIN = { id: 'ree1203', pw: 'hjklfdsa1203' };

// ===== DB 헬퍼 =====
async function dbGet(path) {
  const res = await fetch(`${DB_URL}/${path}.json`);
  if (!res.ok) throw new Error('DB 오류');
  return res.json();
}

async function dbSet(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('DB 저장 오류');
  return res.json();
}

async function dbPush(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('DB 추가 오류');
  return res.json();
}

async function dbDelete(path) {
  const res = await fetch(`${DB_URL}/${path}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error('DB 삭제 오류');
  return res.json();
}

// ===== 인증 =====
function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem('nara_user'));
  } catch { return null; }
}

function setUser(user) {
  sessionStorage.setItem('nara_user', JSON.stringify(user));
}

function logout() {
  sessionStorage.removeItem('nara_user');
  window.location.href = 'login.html';
}

function requireLogin() {
  const user = getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// ===== 나라게임 유저 로그인 (users/<uid>/password 직접 비교) =====
async function loginWithGame(uid, pw) {
  const userData = await dbGet(`users/${uid}`);
  if (!userData) return null;
  if (userData.password !== pw) return null;
  return { uid, name: uid, money: userData.money || 0, level: userData.level || 1, isAdmin: false };
}

async function registerGameUser(uid, pw) {
  const existing = await dbGet(`users/${uid}`);
  if (existing) throw new Error('이미 사용 중인 아이디입니다.');
  await dbSet(`users/${uid}`, {
    password: pw,
    money: 500000,
    health: 100,
    energy: 100,
    happy: 75,
    hunger: 80,
    level: 1,
    dayN: 1,
    angle: 0,
    gMin: 0,
    x: 32.5,
    y: 32.5,
    xp: 0,
    email: '',
    portfolio: { COD:0,HAN:0,HWA:0,HYH:0,LGU:0,LHM:0,NEO:0,PLI:0,SEC:0,TEN:0,WOO:0 },
    features: { bankLoan:0, bankSavings:0, campaignFund:0, resources:{ energy:0,food:0,mineral:0,techPart:0 } },
    simState: { gdp:52000000000, treasury:5000000000, taxRateIncome:15, taxRateCorporate:10, taxRateProperty:1, budgetAllocation:{ agriculture:4,diplomacy:3,education:12,energy:6,environment:5,fire:4,health:12,industry:3,military:10,police:6,research:6,space:3,transport:5,urbanDev:6,welfare:15 } },
    achievements: { first_login: Date.now() }
  });
}

// ===== 헤더 렌더링 =====
function renderHeader(activePage) {
  const user = getUser();
  const navLinks = [
    { href: 'index.html', label: '🏠 홈' },
    { href: 'movies.html', label: '🎬 영화' },
    { href: 'flights.html', label: '✈️ 비행기' },
    { href: 'trains.html', label: '🚄 기차' },
    { href: 'buses.html', label: '🚌 버스' },
    { href: 'mybookings.html', label: '📋 내 예매' },
  ];

  const navHTML = navLinks.map(l =>
    `<a href="${l.href}" class="${l.href.includes(activePage) && activePage ? 'active' : ''}">${l.label}</a>`
  ).join('');

  const mobileUserHTML = user
    ? `<div class="mobile-user-row">
        <span class="mobile-username">👤 ${user.name}님</span>
        ${user.isAdmin ? `<a href="admin.html" class="mobile-nav-link accent">⚙️ 관리자</a>` : ''}
        <button class="btn-logout" onclick="logout()">로그아웃</button>
       </div>`
    : `<div class="mobile-user-row">
        <a href="login.html" class="mobile-nav-link">로그인</a>
        <a href="register.html" class="btn btn-accent btn-sm">회원가입</a>
       </div>`;

  const desktopUserHTML = user
    ? `<div class="nav-user">
        <span>${user.name}님</span>
        <a href="mybookings.html" style="color:rgba(255,255,255,.85);text-decoration:none;font-size:.85rem;">내 예매</a>
        ${user.isAdmin ? `<a href="admin.html" style="color:var(--accent);text-decoration:none;font-size:.85rem;font-weight:600;">관리자</a>` : ''}
        <button class="btn-logout" onclick="logout()">로그아웃</button>
       </div>`
    : `<div class="nav-user">
        <a href="login.html" class="btn btn-outline btn-sm" style="color:white;border-color:rgba(255,255,255,.5);">로그인</a>
        <a href="register.html" class="btn btn-accent btn-sm">회원가입</a>
       </div>`;

  return `
    <header>
      <a href="index.html" class="logo">🏛️ 나라<span>예매</span></a>
      <nav class="desktop-nav">${navHTML}</nav>
      ${desktopUserHTML}
      <button class="nav-toggle" onclick="toggleMobileNav()" aria-label="메뉴">
        <span></span><span></span><span></span>
      </button>
    </header>
    <div class="mobile-nav-overlay" id="mobile-nav" onclick="closeMobileNav()">
      <div class="mobile-nav-panel" onclick="event.stopPropagation()">
        <div class="mobile-nav-header">
          <span class="logo" style="font-size:1.1rem;">🏛️ 나라<span style="color:var(--accent)">예매</span></span>
          <button class="mobile-nav-close" onclick="closeMobileNav()">✕</button>
        </div>
        <nav class="mobile-nav-links">${navHTML}</nav>
        ${mobileUserHTML}
      </div>
    </div>
    <script>
      function toggleMobileNav(){document.getElementById('mobile-nav').classList.toggle('open');}
      function closeMobileNav(){document.getElementById('mobile-nav').classList.remove('open');}
    </script>`;
}

// ===== 날짜 포맷 =====
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
}

// ===== 게임 머니 =====
async function getUserMoney(uid) {
  const val = await dbGet(`users/${uid}/money`);
  return typeof val === 'number' ? val : 0;
}

async function deductMoney(uid, amount) {
  const current = await getUserMoney(uid);
  if (current < amount) throw new Error(`게임 머니가 부족합니다.\n현재 잔액: ₩${current.toLocaleString()} / 필요 금액: ₩${amount.toLocaleString()}`);
  await dbSet(`users/${uid}/money`, current - amount);
  return current - amount;
}

// ===== 찜 기능 =====
function favKey(uid) { return `favorites/${encodeURIComponent(uid)}`; }

async function getFavorites(uid) {
  return await dbGet(favKey(uid)) || {};
}

async function toggleFavorite(uid, type, itemId) {
  const path = `${favKey(uid)}/${type}/${itemId}`;
  const existing = await dbGet(path);
  if (existing) { await dbDelete(path); return false; }
  await dbSet(path, { addedAt: Date.now() });
  return true;
}

// ===== 잔여석 배지 색상 =====
function seatBadge(remaining, total) {
  if (remaining <= 0) return '<span class="badge badge-red">매진</span>';
  const pct = remaining / total;
  if (pct <= 0.1) return `<span class="badge badge-red">🔥 잔여 ${remaining}석</span>`;
  if (pct <= 0.3) return `<span class="badge badge-yellow">잔여 ${remaining}석</span>`;
  return `<span class="badge badge-green">잔여 ${remaining}석</span>`;
}

// ===== 타입 라벨 =====
const TYPE_LABELS = {
  movie: { label: '영화', icon: '🎬', color: 'badge-blue' },
  flight: { label: '비행기', icon: '✈️', color: 'badge-yellow' },
  train: { label: '기차', icon: '🚄', color: 'badge-green' },
  bus: { label: '버스', icon: '🚌', color: 'badge-gray' },
};

// ===== 초기 샘플 데이터 삽입 =====
async function seedIfEmpty() {
  const movies = await dbGet('movies');
  if (movies) return;

  await dbSet('movies', {
    m1: { title: '나라의 영웅', genre: '액션', duration: 128, theater: '1관', times: ['10:00', '13:30', '16:00', '19:30', '22:00'], price: 12000, seats: 48, poster: '🎬' },
    m2: { title: '바다의 노래', genre: '애니메이션', duration: 96, theater: '2관', times: ['11:00', '14:00', '17:00', '20:00'], price: 10000, seats: 48, poster: '🌊' },
    m3: { title: '별빛 아래서', genre: '로맨스', duration: 112, theater: '3관', times: ['12:00', '15:00', '18:30', '21:00'], price: 12000, seats: 48, poster: '⭐' },
    m4: { title: '공포의 밤', genre: '공포', duration: 104, theater: '4관', times: ['21:00', '23:30'], price: 13000, seats: 48, poster: '👻' },
  });

  await dbSet('flights', {
    f1: { airline: '나라항공', from: '서울(GMP)', to: '제주(CJU)', date: '2026-08-10', depart: '07:00', arrive: '08:05', price: 89000, seats: 60, class: '이코노미' },
    f2: { airline: '나라항공', from: '서울(GMP)', to: '제주(CJU)', date: '2026-08-10', depart: '12:00', arrive: '13:05', price: 95000, seats: 60, class: '이코노미' },
    f3: { airline: '하늘항공', from: '제주(CJU)', to: '서울(GMP)', date: '2026-08-10', depart: '17:00', arrive: '18:05', price: 85000, seats: 60, class: '이코노미' },
    f4: { airline: '나라항공', from: '서울(ICN)', to: '부산(PUS)', date: '2026-08-11', depart: '08:30', arrive: '09:20', price: 65000, seats: 60, class: '이코노미' },
    f5: { airline: '하늘항공', from: '서울(ICN)', to: '제주(CJU)', date: '2026-08-12', depart: '10:00', arrive: '11:10', price: 99000, seats: 60, class: '비즈니스' },
  });

  await dbSet('trains', {
    t1: { number: 'KTX 101', from: '서울', to: '부산', date: '2026-08-10', depart: '06:00', arrive: '08:32', price: 59800, seats: 60, type: 'KTX' },
    t2: { number: 'KTX 103', from: '서울', to: '부산', date: '2026-08-10', depart: '08:00', arrive: '10:32', price: 59800, seats: 60, type: 'KTX' },
    t3: { number: 'ITX 201', from: '서울', to: '강릉', date: '2026-08-10', depart: '07:30', arrive: '10:00', price: 28200, seats: 60, type: 'ITX' },
    t4: { number: 'KTX 301', from: '서울', to: '광주', date: '2026-08-11', depart: '09:00', arrive: '11:10', price: 46800, seats: 60, type: 'KTX' },
    t5: { number: 'KTX 105', from: '부산', to: '서울', date: '2026-08-11', depart: '15:00', arrive: '17:32', price: 59800, seats: 60, type: 'KTX' },
  });

  await dbSet('buses', {
    b1: { company: '나라고속', from: '서울(강남)', to: '부산', date: '2026-08-10', depart: '06:30', arrive: '10:30', price: 28000, seats: 45, type: '우등' },
    b2: { company: '나라고속', from: '서울(강남)', to: '부산', date: '2026-08-10', depart: '09:00', arrive: '13:00', price: 23000, seats: 45, type: '일반' },
    b3: { company: '하늘고속', from: '서울(동서울)', to: '광주', date: '2026-08-10', depart: '07:00', arrive: '10:30', price: 22000, seats: 45, type: '우등' },
    b4: { company: '나라고속', from: '서울(강남)', to: '대전', date: '2026-08-11', depart: '08:00', arrive: '09:40', price: 12000, seats: 45, type: '일반' },
    b5: { company: '하늘고속', from: '부산', to: '서울(강남)', date: '2026-08-11', depart: '14:00', arrive: '18:00', price: 25000, seats: 45, type: '우등' },
  });
}
