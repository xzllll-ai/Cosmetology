# 🌸 AI 医学美容分析系统

基于 SCUT 评分 + Qwen3-VL 分析 + RealVision 生成的医学美容分析流水线。

## 项目结构

```
aesthetic/
├── scut/                          # SCUT 颜值评分模型（原始代码）
│   ├── predict_app/               # 批量预测脚本
│   ├── SCUT-FBP5500/              # 数据集
│   └── SCUT-Training/             # 训练代码 + 模型权重
├── beauty_pipeline/               # Pipeline 核心代码
│   ├── adapters/                  # 模型适配器（SCUT/Qwen/RealVision）
│   ├── modules/                   # 业务模块（评分/建议/生成/总结）
│   ├── prompts/                   # 提示词模板
│   ├── utils/                     # 工具函数
│   ├── api_server.py              # FastAPI 后端 API
│   ├── config.py                  # 统一配置（模型路径/设备/参数）
│   ├── pipeline.py                # Pipeline 主编排器
│   ├── schemas.py                 # 数据结构定义
│   ├── start.sh                   # 一键启动脚本
│   └── examples/run_pipeline.py   # CLI 示例
├── beauty-web/                    # Next.js 前端源码
├── beauty-pipeline-web/           # GitHub monorepo（部署用）
├── model_local/                   # 模型权重（Qwen + RealVision）
│   ├── qwen3vl/models/            # Qwen3-VL-8B-Instruct
│   └── diffusion/models/          # RealVisXL_V5.0
└── outputs/                       # 输出目录
```

---

## 方式一：本地页面运行

本地运行需要同时启动后端 API 和前端开发服务器。

### 前提条件

- conda 环境 `qwen3vl` 已安装
- Node.js 18+ 已安装

### 1. 安装前端依赖

```bash
cd /apps/users/xzl/aesthetic/beauty-web
npm install
```

### 2. 配置前端环境变量

编辑 `/apps/users/xzl/aesthetic/beauty-web/.env.local`：

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 启动服务

**终端 1 — 启动后端 API：**

```bash
conda activate qwen3vl
cd /apps/users/xzl/aesthetic
python -m beauty_pipeline.api_server
```

**终端 2 — 启动前端开发服务器：**

```bash
cd /apps/users/xzl/aesthetic/beauty-web
npm run dev
```

### 4. 访问

打开浏览器访问 http://localhost:3000

---

## 方式二：Vercel 页面运行

Vercel 部署前端，通过 Cloudflare Tunnel 连接 GPU 服务器上的后端。

### 架构

```
浏览器 → Vercel (前端) → Cloudflare Tunnel → GPU 服务器 (后端 :8000)
```

### 1. 配置 Cloudflare Tunnel

只需执行一次：

```bash
# 登录（浏览器授权，选择域名 243707.xyz）
~/.local/bin/cloudflared tunnel login

# 创建隧道
~/.local/bin/cloudflared tunnel create beauty

# 绑定域名
~/.local/bin/cloudflared tunnel route dns beauty api.243707.xyz

# 创建配置文件
cat > ~/.cloudflared/config.yml << EOF
tunnel: beauty
credentials-file: /apps/users/xzl/.cloudflared/a560bd82-ca5a-47c3-8d35-4a15c521ba8b.json
ingress:
  - hostname: api.243707.xyz
    service: http://localhost:8000
  - service: http_status:404
EOF
```

### 2. 部署前端到 Vercel

1. 打开 https://vercel.com，用 GitHub 登录
2. **Add New → Project**，导入 `xzllll-ai/Cosmetology`
3. **Root Directory** 改为 `frontend`
4. 添加环境变量：
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://api.243707.xyz`
5. 点 **Deploy**

### 3. 启动后端

**方式 A：一键启动（推荐）**

```bash
conda activate qwen3vl
bash /apps/users/xzl/aesthetic/beauty_pipeline/start.sh
```

同时启动隧道 + 后端 API，`Ctrl+C` 同时停止。

**方式 B：分别启动**

```bash
# 终端 1 — 隧道
~/.local/bin/cloudflared tunnel run beauty

# 终端 2 — 后端
conda activate qwen3vl
cd /apps/users/xzl/aesthetic
python -m beauty_pipeline.api_server
```

### 4. 访问

打开 https://cosmetology-nine.vercel.app

---

## 修改模型参数

编辑 `/apps/users/xzl/aesthetic/beauty_pipeline/config.py`：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `scut_device` | SCUT 评分 GPU | `cuda:5` |
| `qwen_device` | Qwen 模型 GPU | `cuda:5` |
| `qwen_max_tokens` | Qwen 最大生成长度 | `2048` |
| `qwen_temperature` | 生成随机性 (0-1) | `0.7` |
| `realvision_device` | 扩散模型 GPU | `cuda:5` |
| `realvision_strength` | 变化强度 (0.1-0.7) | `0.3` |
| `realvision_steps` | 推理步数 | `70` |
| `realvision_seed` | 随机种子 (-1=随机) | `-1` |

修改后重启后端生效。

---

## 替换模型

| 要替换的模型 | 修改位置 |
|---|---|
| SCUT 换权重 | `config.py` → `scut_model_path` |
| Qwen 换微调权重 | 在 `model_local/qwen3vl/` 重新部署，`config.py` → `qwen_model_path` |
| RealVision 换微调权重 | 在 `model_local/diffusion/` 重新部署，`config.py` → `realvision_model_path` |
| 调整生成风格 | `beauty_pipeline/prompts/diffusion_prompts.py` |
| 调整分析话术 | `beauty_pipeline/prompts/qwen_prompts.py` |

---

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/analyze` | 上传图片启动分析 |
| GET | `/api/tasks/{id}` | 查询任务状态 |
| GET | `/api/tasks/{id}/report` | 获取 Markdown 报告 |
| GET | `/static/{id}/{file}` | 访问生成的图片 |

---

## 免责声明

本系统仅供参考，不构成医疗建议。所有医美项目请咨询专业医生。
