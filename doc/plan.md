# MuSheet 开发计划

> 参考对象：[TecReaGroup/MuSheet-flutter](https://github.com/TecReaGroup/MuSheet-flutter)
> 只参考它的**产品形态、UI 风格与交互流程**；代码和后端（Serverpod + 复杂 sync 层）不参考，按本仓库技术栈重新设计。

---

## 0. 前提假设（需确认，见 §11）

| # | 假设 | 理由 |
| --- | --- | --- |
| A1 | 先做 **Web（PWA）**，平板优先、兼顾手机与桌面；Electron 暂不做 | 乐手主要在 iPad / 安卓平板上看谱，PWA 可装到桌面、全屏、离线 |
| A2 | 后端 = 本仓库已有 Node 服务，升级为 **TypeScript + PostgreSQL**，负责 PDF 托管与数据持久化 | `doc/tech.md` 约定；AGENTS #16 要求所有资源由服务器托管 |
| A3 | M1–M4 为**单用户**（无登录）；账号与团队协作放到 M5 | 先把核心看谱体验做好，团队/同步是参考项目里最复杂、最烂的部分 |
| A4 | UI 文案中文为主，字符串集中管理，后续可加英文 | 用户为中文环境 |

---

## 1. 产品范围

### 1.1 核心概念

```text
Library（曲库）
 ├── Score（乐曲）        title, composer, bpm
 │    └── Part（声部谱）   instrument + 一个 PDF（同一首歌可有 Vocal / Keyboard / Drums… 多份谱）
 │         └── Annotation（标注层，按页存）
 └── Setlist（曲目单）     有序的 Score 列表，用于排练 / 演出
```

参考项目里的 `InstrumentScore` 在这里改名为 **Part**（乐团术语"分谱"），更短也更准确。

### 1.2 功能清单（对照参考项目）

| 功能 | 参考项目 | 本项目 | 里程碑 |
| --- | --- | --- | --- |
| 首页：搜索、统计、最近 | 有 | 改为"继续上次演奏 + 最近 + 搜索" | M1 |
| 曲库：Scores / Setlists 两栏 | 有 | 保留，交互重做 | M1 |
| 导入 PDF、创建乐曲、多声部 | 有 | 保留，支持拖拽 / 多文件批量导入 | M1 |
| 乐谱查看器（翻页、缩放） | 有 | 重做：点击分区翻页、半页翻页、横屏双页 | M1 |
| 手写标注（笔、橡皮、撤销重做） | 有 | 保留 + 荧光笔 + 压感 + 显隐切换 | M2 |
| 节拍器 | 仅 4/4、40–240 | 拍号、重音、细分、Tap Tempo、采样级精准 | M2 |
| 曲目单详情、拖拽排序 | 有 | 保留 | M3 |
| 演出模式（曲目单连续翻页） | 部分（setlist 导航弹窗） | 最后一页继续翻即进入下一首 | M3 |
| 蓝牙翻页器 | 只有一个设置入口 | 翻页器本质是 HID 键盘，直接做按键映射 | M3 |
| 屏幕常亮 / 全屏 | wakelock_plus | Screen Wake Lock API / Fullscreen API | M1 |
| 离线可用 | Drift + 自研 sync | Service Worker 缓存（PDF 按 hash 不可变） | M4 |
| 导出带标注的 PDF | 有 | pdf-lib 合成 | M4 |
| 账号、团队、成员、共享曲库 | 有 | 简化重做 | M5 |
| 录音 | design 稿有，实现无 | 不做（YAGNI） | — |

---

## 2. 技术选型

### 2.1 前端

| 领域 | 选择 | 理由 / 被否决的方案 |
| --- | --- | --- |
| 框架 | React 19 + Vite + TypeScript | `doc/tech.md` 约定；`package.json` 目前是 18，需升级 |
| UI 组件 | Tailwind CSS v4 + shadcn/ui（Radix） | 约定；组件源码在仓库内，可按设计系统改 |
| 图标 | **lucide-react** | 参考项目截图本身就是 Lucide 风格；线宽统一、tree-shake |
| 路由 | React Router v7（data router） | 够用；TanStack Router 类型更强但增加学习成本 |
| 服务端状态 | TanStack Query | 缓存、乐观更新、失效重取 |
| 客户端 UI 状态 | Zustand | 查看器工具状态、节拍器状态等跨组件但不落库的数据 |
| **PDF 渲染** | **pdfjs-dist**（自己管理 canvas） | 业界标准，Firefox 内置。否决 react-pdf：封装层挡住了预渲染、半页翻页、离屏缓存等控制权 |
| **标注笔迹** | **perfect-freehand** + Canvas 2D | 参考项目 Flutter 版用的同一算法；压感、平滑效果最好 |
| **节拍器** | **Web Audio API 自研调度器**（look-ahead scheduling） | 业界标准做法（Chris Wilson "A Tale of Two Clocks"）。否决 `setInterval`：主线程抖动会导致节拍不稳；否决 Tone.js：只用到 1% 功能，体积大 |
| 拖拽排序 | @dnd-kit/sortable | 支持触摸、键盘无障碍 |
| 手势 | @use-gesture/react | pinch 缩放、swipe 翻页 |
| Toast | sonner（shadcn 默认） | 支持"撤销"操作按钮 |
| PWA / 离线 | vite-plugin-pwa（Workbox） | M4 |
| 导出 PDF | pdf-lib | M4，纯前端合成标注 |
| 字体 | @fontsource-variable/inter（自托管） | 见 §4.3；AGENTS #16 不允许走 Google Fonts CDN |

### 2.2 后端

| 领域 | 选择 | 理由 |
| --- | --- | --- |
| 运行时 | Node.js 22 + TypeScript（`tsx` 开发 / `tsc` 构建） | 约定 |
| HTTP | **Fastify** | 自带 schema 校验、multipart、static，插件成熟；替换现有手写 `node:http` 路由 |
| 校验 | zod（前后端共享 schema） | 只在边界校验一次（Design Rule 2） |
| ORM | Drizzle ORM + drizzle-kit 迁移 | 类型安全、SQL 透明、轻量 |
| 数据库 | PostgreSQL 17（docker compose） | 约定 |
| 文件存储 | 本地磁盘，**内容寻址** `data/pdf/<sha256>.pdf` | 天然去重、URL 不可变 → 可永久缓存 |
| 配置 | `config/config.toml`（smol-toml 解析）+ `.env` 放密钥 | AGENTS #4 |

---

## 3. 架构

### 3.1 前端目录（feature-first，目录名单数，AGENTS #3 #8）

现有脚手架为 `entities/ features/ pages/`（复数），按 AGENTS #8 改为单数：

```text
src/
├── app/                      # 应用壳：路由、Provider、布局（侧边栏 / 底部导航）
├── page/                     # 路由级页面，只做组装
│   ├── home/
│   ├── library/
│   ├── score-detail/
│   ├── setlist-detail/
│   ├── viewer/
│   └── setting/
├── feature/                  # 用户可感知的完整能力
│   ├── score-import/         # 选择/拖拽 PDF → 计算 hash → 上传 → 生成缩略图
│   ├── pdf-render/           # pdf.js 文档加载、页面渲染缓存、视口适配
│   ├── page-turn/            # 翻页策略：整页 / 半页 / 双页、点击分区、键盘/翻页器
│   ├── annotation/           # 画布、笔刷、橡皮、撤销栈、持久化
│   ├── metronome/            # 音频调度器 + 面板 UI
│   ├── setlist-edit/         # 新建 / 编辑 / 拖拽排序 / 添加乐曲
│   ├── library-search/       # 搜索、排序、筛选
│   └── performance-mode/     # 曲目单连续演奏、常亮、全屏
├── entity/                   # 领域模型 + API + query hooks + 展示卡片
│   ├── score/
│   ├── part/
│   └── setlist/
└── shared/
    ├── ui/                   # 设计系统组件（shadcn 改造后放这里）
    ├── api/                  # fetch 客户端（统一错误、requestId）
    ├── lib/                  # logger 等
    └── config/               # 前端常量
```

依赖方向：`app → page → feature → entity → shared`，禁止反向引用。

### 3.2 后端目录

```text
backend/
├── server.ts
└── src/
    ├── app.ts                # Fastify 实例、插件注册
    ├── config/               # 读取 config.toml + env，启动时一次性校验
    ├── infrastructure/       # logger、db 连接、文件存储
    ├── module/               # 按业务模块（单数）
    │   ├── score/            # route.ts / repository.ts / schema.ts
    │   ├── part/
    │   ├── pdf/              # 上传、去重、引用计数、静态下发
    │   ├── annotation/
    │   └── setlist/
    └── db/
        ├── schema.ts         # Drizzle 表定义
        └── migration/
```

### 3.3 数据流

```text
浏览器
 ├─ TanStack Query ──HTTP JSON──▶ Fastify /api/*  ──▶ PostgreSQL
 ├─ pdf.js ─────GET /file/pdf/<sha256>──▶ 磁盘（Cache-Control: immutable）
 └─ Service Worker（M4）：app shell + PDF cache-first
```

PDF 文件 URL 由内容 hash 决定、永不变化，因此浏览器缓存与 SW 缓存都**不需要失效逻辑**——这是相比参考项目自研 `PdfSyncService` 最大的简化。

---

## 4. 设计系统

### 4.1 保留参考项目的部分

- **语义色**：蓝色 = 乐曲（Score），翠绿 = 曲目单（Setlist）。图标底块用同色系渐变（blue-50 → blue-100 / emerald-50 → emerald-100）。
- 首页顶部淡蓝 → 青绿渐变背景 + 渐变色 Logo。
- 卡片：白底、12px 圆角、1px gray-200 描边、无重阴影。
- 列表卡片结构：图标块 + 标题 / 副标题 / 元信息 + 右侧 chevron。

### 4.2 Token（定义在 `src/styles.css` 的 CSS 变量，Tailwind v4 `@theme` 引用）

| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `--color-score` | blue-600 `#2563EB` | blue-400 | 乐曲主色、主按钮 |
| `--color-setlist` | emerald-600 `#059669` | emerald-400 | 曲目单 |
| `--color-surface` | `#FFFFFF` | `#18181B` | 卡片 |
| `--color-canvas` | gray-50 `#F9FAFB` | `#09090B` | 页面背景 |
| `--color-border` | gray-200 | zinc-800 | 描边 |
| `--color-fg` / `--color-fg-muted` / `--color-fg-subtle` | gray-900 / 600 / 400 | 对应反转 | 三级文字 |
| `--color-danger` | red-600 | red-400 | 删除 |
| 圆角 | `sm 8` / `md 12` / `lg 16` / `xl 24` | | 标签 / 卡片 / 弹窗 / 底部抽屉 |
| 间距 | 4px 栅格 | | |

参考项目有 `blue550`、`emerald350` 这种非标准色阶，统一收敛到 Tailwind 标准色阶。

### 4.3 字体

```css
font-family: "Inter Variable", "PingFang SC", "HarmonyOS Sans SC",
             "Microsoft YaHei", system-ui, sans-serif;
```

- Inter 自托管（`@fontsource-variable/inter`），中文走系统字体，不打包 CJK 字体（体积太大）。
- BPM、页码、计数等数字一律 `font-variant-numeric: tabular-nums`，避免跳动。
- Logo "MuSheet" 做成 **SVG 字标**，不再为一个 Logo 加载 Righteous 整套字体。

| 层级 | 字号 / 字重 |
| --- | --- |
| 页面大标题 | 28 / 700，letter-spacing -0.02em |
| 区块标题 | 17 / 600 |
| 卡片标题 | 15 / 600 |
| 正文 | 15 / 400 |
| 元信息 | 13 / 400，fg-subtle |
| 节拍器 BPM | 56 / 600 tabular |

### 4.4 共享组件（`src/shared/ui/`，全项目复用，AGENTS #15）

`Button` `IconButton` `SegmentedControl` `ListCard` `IconTile`（渐变图标块） `EmptyState` `SearchField` `SortMenu` `Sheet`（底部抽屉，手机）/`Dialog`（居中，平板桌面） `ConfirmDialog` `Toast` `Slider` `Stepper`（长按连续加减） `Avatar`

### 4.5 相对参考项目的 UI 改进

| 问题（参考项目） | 改进 |
| --- | --- |
| 首页两张大统计卡只显示一个 "0"，占半屏且无行动 | 换成"继续演奏"卡（上次的曲子 + 页码，一键回到原处）+ 最近曲目单/乐曲横向列表 |
| 空状态只有文字，没有操作按钮 | EmptyState 必带主操作："导入第一份乐谱" |
| Library 两个大色块 Tab 视觉过重 | 改为 SegmentedControl |
| 搜索/排序藏在下拉把手（═）后面，难以发现 | 搜索框 + 排序菜单常驻在列表顶部 |
| "1 scores" 复数错误、卡片上 "Personal" 噪音 | 正确计数文案；无团队时不显示归属 |
| 只能左滑删除，且需二次确认 | 左滑 + 长按/右键上下文菜单（重命名、加入曲目单、删除）；删除后 Toast 提供"撤销"，代替确认弹窗 |
| 仅手机竖屏布局，平板上一列卡片拉满宽度 | 响应式：<768px 底部 Tab；≥768px 左侧导航栏；曲库在宽屏用带 PDF 缩略图的网格 |
| 查看器右上角 ♫ 图标含义不明（实为曲目单导航） | 用明确图标 + 文字的抽屉；查看器顶栏按钮均有 tooltip |
| 查看器底栏两个编辑图标难以区分 | 进入标注后才出现工具栏，常态只有"标注""节拍器""更多" |
| 仅有浅色模式 | 浅色 / 深色 / 跟随系统；查看器另有"夜间乐谱"（PDF 反色，适合暗场演出） |

---

## 5. 页面与交互

### 5.1 应用壳

- 导航项：首页 / 曲库 / 设置（M5 增加 团队）。
- 手机：底部 Tab；平板/桌面：可折叠左侧栏。
- 查看器为全屏路由，不显示导航壳。

### 5.2 首页 `/`

1. 渐变头部：Logo + 搜索框（实时搜索乐曲、作曲者、曲目单）。
2. 继续演奏卡片（无记录时隐藏）。
3. 最近曲目单、最近乐曲（各最多 6 个，横向滚动 / 宽屏网格）。
4. 全空时：EmptyState + 导入按钮。

### 5.3 曲库 `/library?tab=score|setlist`

- 标题 + 计数（"12 首乐曲 · 3 个曲目单"）。
- SegmentedControl 切换；当前 tab 写在 URL 里，返回时保持。
- 工具行：搜索框 + 排序菜单（最近添加 / 名称 / 最近打开；再次点同一项切换升降序——沿用参考项目的 `withSort` 规则：名称默认升序，其它默认降序）。
- FAB / 顶部"+"：乐曲 tab → 导入；曲目单 tab → 新建曲目单。
- 支持把 PDF 直接拖进页面导入（桌面）。

### 5.4 导入流程（feature/score-import）

1. 选择一个或多个 PDF。
2. 前端计算 SHA-256（Web Crypto），先 `HEAD /api/pdf/<hash>`，已存在则跳过上传（秒传）。
3. 用 pdf.js 渲染首页生成 WebP 缩略图，与 PDF 一起上传。
4. 表单：标题（默认取文件名 / PDF metadata title）、作曲者（自动补全已有作曲者）、声部（下拉：Vocal / Keyboard / Guitar / Bass / Drums / 自定义）。
5. 若标题 + 作曲者与已有乐曲相同 → 提示"添加为该曲的新声部"（参考项目的 matched score 逻辑，保留）。

### 5.5 乐曲详情 `/score/:id`

- 头部：标题、作曲者、默认 BPM，可编辑。
- 声部列表：缩略图 + 乐器 + 页数，可拖拽排序，点击进入查看器；"+ 添加声部"。
- "所在曲目单"区块：显示并可加入其它曲目单。

### 5.6 曲目单详情 `/setlist/:id`

- 头部：名称、描述、曲目数；"开始演奏"主按钮 → 从第一首进入演出模式。
- 序号列表，dnd-kit 拖拽排序；左滑移除（Toast 撤销）。
- "添加乐曲"抽屉：带搜索的多选列表。

### 5.7 查看器 `/view/:partId?setlist=:setlistId&index=:n`（核心）

**布局**

```text
┌──────────────────────────────────────────┐
│ ←  标题 ▾(切换声部)      曲目单 ☰   ⋯     │  顶栏（沉浸态隐藏）
│                                          │
│              PDF 页面                     │
│   ◀ 点击翻上一页 │ 点击切换界面 │ 点击翻下一页 ▶  │  三分区
│                                          │
│                 3 / 9                     │  页码胶囊（翻页后 1.5s 自动淡出）
│ [✎ 标注]   [♩ 节拍器]   [⚙ 显示]           │  底栏（沉浸态隐藏）
└──────────────────────────────────────────┘
```

**交互规则**

| 操作 | 行为 |
| --- | --- |
| 点击左 / 右 1/3 区域 | 上 / 下一页（参考项目只有箭头按钮，演奏时不好按） |
| 点击中间 1/3 | 显示 / 隐藏顶栏与底栏 |
| 左右滑动 | 翻页 |
| 双指捏合 | 缩放；缩放状态下单指拖动平移，回到 fit 后恢复翻页手势 |
| 键盘 →/↓/PageDown/Space | 下一页；←/↑/PageUp 上一页（覆盖绝大多数蓝牙翻页器） |
| 横屏且宽度足够 | 自动双页并排 |
| 半页翻页（设置开关） | 翻页时先替换屏幕上半部分为下一页上半，读到底再换下半——演奏中视线不中断，是专业看谱软件（forScore 等）的标志功能 |
| 曲目单最后一页再翻 | 进入下一首（演出模式），顶部短暂显示下一首名称 |

**渲染策略（feature/pdf-render）**

- 渲染尺寸 = 显示尺寸 × `devicePixelRatio`，上限按设备内存裁剪，防止 iPad 上 canvas 超限白屏。
- 预渲染当前页 ±1 页到 `OffscreenCanvas` / `ImageBitmap`，LRU 缓存 5 页，翻页瞬时切换。
- 缩放时先用 CSS transform 即时放大，停止手势 200ms 后按新倍率重渲染清晰版本。
- pdf.js worker、`cmaps/`、`standard_fonts/` **从本站下发**（Vite 复制到 `public/pdfjs/`），否则部分乐谱 PDF 的字体/中文会乱码，且不能访问外部 CDN。

**阅读位置**：每个 Part 记住最后页码（localStorage，按设备），重新打开回到原页。

### 5.8 标注（feature/annotation）

- 工具：钢笔、荧光笔（半透明、正片叠底）、橡皮（整笔擦除，命中检测用笔画包围盒 + 点距）、撤销 / 重做、清空本页、显示/隐藏标注层。
- 颜色 6 个预设（沿用参考项目：黑 红 蓝 绿 橙 紫），粗细 3 档。
- 输入：Pointer Events，读取 `pressure`；**有 Apple Pencil / 触控笔时，手指只翻页不画线**（palm rejection：`pointerType === 'pen'` 才落笔），无笔设备才允许手指绘制。
- 坐标存为相对页面宽高的 0–1 归一化值 → 任意缩放、旋转、设备尺寸下位置一致（参考项目同样做法，保留）。
- 撤销栈按页、仅存在于当前会话；笔画结束后 debounce 800ms 保存整页。

### 5.9 节拍器（feature/metronome）

**调度器原理**（写给后续实现者）：

- 是什么：用 `setTimeout` 每 25ms 唤醒一次，把未来 100ms 内要响的拍子提前通过 `AudioBufferSourceNode.start(time)` 交给音频线程。
- 为什么：音频线程的时钟 `AudioContext.currentTime` 是采样级精准的，主线程卡顿只会推迟"排队"而不会推迟"发声"；只要 look-ahead 窗口 > 主线程最大卡顿，节拍就稳定。
- 视觉闪烁用 `requestAnimationFrame` 比对 `currentTime` 与已排队拍子的时间戳，保证声画同步。

**功能**

- BPM 20–300：大号数字、±1 按钮（长按连发）、滑块、**Tap Tempo**（取最近 4 次点击间隔平均）。
- 拍号：2/4 3/4 4/4 5/4 6/8 7/8 + 自定义；首拍重音（高音色）。
- 细分：无 / 八分 / 三连音 / 十六分。
- 音色：自托管的 click 采样（`public/sound/`），首拍与普通拍各一个。
- BPM 与拍号保存到 Score（debounce 1s）；查看器内以浮动小窗显示，关闭小窗不停止播放，顶栏显示脉动小圆点表示正在运行。
- 注意：iOS Safari 要求在用户手势内 `audioContext.resume()`，首次点击播放时处理。

### 5.10 设置 `/setting`

- 外观：主题（浅色 / 深色 / 跟随系统）。
- 查看器：翻页方式（整页 / 半页）、点击分区翻页开关、夜间乐谱、默认显示标注。
- 翻页器：显示当前按键映射，支持"按下翻页器按键"录制自定义映射。
- 关于：版本号。

---

## 6. 数据模型（PostgreSQL / Drizzle）

```text
pdf_file
  sha256        text PK
  byte_size     int
  page_count    int
  created_at    timestamptz

score
  id            uuid PK
  title         text not null
  composer      text not null default ''
  bpm           int  not null default 120      -- 20..300
  time_signature text not null default '4/4'
  created_at / updated_at / last_opened_at  timestamptz

part
  id            uuid PK
  score_id      uuid FK → score ON DELETE CASCADE
  instrument    text not null                   -- vocal|keyboard|guitar|bass|drums|custom
  custom_label  text null                       -- instrument = custom 时必填（DB CHECK 约束）
  pdf_sha256    text FK → pdf_file
  position      int  not null
  UNIQUE(score_id, instrument, custom_label)

annotation_page
  part_id       uuid FK → part ON DELETE CASCADE
  page_index    int
  strokes       jsonb      -- [{tool, color, width, points:[[x,y,p],...]}]
  updated_at    timestamptz
  PK(part_id, page_index)

setlist
  id            uuid PK
  name          text not null
  description   text not null default ''
  created_at / updated_at / last_opened_at

setlist_item
  setlist_id    uuid FK → setlist ON DELETE CASCADE
  score_id      uuid FK → score   ON DELETE CASCADE
  position      int
  PK(setlist_id, score_id)
```

设计取舍：

- 标注按**页**为一行存 jsonb，而不是每笔一行：读写粒度与 UI 一致（一次加载一页），避免高频小写入；单用户下不存在多人同时改同一页的冲突。
- PDF 删除：`part` 不再引用某 `pdf_file` 时由后端在同一事务内删除行与磁盘文件，不做定时 GC。
- 参考项目的 `scopeType + scopeId` 在 M5 用 `library_id` 替代（见 §8），M1–M4 不预埋（YAGNI）。

---

## 7. API（REST，`/api` 前缀）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/score?query=&sort=&order=` | 列表 + 搜索 |
| POST | `/api/score` | 创建（含首个 part） |
| GET / PATCH / DELETE | `/api/score/:id` | 详情含 parts、所属 setlists |
| POST | `/api/score/:id/part` | 添加声部 |
| PATCH / DELETE | `/api/part/:id` | 改乐器 / 删除 |
| PUT | `/api/score/:id/part-order` | 声部排序 |
| HEAD | `/api/pdf/:sha256` | 秒传检查 |
| PUT | `/api/pdf/:sha256` | 上传 PDF + 缩略图（multipart，服务端重算 hash 校验） |
| GET | `/file/pdf/:sha256.pdf` · `/file/thumbnail/:sha256.webp` | 静态下发，`immutable` |
| GET | `/api/part/:id/annotation` | 全部页标注 |
| PUT | `/api/part/:id/annotation/:page` | 覆盖保存一页 |
| GET / POST | `/api/setlist` | |
| GET / PATCH / DELETE | `/api/setlist/:id` | |
| PUT | `/api/setlist/:id/item` | 整体替换有序 score id 列表（排序/增删一次完成） |
| GET | `/api/health` | 已有 |

上传大小上限、存储目录等放 `config.toml`。

---

## 8. M5：账号与团队（概要，后续单独细化）

- `user`、`team`、`team_member(role: owner|member)`、`library(owner_user_id | owner_team_id)`；`score`、`setlist` 加 `library_id`。个人与团队数据是**同一套表**，区别只在属于哪个 library——取代参考项目到处判断 `isTeamScore` 的做法。
- "复制到团队 / 复制到我的曲库"= 复制 score/part 行，PDF 因内容寻址无需复制文件。
- 认证：邮箱 + 密码（argon2id），HttpOnly session cookie。
- 标注是否团队共享：默认**个人私有**（每人在同一份谱上的记号不同），这点需确认。

---

## 9. 工程约定落地

| 项 | 做法 |
| --- | --- |
| 日志（AGENTS #7） | 后端沿用 `backend/src/infrastructure/logger` 的格式；**修正**：时间戳当前用的是机器本地时区，需固定为 `+08:00`（`Asia/Singapore`）；日志目录当前为 `backend/data/log/`，与 AGENTS 约定的 `./log/` 不一致，统一为项目根 `./log/`（compose 挂载同步修改）。前端 logger 时间格式同步改为 `+08:00`，仅输出到控制台，ERROR 级上报 `POST /api/client-log` 由后端落盘 |
| 配置（AGENTS #4） | `config/config.toml`：`[server] port`、`[storage] data_dir / max_upload_mb`、`[database] url`（密码走 `.env`）、`[log] level  # debug \| info \| warn \| error` |
| 常量（AGENTS #11） | 如 `LOOKAHEAD_MS`、`SCHEDULE_INTERVAL_MS`、`PAGE_CACHE_SIZE`、`BPM_MIN/BPM_MAX` 放各自模块文件顶部 |
| 临时文件（AGENTS #5） | 上传中间文件写 `./temp/`，完成后原子 rename 到存储目录 |
| Makefile（AGENTS #6） | `install`: `npm ci`；`db`: `docker compose up -d postgres`；`migrate`: drizzle-kit migrate；`run`: 并行启动 vite + 后端（tsx watch） |
| .gitignore（AGENTS #13） | 增加 `log/*.log`、`data/`、`temp/*`（保留 `.gitkeep`）、`.env` |
| 外部资源（AGENTS #16） | 字体、pdf.js worker/cmaps、节拍器音色全部打包或由后端下发，运行时零外部请求 |

---

## 10. 里程碑

| 里程碑 | 内容 | 完成标准 |
| --- | --- | --- |
| **M0 脚手架** | 升级 React 19、接入 Tailwind v4 + shadcn、目录改单数、后端迁移 TS + Fastify + Drizzle + Postgres、日志时区/目录修正、Makefile | `make run` 能起前后端，`/api/health` 通，设计 token 生效 |
| **M1 看谱 MVP** | 应用壳、首页、曲库、导入（秒传 + 缩略图）、乐曲详情、查看器（整页翻页、三分区点击、键盘、缩放、预渲染、常亮、全屏、阅读位置） | 导入一份 9 页 PDF，平板上翻页无白屏闪烁 |
| **M2 标注 + 节拍器** | 标注全部工具、持久化；节拍器全部功能、BPM 存到乐曲 | 120 BPM 下主线程人为阻塞 50ms 节拍仍不漂移 |
| **M3 曲目单 + 演出** | 曲目单 CRUD、拖拽排序、演出模式跨曲翻页、半页翻页、双页、翻页器映射、夜间乐谱 | 用翻页器从第一首连续翻到最后一首 |
| **M4 离线 + 导出** | PWA 安装、SW 缓存、离线只读、导出带标注 PDF | 断网后打开最近乐谱可正常看谱与使用节拍器 |
| **M5 账号 + 团队** | 见 §8 | 待细化 |

---

## 11. 待确认问题

1. **平台**：先做 Web/PWA 是否可以？是否需要 Electron 桌面版（`doc/tech.md` 提到"如需桌面端需特殊要求"）？
2. **账号/团队**：M1–M4 先单用户、不做登录是否可以？团队功能是否必需？
3. **语言**：界面只做中文，还是中英双语？
4. **标注在团队内**：个人私有还是团队共享？（M5 时再定也行）
5. **离线编辑**：M4 只做"离线只读 + 节拍器"，离线时新增的标注是否需要联网后自动同步？（需要的话会引入一层本地队列，复杂度明显上升）
