# 생추어리 (SANCTUARY)

생추어리 카톡방 친구들을 위한 커뮤니티 플랫폼

## 기능

### 📝 자유게시판
- 텍스트 + 이미지 게시글 작성
- 댓글 달기
- 좋아요
- 실시간 업데이트

### ⚡ 포켓몬 거래소
- 포켓몬 교환 게시글 등록
- 1:1 채팅으로 거래 협상
- 거래 확정 시스템
- 게시글 상태 관리 (거래중/확정/마감)

### 👤 사용자
- 닉네임 기반 간편 입장
- localStorage 기반 사용자 정보 저장

### 🔧 관리자 (필랫)
- 공지사항 관리
- 통계 대시보드
- 게시글/채팅 모니터링

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Upstash Redis (2개 인스턴스)
  - 거래소 전용 DB
  - 게시판 전용 DB
- **Image Upload**: Cloudinary
- **Deployment**: Vercel

## 시작하기

### 1. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 2. 환경 변수 설정

\`.env.local.example\`을 \`.env.local\`로 복사하고 값을 채워주세요:

\`\`\`bash
# Upstash Redis - 포켓몬 거래소 전용
UPSTASH_REDIS_TRADE_URL=
UPSTASH_REDIS_TRADE_TOKEN=

# Upstash Redis - 자유게시판 전용
UPSTASH_REDIS_BOARD_URL=
UPSTASH_REDIS_BOARD_TOKEN=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Admin Password
ADMIN_PASSWORD=
\`\`\`

### 3. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

http://localhost:3000 에서 확인

### 4. 프로덕션 빌드

\`\`\`bash
npm run build
npm start
\`\`\`

## 프로젝트 구조

\`\`\`
sanctuary/
├── app/
│   ├── free-board/      # 자유게시판
│   ├── trade/           # 포켓몬 거래소
│   ├── chats/           # 채팅
│   ├── admin/           # 관리자
│   └── api/             # API 라우트
├── components/          # 재사용 컴포넌트
├── lib/
│   ├── redis.ts         # 거래소 Redis
│   ├── redis-board.ts   # 게시판 Redis
│   ├── store.ts         # 거래소 데이터 레이어
│   ├── store-board.ts   # 게시판 데이터 레이어
│   ├── types.ts         # TypeScript 타입
│   └── utils.ts         # 유틸리티 함수
└── public/              # 정적 파일
\`\`\`

## 배포

Vercel로 간편하게 배포:

1. GitHub에 푸시
2. Vercel 프로젝트 생성
3. 환경 변수 설정
4. 자동 배포 완료

---

Made with ❤️ by 필랫
