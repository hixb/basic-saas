This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Translation Automation

下面是一套完整的中文使用流程，方便把本模板拓展到不同市场的文案需求。

### 1. 环境准备

1. 安装依赖：`pnpm install`（首次克隆仓库时运行一次即可）。
2. 在根目录创建/编辑 `.env`，写入模型配置。例如使用 Gemini：
   ```env
   GEMINI_API_KEY=你的密钥
   TRANSLATION_PROVIDER=gemini
   TRANSLATION_MODEL=gemini-1.5-pro
   # 其他可选默认值：
   # TRANSLATION_LOCALES=zh,zh-TW
   # TRANSLATION_STYLE=formal
   # TRANSLATION_CONTEXT=你希望模型了解的产品背景
   ```
3. 如需额外上下文，可在 `.env` 中设置 `TRANSLATION_CONTEXT_FILES=docs/product.md`（多个文件用逗号分隔），或在运行命令时通过 `--context-file` 指定。

### 2. 执行翻译

1. 将英文文案写在 `messages/en/**/*.json` 中，然后在仓库根目录运行：
   ```bash
   pnpm run translate
   ```
   不指定语言时，会自动翻译所有非基准目录（如 `messages/zh`、`messages/ja-JP`）。
2. 只翻译某个语言：命令里直接写语言代码即可，无需 `--locale`：
   ```bash
   pnpm run translate zh
   pnpm run translate zh-TW
   ```
3. 查看差异但不调用第三方 API，可追加 `--dry-run`：
   ```bash
   pnpm run translate zh -- --dry-run
   ```
4. 需要额外提示词或上下文时追加参数：
   ```bash
   pnpm run translate zh -- --context "SaaS 结算中心" --context-file docs/product.md
   ```
5. CI/预提交检查：如果想确保没有缺失翻译，可加入 `--check-only`，若发现缺失会返回退出码 1。

### 3. 输出与缓存

- 脚本会逐个比对 `messages/en` 与目标语言的 JSON 键值，只翻译新增、缺失或英文内容发生变化的条目，避免覆盖手工调整。
- 每次成功翻译都会在 `messages/.translation-cache/<locale>.json` 记录源文案 hash，下一次运行能自动发现英文改动需要重新翻译。
- 写回 JSON 时会统一使用 `2` 个空格缩进并追加换行，便于 `git diff` 审核。

### 4. 常用参数

| 参数 | 说明 |
| --- | --- |
| `--dry-run` | 仅打印待翻译列表，不触发 API 调用。 |
| `--force` | 忽略缓存，强制重译所有键。 |
| `--check-only` | 发现缺失或过期翻译时直接退出并返回非零状态码。 |
| `--context` / `--context-file` | 为 LLM 提供额外上下文（可多次传入）。 |
| `--prompt-overrides` / `--style` | 临时覆盖语气或提示信息。 |
| `--provider` / `--model` | 覆盖 `.env` 中的默认模型配置。 |
| `--max-batch-size` | 每次请求包含的键数量（默认 10）。 |

> `TRANSLATION_PROVIDER`、`TRANSLATION_MODEL`、`OPENAI_TRANSLATION_MODEL`、`GEMINI_TRANSLATION_MODEL`、`TRANSLATION_LOCALES`、`TRANSLATION_STYLE`、`TRANSLATION_PROMPT_OVERRIDES`、`TRANSLATION_CONTEXT`、`TRANSLATION_CONTEXT_FILES` 等环境变量都可以充当上述参数的默认值，减少命令长度。

### 5. 提示词与语气策略

- `config/translation.locales.ts` 中预设了常见语言的语气、文化注意事项及保留词，脚本会根据目标 locale 自动加载对应提示词。若要支持新的语言或自定义语气，只要在该文件添加条目即可。
- CLI 参数 `--prompt-overrides`、`--style` 以及 `.env` 中的对应配置，可随时覆盖默认策略，确保模板在不同 SaaS 产品、不同市场的交流习惯下都能输出合适的文案。

执行完上述步骤后，查看 `messages/<locale>` 与 `messages/.translation-cache` 是否符合预期，再提交代码即可。
