"""
Beauty Pipeline - 医学美容评分 + 建议 + 效果图生成 + 复评 + 总结 模块化流水线系统

Usage:
    from beauty_pipeline.pipeline import BeautyPipeline
    from beauty_pipeline.config import BeautyPipelineConfig

    config = BeautyPipelineConfig(...)
    pipeline = BeautyPipeline(config)
    result = pipeline.run(image_path="test.jpg", user_requirement="我想让皮肤更紧致")
"""

__version__ = "0.1.0"
