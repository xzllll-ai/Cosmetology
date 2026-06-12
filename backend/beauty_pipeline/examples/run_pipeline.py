#!/usr/bin/env python3
"""
Beauty Pipeline 示例脚本（本地模型加载，不通过 API）

用法:
    conda activate qwen3vl
    cd /apps/users/xzl
    python beauty_pipeline/examples/run_pipeline.py \
        --image_path ./aesthetic/predict_app/test_images/1.png \
        --user_requirement "我想让皮肤更紧致，改善法令纹"

输出:
    outputs/
        original.jpg   - 原始照片副本
        generated.jpg  - 美容效果图
        result.json    - 完整结构化结果
        report.md      - 用户可读报告
"""
import argparse
import os
import sys

# 将项目根目录加入 path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from beauty_pipeline.config import BeautyPipelineConfig
from beauty_pipeline.pipeline import BeautyPipeline


def main():
    parser = argparse.ArgumentParser(
        description="医学美容评分 + 建议 + 效果图生成 + 复评 + 总结 流水线"
    )
    parser.add_argument(
        "--image_path", type=str, required=True,
        help="输入图片路径"
    )
    parser.add_argument(
        "--user_requirement", type=str, default=None,
        help="用户美容需求，例如：'我想让皮肤更紧致，改善法令纹'"
    )
    parser.add_argument(
        "--output_dir", type=str, default="outputs",
        help="输出目录（默认: outputs）"
    )
    # SCUT
    parser.add_argument(
        "--scut_model_path", type=str,
        default="/apps/users/xzl/aesthetic/SCUT-Training/"
                "SCUT-FBP5500-Database-Release/trained_models_for_pytorch/"
                "checkpoints/resnet18_best.pth",
        help="SCUT 模型权重路径"
    )
    parser.add_argument(
        "--scut_device", type=str, default="cuda:0",
        help="SCUT 评分模型使用的设备（默认: cuda:0）"
    )
    # Qwen
    parser.add_argument(
        "--qwen_model_path", type=str,
        default="/apps/users/xzl/model_local/qwen3vl/models/Qwen3-VL-8B-Instruct",
        help="Qwen3-VL 模型路径"
    )
    parser.add_argument(
        "--qwen_device", type=str, default="cuda:5",
        help="Qwen 模型使用的设备（默认: cuda:5）"
    )
    # RealVision
    parser.add_argument(
        "--realvision_model_path", type=str,
        default="/apps/users/xzl/model_local/diffusion/models/RealVisXL_V5.0",
        help="RealVisXL 模型路径"
    )
    parser.add_argument(
        "--realvision_device", type=str, default="cuda:5",
        help="RealVision 模型使用的设备（默认: cuda:5）"
    )
    parser.add_argument(
        "--strength", type=float, default=0.35,
        help="扩散模型变化强度，越小越接近原图（默认: 0.35）"
    )
    parser.add_argument(
        "--seed", type=int, default=-1,
        help="随机种子，-1 为随机（默认: -1）"
    )

    args = parser.parse_args()

    # 检查图片是否存在
    if not os.path.exists(args.image_path):
        print(f"❌ 图片不存在: {args.image_path}")
        sys.exit(1)

    # 构建配置
    config = BeautyPipelineConfig(
        scut_model_path=args.scut_model_path,
        scut_device=args.scut_device,
        qwen_model_path=args.qwen_model_path,
        qwen_device=args.qwen_device,
        realvision_model_path=args.realvision_model_path,
        realvision_device=args.realvision_device,
        realvision_strength=args.strength,
        realvision_seed=args.seed,
        output_dir=args.output_dir,
    )

    # 创建并运行 pipeline
    pipeline = BeautyPipeline(config)
    result = pipeline.run(
        image_path=args.image_path,
        user_requirement=args.user_requirement,
    )

    # 打印摘要
    print()
    print("=" * 60)
    print("📊 结果摘要")
    print("=" * 60)
    print(f"原始评分: {result.original_score.score:.4f} ({result.original_score.level})")
    print(f"生成后评分: {result.generated_score.score:.4f} ({result.generated_score.level})")
    score_diff = result.generated_score.score - result.original_score.score
    print(f"分数变化: {score_diff:+.4f}")
    print(f"效果图: {result.generated_image_path}")
    print(f"完整报告: {os.path.join(args.output_dir, 'report.md')}")
    print(f"结构化结果: {os.path.join(args.output_dir, 'result.json')}")
    print("=" * 60)


if __name__ == "__main__":
    main()
