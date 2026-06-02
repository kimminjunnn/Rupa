# Rupa


<img width="249" height="524" alt="image" src="https://github.com/user-attachments/assets/b18b093e-0072-4315-9f9a-5bd4c83d011a" />
<img width="249" height="524" alt="image" src="https://github.com/user-attachments/assets/7056e0e8-2d69-4244-968d-e239f2eaafe6" />
<img width="249" height="524" alt="image" src="https://github.com/user-attachments/assets/c2e9f886-ee5b-44f5-ba49-dd10c16fd880" />
<img width="249" height="524" alt="image" src="https://github.com/user-attachments/assets/9e187a07-1f39-47e8-aedf-a8a799939d38" />

Rupa는 실내 볼더링 문제를 사진 위에서 다시 살펴보고, 몸의 위치와 자세를 직접 움직여보며 다음 시도를 준비할 수 있는 볼더링 시뮬레이터입니다.

벽 앞에서 바로 다시 뛰어들기 전에, 사진 위에서 스타트 홀드와 탑 홀드를 고르고 스켈레톤을 조정해보며 “이 자세가 가능할까?”, “몸을 조금 더 왼쪽에 두면 닿을까?” 같은 생각을 가볍게 시험해볼 수 있습니다.

## 볼더링에서 자주 막히는 순간

볼더링을 하다 보면 손을 어디에 둘지는 보이는데, 정작 몸을 어디에 둬야 할지 감이 안 잡히는 순간이 있습니다.

다음 홀드가 멀게 느껴지거나, 발을 올렸는데 균형이 무너지거나, 탑은 보이는데 마지막 자세가 잘 그려지지 않을 때가 있습니다.

Rupa는 이런 순간에 정답을 대신 말해주기보다, 사용자가 직접 자세를 만들어보면서 다시 시도해볼 실마리를 찾을 수 있게 돕습니다.

## 사용 흐름

1. 벽 사진을 선택합니다.
2. 사진에서 홀드와 같은 색 루트를 분석합니다.
3. 스타트 홀드를 고릅니다.
4. 인식되지 않았거나 어긋난 홀드를 직접 조정합니다.
5. 탑 홀드를 선택합니다.
6. 내 몸 크기에 맞게 스켈레톤을 조정합니다.
7. 자세를 움직여보며 완등 동작을 시뮬레이션합니다.

양손이 탑 홀드 근처에 도달하면 완료 상태가 표시됩니다.

## 주요 기능

- 벽 사진 촬영 또는 갤러리 선택
- 홀드와 같은 색 루트 분석
- 스타트 홀드와 탑 홀드 선택
- 인식 누락 홀드 수동 추가 및 조정
- 사용자 신체 정보 기반 스켈레톤 조작
- 완등 자세 도달 여부 표시

## Rupa가 중요하게 보는 것

Rupa의 중심은 기록이나 랭킹이 아니라, 사진 위에서 직접 움직임을 시험해보는 경험입니다.

잘하는 사람의 무브를 그대로 따라가기보다, 내 몸으로 가능한 자세를 먼저 상상해보고 조정해볼 수 있는 도구에 가깝습니다.

사용자가 벽 앞에서 한 번 더 시도해보고 싶어지는 작은 힌트를 만드는 것이 Rupa의 목적입니다.

## 기술 개요

Rupa는 모바일 앱, API, 비전 서비스를 함께 사용하는 구조로 만들어졌습니다.

- 모바일 앱: Expo React Native, Expo Router, React Native SVG, Zustand, TypeScript
- API: NestJS
- 비전 서비스: FastAPI, OpenCV, YOLO, Roboflow fallback

모바일 앱은 사용자 경험과 로컬 시뮬레이션 상태를 담당합니다. Nest API는 앱과 비전 서비스 사이의 안정적인 경계를 맡고, FastAPI 비전 서비스는 벽 사진 분석과 루트 탐지를 담당합니다.

## 개발 문서

- 아키텍처: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 제품 요구사항: [docs/PRD.md](docs/PRD.md)
- UI 가이드: [docs/UI_GUIDE.md](docs/UI_GUIDE.md)
- 배포: [docs/deploy-lightsail.md](docs/deploy-lightsail.md)
- Git 규칙: [docs/git.md](docs/git.md)
