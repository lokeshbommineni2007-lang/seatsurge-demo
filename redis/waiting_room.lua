-- waiting_room.lua
-- Fair virtual waiting room implemented via Redis Sorted Sets.
-- Tracks FIFO arrival timestamps across all load-balanced application instances.

local queue_key = KEYS[1]
local admitted_key = KEYS[2]

local action = ARGV[1]
local user_id = ARGV[2]
local current_time = tonumber(ARGV[3]) or 0
local extra_arg = tonumber(ARGV[4]) or 0

if action == "JOIN" then
    -- Check if already admitted
    local admitted_until = redis.call('ZSCORE', admitted_key, user_id)
    if admitted_until and tonumber(admitted_until) > current_time then
        return cjson.encode({
            status = "ADMITTED",
            admitted_until = tonumber(admitted_until),
            user_id = user_id
        })
    end

    -- Add to queue if not present, keeping original timestamp
    local existing_score = redis.call('ZSCORE', queue_key, user_id)
    if not existing_score then
        redis.call('ZADD', queue_key, current_time, user_id)
    end

    local rank = redis.call('ZRANK', queue_key, user_id)
    local total = redis.call('ZCARD', queue_key)
    local estimated_sec = math.max(1, math.floor(((rank or 0) / 10) * 3))

    return cjson.encode({
        status = "QUEUED",
        user_id = user_id,
        position = (rank or 0) + 1,
        total_in_queue = total,
        estimated_wait_seconds = estimated_sec
    })

elseif action == "CHECK" then
    -- Check admission first
    local admitted_until = redis.call('ZSCORE', admitted_key, user_id)
    if admitted_until and tonumber(admitted_until) > current_time then
        return cjson.encode({
            status = "ADMITTED",
            admitted_until = tonumber(admitted_until),
            user_id = user_id
        })
    end

    local rank = redis.call('ZRANK', queue_key, user_id)
    if not rank then
        return cjson.encode({
            status = "NOT_IN_QUEUE",
            user_id = user_id
        })
    end

    local total = redis.call('ZCARD', queue_key)
    local estimated_sec = math.max(1, math.floor((rank / 10) * 3))

    return cjson.encode({
        status = "QUEUED",
        user_id = user_id,
        position = rank + 1,
        total_in_queue = total,
        estimated_wait_seconds = estimated_sec
    })

elseif action == "ADMIT_BATCH" then
    local count = extra_arg > 0 and extra_arg or 50
    local admit_ttl_ms = 600000 -- 10 minutes pass to shop
    local expiry = current_time + admit_ttl_ms

    local users = redis.call('ZRANGE', queue_key, 0, count - 1)
    local admitted_users = {}

    for i = 1, #users do
        local uid = users[i]
        redis.call('ZREM', queue_key, uid)
        redis.call('ZADD', admitted_key, expiry, uid)
        table.insert(admitted_users, uid)
    end

    -- Clean up expired admissions from admitted_key
    redis.call('ZREMRANGEBYSCORE', admitted_key, 0, current_time)

    return cjson.encode({
        status = "BATCH_ADMITTED",
        admitted_count = #admitted_users,
        admitted_users = admitted_users
    })
end

return cjson.encode({ error = "INVALID_ACTION" })
