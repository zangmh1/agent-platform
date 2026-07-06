import pytest
from src.utils.async_sample import async_add

@pytest.mark.asyncio
async def test_async_add():
    result = await async_add(1, 2)
    assert result == 3