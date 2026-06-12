"""
日志工具

统一的日志格式，方便定位 pipeline 执行进度。
"""
import logging
import sys


def setup_logger(name: str = "beauty_pipeline", level: str = "INFO") -> logging.Logger:
    """创建并返回一个格式化的 logger"""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s %(message)s",
        datefmt="%H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


def step_log(logger: logging.Logger, step: int, total: int, msg: str):
    """带步骤编号的日志输出"""
    logger.info("[%d/%d] %s", step, total, msg)
