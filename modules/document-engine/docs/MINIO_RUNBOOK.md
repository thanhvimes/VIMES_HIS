# MinIO Template Storage Runbook

## Khởi động

```powershell
docker compose -f docker-compose.template-storage.yml up -d
docker compose -f docker-compose.template-storage.yml ps
```

Console: `http://localhost:9001`.

## Cấu hình backend

```env
TEMPLATE_STUDIO_STORAGE=s3
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_BUCKET=vimes-document-templates
S3_ACCESS_KEY=vimes_minio
S3_SECRET_KEY=<secret>
S3_FORCE_PATH_STYLE=true
```

Không commit secret vào git và không đưa secret xuống frontend.

Compose đã tạo service account riêng qua `MINIO_SERVICE_ACCESS_KEY`/
`MINIO_SERVICE_SECRET_KEY`; backend chỉ dùng cặp key này, không dùng root key.
Khi hạ tầng có KMS, bật SSE-KMS cho bucket và cấu hình key ID qua secret manager trước khi
đưa dữ liệu nhạy cảm lên production.

Compose hỗ trợ sẵn `MINIO_KMS_KES_ENDPOINT` và `MINIO_KMS_KES_KEY_NAME`; để trống ở dev,
không bật mã hóa giả. Production phải điền endpoint/KMS key hợp lệ và kiểm tra encrypt/decrypt
trước nghiệm thu.

Kiểm tra readiness trước deploy bằng `node backend/scripts/check-storage-encryption-readiness.cjs`.
Kiểm tra toàn bộ production security gate bằng `node backend/scripts/check-production-security.cjs`.

## Kiểm tra bucket

```powershell
docker compose -f docker-compose.template-storage.yml logs minio-template-init
```

Ba bucket phải tồn tại và ở chế độ private.

## Backup / khôi phục dev

```powershell
docker run --rm -v vimes_his_vimes_minio_template_data:/data -v ${PWD}:/backup alpine tar czf /backup/minio-template-data.tgz -C /data .
docker run --rm -v vimes_his_vimes_minio_template_data:/data -v ${PWD}:/backup alpine tar xzf /backup/minio-template-data.tgz -C /data
```

Production cần backup sang storage thứ hai, bật versioning và mã hóa theo chính sách hạ tầng.

Backup storage thứ hai có thể chạy bằng `powershell -File backend/scripts/backup-template-minio.ps1`.
Sau khi sao chép, kiểm tra đủ cấu trúc bucket bằng `powershell -File backend/scripts/verify-template-minio-backup.ps1 -BackupPath <path>`.
