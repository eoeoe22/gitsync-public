[Cloudwiki에서 읽기](https://wiki.vialinks.xyz/Gitsync)

# 개요

Gitsync는 GIthub에서 작업용 프라이빗 레포지토리와 공개용 퍼블릭 레포지토리의 코드를 안전하게 자동으로 동기화하는 도구입니다.
Cloudflare Workers 환경에서 동작하며, 비밀번호로 보호됩니다.
비밀번호 브루트 포스 방지를 위해 Turnstile이 적용되어 있습니다.

> {mdi:github} https://github.com/eoeoe22/gitsync-public

# 설정 방법
[{mdi:github} 깃허브 레포지토리](https://github.com/eoeoe22/gitsync-public) 의 코드를 직접 다운로드하거나
```
git clone https://github.com/eoeoe22/gitsync-public
```
명령어를 통해 레포지토리를 받습니다.

`wrangler.toml` 파일을 열고, [vars]의 환경 변수를 적절히 수정하세요.

GITHUB_TOKEN, TURNSTILE_SECRET_KEY 는 각각 [Github](https://github.com), [Cloudflare Turnstile](https://www.cloudflare.com/ko-kr/application-services/products/turnstile/) 에서 발급하세요.

- TURNSTILE_SECRET_KEY = ""
- GITHUB_TOKEN = ""
- PASSWORD = ""
- SESSION_SECRET = ""
> 이 환경 변수들은 더미 값으로 설정했다가 추후 Cloudflare Workers 대시보드에서 `비밀` 변수로 직접 주입하는것을 권장합니다.


설정이 완료되면 자신의 Github 계정으로 프라이빗 레포지토리를 생성하고, 코드 전체를 업로드 후 Cloudflare Workers 대시보드에서 해당 프라이빗 레포지토리를 선택해 Workers로 등록합니다.

wrangler가 설치되어 있다면 Github 레포지토리 설정 없이 로컬에서
```
npx wrangler deploy
```
명령어를 통해 바로 배포할 수 있습니다.
배포는 보통 1~2분 이내에 완료됩니다.

배포가 완료되면 발급되는 https://gitsync.계정이름.workers.dev 경로로 접속해 설정한 비밀번호를 입력하고 기능을 이용할수 있습니다.

# 기능
- 레포지토리 동기화
`REPO_CONFIGS` 설정을 바탕으로, 프라이빗 레포지토리에서 환경변수등 민감 정보 포함 파일을 제외한 소스코드만 퍼블릭 레포지토리에 동일하게 커밋합니다.

- 레포지토리 차이 비교
`REPO_CONFIGS` 에 동기화 대상으로 설정된 소스코드 파일들의 차이를 비교합니다.
레포지토리 동기화 작동시에도 이 기능이 먼저 동작하며, 차이가 있는 파일만 효율적으로 업로드합니다.

- 롤백 (프라이빗 레포지토리)
프라이빗 레포지토리의 특정 시점을 선택해 해당 지점으로 자동 롤백합니다.
