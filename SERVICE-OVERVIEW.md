# VINYL — 나만의 LP 바 서비스 개요

이 문서는 **VINYL** 프로젝트의 서비스 컨셉, 사용 기술·스택, 주요 구현, UI·디자인 방향을 한 파일에 정리한 것입니다. (코드 기준: Expo SDK 54, React 19, React Native 0.81)

---

## 1. 서비스가 하는 일

**VINYL**은 "혼자만의 빈티지 LP 바(라운지)"를 모바일·웹에서 경험하게 하는 앱입니다.

- **3D 방**: 1970년대 재즈 라운지를 연상하는 방 안에 책장, 턴테이블, 조명, 소품(앰프, 스피커, 자판기 등)이 배치됩니다.
- **LP 컬렉션**: 음악을 검색해 "LP"로 소장하고, 책장 슬롯에 꽂힌 상태로 3D 씬에서 볼 수 있습니다.
- **샘플 LP**: 앱을 처음 시작했을 때 컬렉션이 비어 있으면 Miles Davis, Daft Punk 등 유명 앨범 21장이 샘플로 채워집니다. 이 샘플 LP도 책장에서 드래그해 턴테이블에 올리면 실제 30초 미리듣기가 재생됩니다.
- **턴테이블 플레이**: LP를 책장에서 끌어 턴테이블에 올리는 **다이제틱(diegetic) 인터랙션**으로 재생 흐름을 연출합니다.
- **미리듣기 기반 재생**: 스트리밍 전곡이 아니라 **약 30초 미리듣기**(Deezer / iTunes 출처)를 재생하며, 같은 앨범의 수록곡이 있으면 **SET LIST**로 이어 재생됩니다.
- **큐·자판기·공유**: 슬롯 기반 재생 대기열, 코인·자판기(뽑기) UI, 지금 듣는 곡을 카드 이미지로 꾸며 공유(Share Studio) 등 부가 경험이 있습니다.

현재 **로그인 화면은 Room으로 리다이렉트**되어, 탭 영역도 **인증 없이 접근** 가능한 구성입니다. Supabase·코인 등은 **연동/스키마는 준비되어 있으나** 일부는 시뮬레이션·플레이스홀더 동작입니다.

---

## 2. 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 앱 프레임워크 | **Expo** (~54), **expo-router** (파일 기반 라우팅, Stack + Tabs) |
| UI | **React Native**, **react-native-web** (웹 동일 코드베이스) |
| 3D | **three.js**, **@react-three/fiber**, **@react-three/drei** |
| 포스트 프로세싱 | **@react-three/postprocessing**, **postprocessing** (비네팅만 활성화, 노이즈·크로마·세피아 제거) |
| 상태 | **zustand** (`player`, `queue`, `collection`, `room`, `auth`, `deckPhysics` 등) |
| 로컬 저장 | **@react-native-async-storage/async-storage** (컬렉션·볼륨 등) |
| 백엔드(옵션) | **Supabase** (`@supabase/supabase-js`), 세션은 **expo-secure-store**(네이티브) / **localStorage**(웹) |
| 인증 관련 패키지 | `expo-auth-session`, `expo-web-browser` (구조상 포함, 현재 플로우는 단순화됨) |
| 오디오 | **웹: howler + Web Audio API**(비닐 크랙클), **네이티브: expo-av** |
| 기타 | **expo-clipboard**, **react-native-view-shot**(공유 카드 캡처), **expo-haptics**(가능 시), **expo-gl** |

**빌드·설정**: `app.json` — 다크 UI, New Architecture 활성화, 웹은 Metro 번들러·정적 출력(`output: "static"`), 스킴 `vinyl://`.

---

## 3. 외부 API·데이터

### 음원 메타·미리듣기 (`lib/music.ts`)

- **Deezer Public API** 우선 (키 불필요, JSON).
- 실패 시 **iTunes Search API** 폴백.
- 통합 타입 `MusicTrack`: `previewUrl`, 고해상도 `artworkUrl`, `source: 'deezer' | 'itunes'` 등.

### Supabase (`lib/supabase.ts`)

- 환경 변수: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- 미설정 시 URL/키 플레이스홀더로 클라이언트 생성이 깨지지 않도록 방어.
- 타입 예: `LPRecord`, `RoomState` (코인, 먼지, 테마 등). DB 필드명에 `spotify_track_id` 등이 남아 있을 수 있으나, **실제 검색 소스는 Deezer/iTunes**입니다.

---

## 4. 오디오·재생 구현

- **`lib/audioEngine.ts`**
  - **웹**: `howler`로 미리듣기 스트림 재생, 페이드 인/아웃.
  - **웹 전용**: `AudioContext`로 **절차적 비닐 크랙클/히스** 생성·루프 (재생과 함께 레이어링).
  - **iOS/Android**: `expo-av` `Audio.Sound`로 동일 URL 재생.
- **`hooks/useMusicPlayer.ts`**
  - 재생/일시정지, 마스터 볼륨(AsyncStorage 영속).
  - **앨범 SET LIST**: 한 곡 끝나면 같은 LP의 다음 미리듣기 트랙 자동 진행.
  - **큐 슬롯**(`queueStore`)에서 다음 곡 소비.

---

## 5. 3D 씬·인터랙션

### 씬 구성

- **메인 씬**: `components/scene/VinylShopScene.tsx` — Canvas, 카메라, 드래그 피킹, LP ↔ 턴테이블 스냅, 책장 페이지네이션 등 대부분의 3D 로직.
- **공간**: `RoomStructure` — 70년대 라운지 톤(티크·올리브 뒷벽, 웜 차콜 측벽, 버건디/브라운 카펫, 카운터·행잉 전구 등).
- **오브젝트**: `ShelfUnit`, `Turntable`, `DeskLamp`, `VendingMachine3D`, 포스터·소품 등 세부 메시.
- **비주얼 후처리 (웹만)**: `VinylPostFX` — **비네팅만 활성화** (크로마틱 어버레이션·세피아·노이즈는 성능상 제거됨).

### LP 드래그 시스템

드래그 구현의 핵심 설계 원칙: **외형은 3D처럼 보이되, LP 이동은 순수 2D 스크린 좌표 추적**

- **NDC 역투영 방식**: LP를 집는 순간 LP 월드 좌표를 NDC(Normalized Device Coordinates)로 투영해 카메라 깊이(z)를 기록. 이후 마우스 이동 시 이 고정 z값으로 역투영해 LP 위치를 갱신 → LP가 앞뒤(z축)로 이동하지 않고 화면 좌우·상하로만 따라옴.
- **커서 오프셋 보정**: 포인터다운 지점과 LP 중심의 픽셀 차이를 저장해, LP가 클릭 지점으로 순간이동하지 않고 자연스럽게 시작.
- **첫 프레임 팝 방지**: `DraggingLP`의 초기 회전(`rotation={[Math.PI/2, 0, 0]}`)과 기울기(`carryTilt = 0`)를 최종값과 일치시켜 드래그 시작 시 시각적 점프 없음.
- **자유 드래그 중 face-on 유지**: 턴테이블 위에 없을 때는 LP 피치를 `Math.PI/2`(정면)로 고정 → 깊이감 있는 회전 없이 평면처럼 보임. 턴테이블 위에서만 `0`(수평)으로 부드럽게 눕힘.
- **드래그 유실 방지**: `pointercancel` 이벤트 처리 + `pointermove`에서 `e.buttons === 0` 감지로 포인터업 유실 시(브라우저 밖 버튼 해제 등) 자동 드롭.

### 샘플 LP 즉석 검색

API로 사전 로드되지 않은 데모 슬롯 LP를 턴테이블에 올리면, `albumData`의 아티스트·앨범명으로 즉석 `musicApi.searchAlbumTracks` 검색을 실행해 결과가 오는 즉시 재생 시작.

---

## 6. 상태 관리 (Zustand 스토어)

| 스토어 | 역할 |
|--------|------|
| `playerStore` | 현재 트랙, 재생 여부, 진행 시간, 덱용 side 트랙 목록·인덱스 |
| `queueStore` | 슬롯 기반 대기열, 웹에서 "다음 LP 고르기" 등 펜딩 상태 |
| `collectionStore` | 소지 LP 목록 |
| `roomStore` | 방/코인 등 메타 (Shop 화면과 연계) |
| `authStore` | 사용자 ID 등 (Supabase 연동 시) |
| `deckPhysicsStore` | 턴테이블·바늘 등 덱 관련 물리/UX 상태 |

---

## 7. UI 구조 (화면·컴포넌트)

### 라우팅

- `/` → `/room` 리다이렉트.
- **`app/room.tsx`**: 메인 **3D LP 방** + HUD + 검색/자판기/공유/덱 모달.
- **`app/(tabs)`**: `collection`, `shop`, `profile` (같은 레이아웃에서 `room` 탭은 탭바 숨김 처리).

### 대표 UI 컴포넌트

- **오버레이 HUD**: `NowPlayingHUD` — 재생 중 하단 바, 앨범아트, 진행 바, `VolumeBar`.
- **볼륨 바** (`VolumeBar`): 한 줄 레이아웃 — "VOLUME" 라벨 + 슬라이더 + 퍼센트 수치. 뮤트·스텝 버튼 없음.
- **검색**: `MusicSearch` — `RetroInput`, `CopperButton`, Deezer/iTunes 결과 리스트.
- **덱 모달** (`TurntableDeckModal`): 크게 확대된 LP 플레이어 + 그루브 뷰 + SET LIST 패널.
  - **LP 플레이어** (`DeckTopDownPreview`): 높이 400 / 카메라 줌 220으로 이전 대비 대폭 확대.
  - **그루브 시크 뷰** (`GrooveSeekView`): 바늘 끝 클릭 시 캔버스 오버레이로 전환. 어두운 LP 위에 동심원 홈·트랙 구분 세그먼트, 나선형 앰버 바늘 표시. 원하는 위치 클릭으로 해당 트랙부터 재생.
  - **SET LIST** (`TornPaperTrackList`): `Special Elite` (Google Fonts 웹 인젝션), `#DDD5B8` 크림 배경, 좌측 수직 보더, 스탬프형 "SET LIST" 캡션, 도트 트랙 구분선, 앰버 활성 트랙 하이라이트, 세피아 `PlayingBars`.
- **자판기**: `VendPanel` + 3D `VendingMachine3D`.
- **공유**: `ShareStudio` (`ShareCard`로 export) — 여러 **테마 팔레트**(Dark Wax, Riso Red, Dusty Milk, Midnight, Vintage Poster 등), `ViewShot`으로 이미지 캡처 후 공유/클립보드.
- **피드백**: `Toast`, `LPShopIcon`(검색 진입).

---

## 8. 디자인 시스템·비주얼 디렉션

### 컬러 (`lib/constants.ts` — 앱 내 "모던 레트로 재즈바" 팔레트)

- **배경 계열**: 딥 다크 `bg`, `bg2`, `bg3` — 3D 씬과 분리된 UI·모달용.
- **포인트**: `copper`는 코드상 **레드 포인트**(`#CC2020`)로 쓰임(구리 톤에서 레드로 교체한 주석).
- **텍스트·소재**: `cream`, `muted`, `gold`/`brass`, `shelf`(에보니 우드 보더), `chrome` 등.
- **스플래시/아이콘 배경**: `app.json`에서 `#1C0F00` 계열 다크 브라운.

### 3D 공간 톤 (`RoomStructure` 주석 기준)

- **70s 재즈 라운지 / 빈티지 LP방**: 담배연·티크 뒷벽, 웜 차콜 사이드, 적갈 카펫, 월넛 카운터, 백열 전구.

### UI 톤

- **레트로 산업/바**: 구리색 버튼(`CopperButton`), 타자기 느낌 입력(`RetroInput`), 대문자·레터스페이싱 라벨(탭 `ROOM` / `COLLECTION` 등).
- **덱 모달 폰트**: `Special Elite` (Google Fonts) — 타이프라이터 빈티지 느낌. SET LIST 영역에만 동적 인젝션.
- **웹 전용 보정**: `minHeight: 100vh`, `boxShadow` 등으로 풀스크린·띠 깨짐 방지.

### 접근성·플랫폼 메모

- React Native Web에서 일부 스타일(`shadow*`, `textShadow*`, `pointerEvents` prop)은 경고가 날 수 있음 — 점진적 마이그레이션 여지.

---

## 9. 주요 사용자 플로우 (요약)

1. 방에서 **LP 아이콘**으로 검색 → 트랙 선택 → 컬렉션에 추가 및 즉시 재생 가능.
2. 책장의 LP(내가 추가한 것 또는 샘플 LP 모두 가능)를 **드래그해 턴테이블**에 올려 재생.
3. 덱 모달에서 **바늘 끝 클릭 → 그루브 뷰**로 전환 → 원하는 트랙/위치 클릭으로 시크.
4. **Collection** 탭에서 리스트 재생·삭제(롱프레스 등).
5. **Shop**에서 코인 패키지 UI (실제 결제는 주석상 토스페이먼츠 등 연동 예정, 현재 시뮬레이션).
6. **Share**로 Now Playing 카드를 테마별로 꾸며 이미지 공유.

---

## 10. 주요 버그 수정 이력

| 수정 내용 | 파일 |
|-----------|------|
| LP 드래그 시 직선 낙하 → NDC 역투영 스크린 스페이스 추적으로 교체 | `VinylShopScene.tsx` |
| 드래그 첫 프레임 팝(틸트·피치 점프) → 초기 회전값 JSX 통일 | `VinylShopScene.tsx` |
| LP 공중 멈춤 → `pointercancel` + `e.buttons===0` 자동 드롭 | `VinylShopScene.tsx` |
| 샘플/데모 LP 드래그 불가 → `!lp` 가드 제거, 즉석 API 검색 재생 | `VinylShopScene.tsx`, `LPSleeve.tsx` |
| 앰프 VU 바 매 프레임 랜덤 → 정적 상수 배열로 교체 | `Props.tsx` |
| 과도한 후처리 효과(노이즈·크로마·세피아) 제거 | `VinylPostFX.tsx` |
| 바늘 전체 메시 터치 → 바늘 끝 소구체로 축소, 탭/드래그 구분 | `Turntable.tsx` |
| 볼륨 바 복잡한 레이아웃 → 단일 행 "VOLUME" 라벨+슬라이더 | `VolumeBar.tsx` |

---

## 11. 개발 시 참고

- 스크립트: `npm run dev` / `start`는 `expo start` — 로컬에 CLI가 없으면 `npx expo start` 또는 `./node_modules/.bin/expo` 사용.
- **Node 버전**: 패키지들이 `>=20.19.4` 등을 요구할 수 있음 — 엔진 경고 시 Node 업그레이드 권장.
- **CI 환경**: `CI=true`이면 Metro가 watch 비활성 모드로 동작할 수 있음.

---

*문서는 저장소 코드 스냅샷을 기준으로 작성되었습니다. 배포·결제·인증 정책이 바뀌면 이 파일도 함께 갱신하는 것이 좋습니다.*
