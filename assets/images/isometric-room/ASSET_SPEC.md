# MoveOn 아이소메트릭 원룸 v1 배경 에셋 제작 규격

## 파일명

```text
moveon-room-v1.png
```

## Dynamic object layer: vacuum cleaner idle/active

```text
assets/images/isometric-room/objects/vacuum-cleaner-idle-v1.png
assets/images/isometric-room/objects/vacuum-cleaner-active-v1.png
```

The vacuum cleaner is not baked into the room background.
It is rendered as a separate transparent PNG layer above the background and below the `cleaningFloor` hotspot.

`vacuum-cleaner-idle-v1.png` is the default stored state next to the vanity wall.
`vacuum-cleaner-active-v1.png` is shown briefly after the user taps the cleaner, before navigating to `/cleaning`.

The vacuum cleaner image layer and the cleaning hotspot use state-specific layouts from:

```text
src/features/isometricRoom/constants/isometricRoomLayout.ts
```

## 권장 제작 크기

```text
1536 × 1240 px
```

초기 설계 당시 앱 기준 캔버스는 다음 크기를 사용했습니다.

```text
768 × 620
```

이 값은 과거 권장 규격이며, 실제 v1 구현은 아래의 실제 적용 규격을 따릅니다.

## 실제 v1 적용 규격

현재 앱에 적용된 v1 배경은 다음 파일입니다.

```text
assets/images/isometric-room/moveon-room-v1.png
```

실제 이미지 크기는 다음입니다.

```text
1536 × 1024 px
```

앱 기준 좌표는 다음입니다.

```text
768 × 512
```

`1536 × 1240 px`는 초기 권장 제작 규격으로 남겨두고, v1 구현과 hotspot 정렬은 실제 적용 이미지 비율인 `1536 × 1024`를 기준으로 합니다.

## 배경

방 바깥 영역은 투명 배경을 권장합니다.

투명 배경 제작이 어렵다면 아주 연한 크림색 또는 연한 하늘색을 사용합니다.

## 구도

참고 이미지처럼 넓은 원룸 전체가 한눈에 보이는 아이소메트릭 구도입니다.

```text
상단 중앙
→ 왼쪽 벽과 오른쪽 벽이 만나는 모서리

왼쪽 뒤
→ 침대, 창문, 협탁

왼쪽 앞
→ 화장대, 거울

오른쪽 뒤
→ 공부 책상, 의자, 모니터, 책

오른쪽 벽
→ 욕실 문

중앙
→ 낮은 테이블과 러그

넓은 바닥
→ 캐릭터와 펫이 배치될 여유 공간
```

바닥은 길쭉한 통로나 복도처럼 보이면 안 됩니다.

방 전체가 넓은 마름모 또는 육각형 형태로 보여야 합니다.

## 이미지 안에 고정으로 포함할 요소

```text
벽 두 면
바닥
창문
침대
협탁
화장대
거울
공부 책상
의자
모니터 또는 노트북
스탠드
욕실 문
중앙 테이블
러그
기본 책장 또는 선반
```

## 별도 동적 레이어로 분리할 요소

다음 요소는 배경 이미지에 합치지 않습니다.

```text
화분 성장 단계
물컵 강조 효과
책장에 추가되는 책
청소 먼지
구겨진 종이
옷가지
청소 반짝임
퀘스트 보드
Move On Times 신문
사용자 캐릭터
펫
샤워 완료 반짝임
AI 말풍선
```

## 색상과 분위기

```text
파스텔 핑크
크림색
연한 하늘색
연한 노란색
연한 코랄색
```

다음을 피합니다.

```text
네온색
검은색 굵은 외곽선
지나치게 유아용인 캐릭터 스타일
기업형 UI
현실적인 3D 렌더링
화장실 중심 구성
길쭉한 복도형 바닥
```

목표는 다음과 같습니다.

```text
아기자기하지만 유치하지 않은
트렌디한 파스텔 생활 시뮬레이션 원룸
```
