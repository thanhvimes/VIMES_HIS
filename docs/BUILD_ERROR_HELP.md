# Build Error Diagnosis

Để fix lỗi build, tôi cần xem đầy đủ error message.

## Cách 1: Xem lỗi đầy đủ

```powershell
npm run build 2>&1 | Out-File -FilePath error.txt -Encoding UTF8
Get-Content error.txt
```

## Cách 2: Build với verbose

```powershell
npm run build -- --logLevel=error
```

## Các lỗi thường gặp khi build Vite + React:

### 1. Import path không đúng
```typescript
// Sai
import { Component } from '@/components/Component'

// Đúng (nếu không config alias)
import { Component } from '../components/Component'
```

### 2. Missing file extension
```typescript
// Có thể cần
import Component from './Component.tsx'
```

### 3. Circular dependencies
- Check import cycle

### 4. Module not found
- Check file tồn tại
- Check case-sensitive paths

## Quick Fix

Nếu lỗi liên quan đến `EnhancedComponents.tsx`, có thể xóa file này vì chưa được sử dụng:

```powershell
Remove-Item d:\AI\VIMES_HIS\components\ui\EnhancedComponents.tsx
```

Sau đó build lại:

```powershell
npm run build
```
