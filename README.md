# 听歌扒谱 · song-to-tab

上传一段音频，自动识别音符并生成 **吉他六线谱（TAB）**。支持选择扒谱引擎与扒谱程度。

![status](https://img.shields.io/badge/status-MVP-blue)

## ✨ 功能

- 🎵 **上传音频**（mp3 / wav / m4a / flac / ogg）并自动转写
- 🎸 **吉他六线谱**输出（标准调弦 EADGBE，ASCII TAB + 可视化）
- ⚙️ **两种扒谱引擎**
  - **务实 (realistic)** — 基于 `librosa pYIN` 的单声部旋律识别，无重型依赖，稳定可用
  - **进阶 (advanced)** — 基于 Spotify `basic-pitch` 的多声部识别（可选安装）
- 🎚️ **三档扒谱程度**：`simple` 只扒主旋律 / `medium` 旋律+和弦 / `full` 尽可能多的音符
- 🥁 **节奏量化**：可对齐到 1/4、1/8、1/16 拍

## 🧱 架构

```
song-to-tab/
├── backend/            FastAPI + librosa 转写引擎
│   ├── app/
│   │   ├── main.py         API 入口（/transcribe）
│   │   ├── transcribe.py   音频 → 音符（旋律/和弦/多声部）
│   │   ├── tab.py          音符 → 吉他六线谱 + ASCII TAB
│   │   └── models.py       请求/响应数据结构
│   └── requirements.txt
└── frontend/           Vite + React + TS 前端
    └── src/
```

## 🚀 快速开始

### 1. 后端

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
# 可选：开启进阶（多声部）引擎
pip install "basic-pitch[onnx]"

uvicorn app.main:app --reload --port 8000
```

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

打开 http://localhost:5173 ，上传音频即可。

## 📝 说明与限制

- 全曲多乐器分离非常困难。**单声部 / 主旋律识别最可靠**。
- `务实` 引擎对清晰的主旋律（人声哼唱、独奏、单音solo）效果最佳。
- `进阶` 引擎需要额外安装 `basic-pitch`，对和弦/复音有更好表现，但结果不保证。
- 生成的谱子是**辅助草稿**，建议人工校对。
