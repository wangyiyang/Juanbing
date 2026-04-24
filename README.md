# Juanbing（卷饼）

自用的中文问卷调查与数据收集平台。

## 技术栈

- Next.js 15（App Router）
- TypeScript
- Tailwind CSS
- shadcn/ui
- SQLite + Drizzle ORM

## 快速开始

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

应用默认运行在 `http://localhost:3000`。

## 开发前准备

1. 复制 `.env.example` 为 `.env.local`
2. 用 `bcryptjs` 生成管理员密码哈希并填入 `ADMIN_PASSWORD_HASH`
3. 执行 `pnpm db:generate && pnpm db:migrate`
4. 启动开发环境：`pnpm dev`

## 验证命令

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

## License

[MIT](LICENSE)
