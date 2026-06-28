# CaddyManager

CaddyManager는 Docker 환경에서 Caddy를 손쉽게 관리하기 위해 만든 웹 기반 도구입니다.

## 왜 만들었나

Caddy는 강력하고 편리하지만, 서버에 직접 접속해서 Caddyfile을 수정하고 다시 로드하는 과정은 반복적이고 번거로울 수 있습니다.
특히 다음과 같은 상황에서 불편함이 컸습니다.

- 원격 서버에서 Caddy 설정을 수정할 때마다 SSH로 접속해야 함
- 설정 오류가 있으면 바로 확인하기 어려움
- Caddyfile 변경 후 `caddy reload`를 매번 수동으로 실행해야 함
- Docker 기반 환경에서는 설정 변경과 재적재가 더 번거로워짐

그래서 저는 "Caddyfile을 브라우저에서 보고 수정하고, 검증과 재로드까지 한 번에 처리할 수 있는 간단한 관리 도구"가 필요하다고 생각해 CaddyManager를 만들었습니다.

이 프로젝트의 목표는 다음과 같습니다.

- Docker 환경에서도 Caddy를 쉽게 관리할 수 있게 하기
- 웹 UI를 통해 Caddyfile을 편집할 수 있게 하기
- 설정 검증 후 안전하게 재로드할 수 있게 하기
- 로컬 개발과 서버 운영 모두에서 비교적 쉽게 사용할 수 있게 하기

## 주요 기능

- Caddyfile 내용 열람 및 편집
- 수정된 설정 저장
- Caddy 설정 검증
- 검증이 통과되면 Caddy 재로드
- Docker Socket을 활용해 컨테이너 내부에서 직접 명령 실행
- MaxMind 플러그인을 통해 Geo-location 기반 접근 제어 가능

## 구성 개요

이 프로젝트는 두 개의 컨테이너로 구성됩니다.

- `caddy`: 실제 프록시 서버로 동작하는 Caddy 컨테이너. maxmind 플러그인 추가됨.
- `caddy-gui`: Caddyfile 편집 및 재로드를 위한 웹 UI 컨테이너

`caddy-gui`는 Docker Socket에 접근해 Caddy 컨테이너의 명령을 실행하므로, 웹에서 설정 변경 후 바로 반영할 수 있습니다.

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/taeho9/CaddyManager.git
cd CaddyManager
```

### 2. Docker 네트워크 확인

Caddy와 GUI가 같은 Docker 네트워크 안에서 통신하도록 아래와 같은 네트워크가 필요할 수 있습니다.

```bash
docker network create reverse_proxy
```

### 3. 환경에 맞게 설정

프로젝트에는 기본 설정 파일과 로컬 개발용 오버라이드 파일이 포함되어 있습니다.

- `docker-compose.yml`: 운영 환경용 기본 설정
- `docker-compose.override.yml`: 로컬 테스트/개발용 설정

원하는 환경에 맞게 볼륨 경로를 조정해 주세요.

### 4. 실행

```bash
docker compose up -d
```

### 5. 접속

CaddyManager UI는 구성한 노출 방식에 따라 접속합니다.

- 직접 포트를 노출한 경우: `http://<서버IP>:<포트>`
- Caddy를 통한 프록시로 노출한 경우: 프록시 설정한 도메인으로 접속

## 사용법

1. 브라우저에서 CaddyManager UI에 접속합니다.
2. Caddyfile 내용을 확인하거나 수정합니다.
3. 수정한 내용을 저장합니다.
4. `Reload` 버튼을 눌러 설정을 검증하고 Caddy를 재로드합니다.
5. 설정 오류가 있으면 에러 메시지를 확인한 뒤 수정합니다.

## 로컬 개발 환경에서 실행하는 경우

로컬 환경에서는 `docker-compose.override.yml`을 활용해 로컬 디렉터리에 Caddyfile과 데이터를 연결할 수 있습니다.

```bash
docker compose up -d
```

## 참고사항

- Caddyfile 경로와 볼륨 경로는 사용 중인 환경에 맞게 조정해야 합니다.
- Caddy 컨테이너 이름은 기본적으로 `caddy`로 가정합니다.
- Docker Socket 마운트가 필요하므로, Docker를 실행 중인 환경에서만 정상 동작합니다.

## 라이선스

이 프로젝트는 필요에 따라 자유롭게 사용하고 수정할 수 있도록 구성되어 있습니다.

## 마무리

CaddyManager는 단순한 설정 편집기를 넘어, Docker 기반 Caddy 운영을 조금 더 편하게 만들기 위한 작은 도구입니다.

개인 서버, NAS, 클라우드 서버 등 어디서든 Caddy를 더 쉽게 다루고 싶다면 이 프로젝트가 작은 도움이 되길 바랍니다.
