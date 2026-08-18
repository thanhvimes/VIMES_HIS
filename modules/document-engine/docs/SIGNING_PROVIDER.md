# Signing provider contract

Template package hiện dùng HMAC để kiểm tra nội bộ. Production có thể thay bằng provider ký số
phần cứng mà không đổi workflow:

```ts
export interface SigningProvider {
  sign(payload: Buffer): Promise<Buffer>;
  verify(payload: Buffer, signature: Buffer): Promise<boolean>;
  keyId(): string;
}
```

Adapter HSM/USB Token phải giữ private key ngoài backend, trả về signature và key ID; audit log
phải lưu SHA-256 payload, key ID, actor và thời điểm. Không đưa private key vào package hoặc frontend.

Kiểm tra readiness bằng `node backend/scripts/check-signing-readiness.cjs`; production phải cung cấp
`SIGNING_PROVIDER` và `SIGNING_KEY_ID`, còn endpoint/slot HSM là tùy driver.
