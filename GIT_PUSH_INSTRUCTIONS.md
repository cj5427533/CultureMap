# GitHub 푸시 가이드

프로젝트를 GitHub에 푸시하는 방법입니다.

## 방법 1: 배치 스크립트 사용 (가장 간단)

1. 프로젝트 폴더(`culturemap`)에서 **Git Bash** 또는 **명령 프롬프트**를 엽니다.
2. 다음 명령을 실행합니다:
   ```bash
   git_push.bat
   ```

## 방법 2: 수동으로 Git 명령 실행

프로젝트 폴더에서 다음 명령을 순서대로 실행하세요:

```bash
# 1. Git 저장소 초기화 (이미 초기화되어 있다면 생략)
git init

# 2. 원격 저장소 추가 (이미 있다면 생략)
git remote add origin https://github.com/cj5427533/CultureMap.git
# 또는 이미 있다면 업데이트:
git remote set-url origin https://github.com/cj5427533/CultureMap.git

# 3. 모든 파일 추가
git add .

# 4. 커밋
git commit -m "Initial commit"

# 5. 브랜치를 main으로 설정
git branch -M main

# 6. GitHub에 푸시
git push -u origin main
```

## 주의사항

- GitHub 인증이 필요할 수 있습니다. Personal Access Token을 사용하거나 GitHub CLI를 사용하세요.
- 이미 원격 저장소에 커밋이 있다면 `git pull` 먼저 실행 후 병합하세요.

