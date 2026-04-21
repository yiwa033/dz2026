# 财务对账管理网站（dz2026）

## 本地启动

```bash
npm install
npm run dev
```

默认访问：`http://localhost:3000`

## Supabase 初始化

1. 在 Supabase SQL Editor 执行 `db/schema.sql`
2. 在项目根目录创建 `.env.local`
3. 参考下方环境变量填入你的 Supabase 项目信息

## 环境变量示例

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_DOMAIN=dz2025mini.hnchpower.cn
```
