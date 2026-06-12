# 🌸 AI 医学美容分析系统

基于 SCUT 评分 + Qwen3-VL 分析 + RealVision 生成的医学美容分析流水线。

## 架构

```
用户浏览器 → Vercel (Next.js 前端) → Cloudflare Tunnel → GPU 服务器 (FastAPI 后端)
```

## 快速开始

### 后端（GPU 服务器）

```bash
conda activate qwen3vl
pip install python-multipart
cd backend
python -m beauty_pipeline.api_server
```

### 前端（本地开发）

```bash
cd frontend
npm install
npm run dev
```

### 部署到 Vercel

1. Push 到 GitHub
2. Vercel 导入仓库，Root Directory 设为 `frontend/`
3. 设置环境变量 `NEXT_PUBLIC_API_URL` 为后端公网地址

## 免责声明

本系统仅供参考，不构成医疗建议。
