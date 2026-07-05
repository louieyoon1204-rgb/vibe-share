# Incident Report Template

운영 장애나 보안 의심 상황이 생기면 작성합니다.

## 요약

```text
일시:
작성자:
심각도:
영향 환경: production
영향 주소: https://app.getvibeshare.com / https://api.getvibeshare.com
영향 사용자 수:
```

## 증상

```text
무엇이 안 됐나요:
처음 발견한 시각:
복구된 시각:
사용자에게 보인 오류:
스크린샷/로그:
```

## 영향

- [ ] 웹앱 접속 실패
- [ ] API health 실패
- [ ] QR 생성 실패
- [ ] QR 스캔 실패
- [ ] 6자리 코드 실패
- [ ] PC -> phone 실패
- [ ] phone -> PC 실패
- [ ] 다운로드 실패
- [ ] 데이터 노출 의심

## 확인 순서

1. `https://api.getvibeshare.com/health`
2. `https://api.getvibeshare.com/api/info`
3. `https://app.getvibeshare.com`
4. Railway API 로그
5. 브라우저 F12 Network/Console
6. Cloudflare Pages 최근 배포
7. R2 CORS / bucket / key
8. DNS

## 원인

```text
확인된 원인:
아직 모르는 점:
```

## 조치

```text
즉시 조치:
추가 조치:
담당자:
마감일:
FAQ/문서 반영:
```

## 재발 방지

```text
모니터링 추가:
알림 추가:
코드 수정:
운영 절차 수정:
```
