# async_sample.py
import asyncio

async def async_add(x, y):
    await asyncio.sleep(0.1)  # 模拟异步操作，比如网络I/O
    return x + y