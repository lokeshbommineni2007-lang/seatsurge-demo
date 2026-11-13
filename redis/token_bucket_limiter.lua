-- token_bucket_limiter.lua
-- Hand-crafted Token Bucket Rate Limiter built on Redis.
-- No third-party rate limit libraries required.

local key = KEYS[1]
local capacity = tonumber(ARGV[1]) or 20
local refill_rate = tonumber(ARGV[2]) or 10 -- tokens per second
local current_time = tonumber(ARGV[3])      -- unix time in ms
local requested = tonumber(ARGV[4]) or 1

-- Fetch existing state from Redis Hash
local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if not tokens or not last_refill then
    tokens = capacity
    last_refill = current_time
else
    -- Compute refilled tokens based on delta time
    local delta_sec = (current_time - last_refill) / 1000.0
    if delta_sec > 0 then
        tokens = math.min(capacity, tokens + (delta_sec * refill_rate))
        last_refill = current_time
    end
end

if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) * 2)
    return cjson.encode({
        allowed = true,
        remaining = math.floor(tokens),
        capacity = capacity
    })
else
    local wait_ms = math.ceil(((requested - tokens) / refill_rate) * 1000)
    return cjson.encode({
        allowed = false,
        remaining = math.floor(tokens),
        retry_after_ms = wait_ms,
        capacity = capacity
    })
end
