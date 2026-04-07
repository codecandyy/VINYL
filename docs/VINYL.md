# VINYL — 제품·기능·UI 문서

디지털 레코드 샵 경험을 주는 **Expo(React Native)** 앱입니다. **3D LP 샵 룸**, **로컬 LP 컬렉션**, **Deezer / iTunes** 기반 음악 검색·미리듣기를 한 흐름으로 묶습니다.

---

## 1. 한 줄 요약

- 나만의 **3D 비닐 샵**에서 LP를 꽂고, **Deezer·iTunes**로 곡을 찾아 **30초 미리듣기**와 **컬렉션 저장**을 합니다.  
- **로그인 없이** 동작하며, 컬렉션·룸 상태는 **기기 로컬**에 저장됩니다.  
- (옵션) Supabase 로그인 시 샵 코인 등 일부 데이터를 서버와 연동할 수 있는 구조가 있습니다.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Expo SDK 54, Expo Router (파일 기반 라우팅) |
| UI | React Native, react-native-web |
| 3D | Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` |
| 상태 | Zustand (`collectionStore`, `roomStore`, `playerStore`, `authStore`) |
| 오디오 | Howler(웹), `expo-av`(네이티브), Web Audio(크랙클) |
| 저장소 | AsyncStorage / `localStorage`, 키 `vinyl_collection_v1`, `vinyl_room_state_v1` 등 |
| 음악 API | Deezer Public API, iTunes Search API (키 불필요) |
| 백엔드(선택) | Supabase (`lib/supabase.ts`) |

---

## 3. 앱 구조·내비게이션

### 3.1 라우팅

- **`/` (`app/index.tsx`)** → `/(auth)/login` 으로 리다이렉트  
- **`/(auth)/login`** → 현재 구현은 **`/(tabs)/room`** 으로 바로 리다이렉트 (별도 로그인 UI 없이 룸 진입)  
- **메인 탭 (`app/(tabs)/`)**  
  - **room** — LP 샵 3D (하단 탭바 **숨김**, 전체 화면 몰입)  
  - **collection** — 내 LP 목록  
  - **shop** — 코인 샵  
  - **profile** — 통계·공유  

루트 **`app/_layout.tsx`** 에서 스플래시 후 **`loadCollection()`** 으로 로컬 컬렉션을 불러옵니다.

### 3.2 탭바 UI

- **ROOM** 탭: `tabBarStyle: { display: 'none' }` — 화면 전체가 3D 씬.  
- **COLLECTION / SHOP / PROFILE**: 하단 탭바 표시 — 다크 우드 톤 배경, 구리색(`copper`) 강조, 이모지 아이콘·대문자 라벨.

---

## 4. 화면별 기능·UI

### 4.1 ROOM (`app/(tabs)/room.tsx`) — 메인 3D 샵

**역할**  
- 앱의 중심 화면. **전체 화면 React Three Fiber 캔버스** + 얇은 HUD 오버레이.

**3D 씬 (`components/scene/VinylShopScene.tsx`)**  
- **방 구조**: 바닥·벽·천장·카운터 (`RoomStructure`)  
- **책장/선반**: 우드 톤 (`ShelfUnit`)  
- **앨범 커버**: 슬롯에 배치, Wikimedia 등 URL 또는 procedural 텍스처 (`AlbumCovers`, `lib/albumTexture.ts`)  
- **턴테이블·비닐**: 재생 상태에 따라 회전·바늘암 (`Turntable`, `VinylRecord`)  
- **조명**: 앰비언트, hemisphere, RectArea(선반 비춤), 포인트(천장·램프·앰프 LED 등)  
- **후처리(웹)**: N8AO, Bloom, DOF, 색수차, 노이즈, 채도·대비, 세피아, 톤매핑, DotScreen, 비네트, SMAA (`VinylPostFX.tsx`)

**다이제틱 UI (`ShopDiegeticUI.tsx`)**  
- 카운터 위 **3D 메시 버튼 + Troika 텍스트**  
- **＋ LP** — 음악 검색 모달  
- **VEND** — 자판기 모달  
- **SHARE** — 공유 카드  
- **COIN n** — 룸 스토어 코인 잔액  
- **→ COLLECT** — 컬렉션 탭으로 이동 (`/collection`)  
- 웹에서만 `Html`로 부제(예: SHIMOKITAZAWA VINYL) 표시 가능

**오버레이 HUD (`NowPlayingHUD.tsx`)**  
- **먼지 배너**: 먼지 수치가 높을 때 상단에 표시, 탭 시 청소 (`useDustSystem`)  
- **Now Playing 바** (트랙이 있을 때): 앨범 아트, 제목·아티스트, 진행 바, 재생/일시정지  
- **볼륨 (`VolumeBar`)**: VOL 슬라이더, ± 버튼, 음소거 토글, 값은 AsyncStorage `vinyl_master_volume` 에 저장  

**모달**  
- **`MusicSearch`**: Deezer·iTunes 검색, 트랙 선택 시 컬렉션 추가 + 재생  
- **`VendingMachine`**: 장르 기반 랜덤 추천 후 컬렉션 추가 (코인 소모 로직은 컴포넌트와 스토어에 연동)  
- **`ShareCard`**: 룸 공유용 UI  
- **`Toast`**: 성공/에러 메시지  

**플랫폼**  
- 웹: `SafeArea` 패딩 없이 풀 블리드에 가깝게.  
- iOS/Android: 상·하단 safe area 패딩.

---

### 4.2 COLLECTION (`app/(tabs)/collection.tsx`)

**역할**  
- 로컬에 저장된 **LP 목록** 표시.

**UI**  
- 헤더: `MY COLLECTION`, LP 개수·「로컬 저장」 안내  
- 각 행: 미니 비닐 디스크 스타일(아트·홈·센터), 제목·앨범·**소스 뱃지(DEEZER / ITUNES)**  
- 손상 LP는 행 스타일·`DAMAGED` 표시  
- 미리듣기 없으면 `미리듣기 없음`  
- **탭**: 해당 트랙 미리듣기 재생  
- **길게 누르기**: 제거 확인 알림  

---

### 4.3 SHOP (`app/(tabs)/shop.tsx`)

**역할**  
- **코인 패키지** 구매 UI (실제 결제는 시뮬레이션, 토스 등 연동 예정 문구).

**UI**  
- `COIN SHOP` 타이틀, 현재 코인 잔액  
- 패키지 카드: 코인 수·가격·인기 표시  
- **`CopperButton`** 으로 구매 확인 → 잔액 증가  
- Supabase `userId` 가 있으면 `room_state` / `coin_transactions` 반영 시도 (실패 시에도 로컬 잔액은 갱신)

---

### 4.4 PROFILE (`app/(tabs)/profile.tsx`)

**역할**  
- 수집·룸 상태 요약, 음원 출처 안내, 공유.

**UI**  
- 히어로 카드: 아바타 `VI`, 사용자명 `GUEST`, 로컬 모드 설명  
- 통계 그리드: TOTAL LPs, COINS, DUST LEVEL, DAMAGED, DEEZER, ITUNES  
- **MUSIC SOURCES**: Deezer / iTunes 미리듣기 안내  
- **SHARE MY ROOM** → `ShareCard`

---

### 4.5 인증·콜백 (`app/(auth)/`)

- **`login`**: 즉시 룸으로 리다이렉트 (현재 빌드 기준).  
- **`callback`**: OAuth 등 확장용으로 둘 수 있는 경로.  
- **`authStore`**: `userId`, `isGuest`, `isAuthenticated` — Supabase 연동 시 사용. 로컬 전용 모드에서는 게스트 중심.

---

## 5. 핵심 기능 상세

### 5.1 음악 검색·재생

- **`lib/music.ts`**: Deezer 우선 검색, 필요 시 iTunes fallback.  
- **`MusicTrack`**: `previewUrl`, `artworkUrl`, `source: 'deezer' | 'itunes'`.  
- **`useMusicPlayer`**: `audioEngine` 으로 재생, 진행률은 `playerStore`.  
- **마스터 볼륨**: 0~1, 미리듣기 피크와 크랙클에 곱해 적용, 저장 키 `vinyl_master_volume`.

### 5.2 로컬 LP 컬렉션

- **`lib/localCollection.ts`**: JSON 배열을 `vinyl_collection_v1` 키로 저장.  
- 중복 트랙(같은 `trackId`+`source`)은 추가하지 않고 기존 LP 반환.  
- **`useCollection`**: 로드, 추가, 삭제, `markPlayed`.

### 5.3 룸·먼지·코인

- **`roomStore`**: `dustLevel`, `coinBalance` 등.  
- **`useDustSystem`**: 마지막 방문 시각 기준으로 먼지 누적, 저장 키 `vinyl_room_state_v1`.  
- 청소·고먼지 시 LP 손상 등 게임성 로직이 연결될 수 있음.

### 5.4 3D에서 LP 재생

- 씬의 앨범 선택 시 `onPlayTrack` → `MusicTrack` 형태로 플레이어 호출.  
- 컬렉션 LP는 `LocalLP` → `MusicTrack` 매핑 후 동일 파이프라인.

---

## 6. 디자인 시스템 (UI 톤)

**색상 (`lib/constants.ts`)**

| 토큰 | 용도 |
|------|------|
| `bg`, `bg2`, `bg3` | 배경 계열 (다크 브라운) |
| `copper` | 포인트·버튼·강조 |
| `gold` | 코인·고급 강조 |
| `cream` | 본문 텍스트 |
| `muted` | 보조 텍스트 |
| `shelf` | 테두리·트랙·구분선 |
| `red` | 경고·손상 |

**컴포넌트**

- **`CopperButton`**: 주요 CTA (primary / outline / ghost).  
- **`RetroInput`**: 검색 등 레트로 입력 필드.  
- **`Toast`**: 짧은 피드백.  
- **`VolumeBar`**: 볼륨 조절 전용.

**타이포·레이아웃**

- 대문자·레터스페이싱이 많은 **레코드 샵/오디오 기기** 느낌.  
- ROOM은 **탭바 없음**으로 몰입, 나머지 탭은 **하단 네비**로 이동.

---

## 7. 환경 변수·빌드

프로젝트에 따라 `.env` 예시:

- Supabase: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`  
- (과거 Spotify 연동 시) 클라이언트 ID 등 — 현재 음원은 Deezer/iTunes 중심

**실행**

- `npm run start` / `npm run dev` — Expo  
- `npm run web` — 웹(3D 후처리 포함)  
- `npm run android` / `npm run ios` — 네이티브

---

## 8. 확장 포인트 (개발자용)

- 실제 **결제 연동** (샵 화면).  
- Supabase **로그인·동기화** 본격 사용 시 `authStore` + RLS 정책.  
- **`useVinylCrackle`**: 에셋 URL을 넣으면 Howl 기반 크랙클 루프.  
- 3D: `VinylShopScene` 하위 컴포넌트·`VinylPostFX` 파라미터 튜닝.

---

## 9. 문서 버전

- 저장소 기준으로 작성되었으며, 라우팅·로그인 플로우는 코드 변경에 따라 달라질 수 있습니다.  
- 최신 동작은 `app/`·`components/`·`hooks/` 소스를 기준으로 확인하세요.
