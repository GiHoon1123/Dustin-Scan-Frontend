# GitHub Actions 설정 가이드

## 필요한 Secret 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

### 1. EC2_SSH_KEY

EC2 접속용 SSH 개인키를 등록합니다.

```bash
# 로컬에서 키 내용 복사
cat /Users/dustin/Desktop/common/Blockchain/blockchain.pem
```

**Secret 설정:**

- Name: `EC2_SSH_KEY`
- Value: 위에서 복사한 키 전체 내용 (-----BEGIN RSA PRIVATE KEY----- 부터 -----END RSA PRIVATE KEY----- 까지)

## 테스트

```bash
# 1. 코드 커밋
git add .
git commit -m "feat: GitHub Actions 배포 설정"

# 2. main 브랜치에 푸시
git push origin main

# 3. GitHub Actions 확인
# https://github.com/YOUR_USERNAME/dustin-scan-frontend/actions
```

## 배포 흐름

```
코드 푸시 (main) → GitHub Actions 트리거
  ↓
1. 코드 체크아웃
2. Node.js 설정 & 의존성 설치
3. 프로덕션 빌드
4. SSH로 EC2 접속
5. 빌드 파일 전송
6. Next.js 재시작
7. Nginx 설정 업데이트
  ↓
배포 완료! 🎉
```

## 접속 URL

- **메인 (Nginx)**: http://43.201.96.38
- **직접 접속**: http://43.201.96.38:3001
- **백엔드 API**: http://43.201.96.38:4000

## 문제 해결

### 배포 실패 시

```bash
# 1. SSH로 EC2 접속
ssh -i blockchain.pem ec2-user@43.201.96.38

# 2. 로그 확인
tail -f ~/dustin-scan-frontend/logs/frontend.log

# 3. 프로세스 확인
ps aux | grep "next start"

# 4. 수동 재시작
cd ~/dustin-scan-frontend
pkill -f "next start"
nohup npm run start:prod > logs/frontend.log 2>&1 &
```

### Nginx 문제

```bash
# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# 로그 확인
sudo tail -f /var/log/nginx/error.log
```
