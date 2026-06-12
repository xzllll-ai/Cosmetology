# 后端 - Beauty Pipeline API

## 启动

```bash
conda activate qwen3vl
pip install python-multipart
python -m beauty_pipeline.api_server
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/analyze` | 上传图片启动分析 |
| GET | `/api/tasks/{id}` | 查询任务状态 |
| GET | `/static/{id}/{file}` | 访问生成图片 |
