# Carbone worker pool

Kiểm tra cô lập worker bằng `powershell -File backend/scripts/verify-carbone-worker-isolation.ps1`.
Script đọc health từng container và xác nhận load balancer vẫn trả lời khi một worker unhealthy.

Dev/staging có thể chạy hai instance Carbone bằng:

```powershell
docker compose -f docker-compose.carbone-workers.yml up -d
```

Endpoints:

- `http://127.0.0.1:4001`
- `http://127.0.0.1:4002`

Backend cần đặt load balancer nội bộ hoặc service discovery trước khi dùng production. Image được pin tại `carbone/carbone-ee:full-5.9.0`; không dùng tag `latest`.
