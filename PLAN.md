#2D 픽셀 아바타 오버레이 시스템 구현 계획

📋 기능 명세

1. 아바타 시스템 (Avatar System)

- AWS S3에서 아바타 이미지 로드: 다양한 아바타 스프라이트 시트 지원
- 스프라이트 애니메이션: 걷기, 달리기, 점프, 아이들 등 기본 액션
- 위치 제어: 비디오 위의 임의 위치에 배치 가능
- 크기 조절: 아바타 스케일링 지원

2. 애니메이션 엔진 (Animation Engine)

- 프레임 기반 애니메이션: 스프라이트 시트의 각 프레임을 순차 재생
- 애니메이션 상태 관리: 현재 액션, 방향, 프레임 상태 추적
- 부드러운 전환: 액션 간 자연스러운 전환 효과
- 루프 제어: 반복/일회성 애니메이션 설정

3. 액션 시스템 (Action System)

- 이동 액션: 키보드 입력으로 아바타 이동 (WASD 또는 방향키)
- 액션 트리거: 특정 키 입력으로 점프, 공격 등 액션 실행
- 물리 시뮬레이션: 기본적인 중력, 충돌 감지
- 경계 제한: 비디오 영역 내에서만 이동 가능

4. AWS S3 연동 (S3 Integration)

- 아바타 에셋 로드: S3에서 스프라이트 시트 이미지 다운로드
- 메타데이터 관리: 애니메이션 프레임 정보, 타이밍 데이터
- 캐싱 시스템: 로드된 이미지 브라우저 캐싱으로 성능 최적화

🏗️ 구현 계획

Phase 1: 기본 구조 설정

1. 의존성 추가

- AWS SDK 또는 직접 HTTP 요청으로 S3 연동
- Canvas 또는 CSS 기반 애니메이션 엔진

2. 컴포넌트 구조
   src/
   ├── components/
   │ ├── Avatar/
   │ │ ├── Avatar.tsx # 메인 아바타 컴포넌트
   │ │ ├── AvatarCanvas.tsx # Canvas 기반 렌더러
   │ │ └── Avatar.css # 아바타 스타일
   │ └── VideoOverlay/
   │ ├── VideoOverlay.tsx # 비디오 + 오버레이 컨테이너
   │ └── VideoOverlay.css
   ├── hooks/
   │ ├── useAvatarAnimation.ts # 애니메이션 로직
   │ ├── useAvatarMovement.ts # 이동/액션 제어
   │ └── useS3Assets.ts # S3 에셋 로드
   ├── types/
   │ └── avatar.ts # 아바타 관련 타입 정의
   └── utils/
   ├── spriteUtils.ts # 스프라이트 처리 유틸
   └── s3Utils.ts # S3 연동 유틸

Phase 2: 코어 기능 구현

1. S3 에셋 로더 (useS3Assets)

- S3 버킷에서 스프라이트 시트 다운로드
- 이미지 프리로딩 및 캐싱
- 애니메이션 메타데이터 파싱

2. 스프라이트 애니메이션 엔진 (useAvatarAnimation)

- 스프라이트 시트에서 개별 프레임 추출
- 프레임 타이밍 및 순서 제어
- 애니메이션 상태 머신 구현

3. 이동 및 액션 시스템 (useAvatarMovement)

- 키보드 이벤트 핸들링
- 아바타 위치 업데이트
- 액션에 따른 애니메이션 트리거

Phase 3: 렌더링 시스템

1. Canvas 기반 렌더러 (AvatarCanvas)

- HTML5 Canvas로 고성능 렌더링
- 스프라이트 드로잉 및 변형 처리
- 비디오 위에 투명 오버레이로 배치

2. 비디오 오버레이 통합 (VideoOverlay)

- 기존 WebRTCPlayer 위에 Canvas 오버레이
- 상대적 위치 좌표 시스템
- 반응형 크기 조절

Phase 4: 고급 기능

1. 물리 시스템

- 기본 중력 및 충돌 감지
- 바닥면 설정 및 점프 메카닉

2. UI 컨트롤

- 아바타 선택 인터페이스
- 액션 버튼 및 상태 표시
- 설정 패널 (크기, 속도 조절)

🔧 기술 스택

- React + TypeScript: 메인 프레임워크
- HTML5 Canvas: 고성능 2D 렌더링
- AWS S3: 에셋 스토리지
- RequestAnimationFrame: 부드러운 애니메이션
- Keyboard Event API: 사용자 입력 처리

📦 필요한 의존성

{
"aws-sdk": "^2.1500.0",
"@types/aws-sdk": "^2.7.0"
}

🎯 예상 개발 순서

1. S3 연동 및 에셋 로더 구현
2. 기본 스프라이트 애니메이션 엔진
3. Canvas 렌더링 시스템
4. 키보드 입력 및 이동 시스템
5. 비디오 오버레이 통합
6. 액션 시스템 및 애니메이션 확장
7. UI 컨트롤 및 설정 기능
