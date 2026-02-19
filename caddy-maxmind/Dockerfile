#
# Caddy 공식 이미지 중 빌드 도구(go, xcaddy 등)이 미리 설치된 버전을 사용함.
# builder 라는 별칭을 붙임 (AS builder)
FROM caddy:builder AS builder

# 이미지 내의 빌드도구(xcaddy)를 실행하며 github에 공개되어 있는
# caddy-maxmind-geolocation을 포함해 빌드한다. 빌드가 완료되면 
# 새로운 caddy 바이너리(실행파일)가 /usr/bin/caddy 경로에 생성됨
RUN xcaddy build \
    --with github.com/porech/caddy-maxmind-geolocation

# Caddy의 공식 이미지를 사용함
FROM caddy:latest

# Caddy 공식 이미지에 builder 단계(AS builder)에서 빌드한 maxmind가 포함된
# caddy 바이너리를 가져온 공식 이미지로 복사함 (덮어씀)
# 앞의 caddy가 새로 빌드한 명령어, 뒤가 덮어쓸 공식 이미지 내 명령어
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
#