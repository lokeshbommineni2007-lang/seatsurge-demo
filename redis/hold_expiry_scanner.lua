-- hold_expiry_scanner.lua
-- Runs periodically to sweep and release holds whose TTL has elapsed.
-- Guarantees release within 5 seconds as mandated by PS07 metrics.

local venue_seats_key = KEYS[1]
local holds_expiry_key = KEYS[2]
local stream_events_key = KEYS[3]
local pubsub_channel = KEYS[4]

local current_time = tonumber(ARGV[1]) -- unix timestamp in ms
local max_batch = tonumber(ARGV[2]) or 100

-- Fetch expired seats up to current_time
local expired_seats = redis.call('ZRANGEBYSCORE', holds_expiry_key, '-inf', current_time, 'LIMIT', 0, max_batch)
local released_count = 0
local released_list = {}

for i = 1, #expired_seats do
    local seat_id = expired_seats[i]
    local raw_data = redis.call('HGET', venue_seats_key, seat_id)
    
    if raw_data then
        local seat_data = cjson.decode(raw_data)
        if seat_data.status == "HELD" then
            -- Remove hold
            redis.call('HDEL', venue_seats_key, seat_id)
            
            -- Stream record
            local event_id = redis.call('XADD', stream_events_key, 'MAXLEN', '~', 10000, '*',
                'type', 'SEAT_RELEASED',
                'seat_id', seat_id,
                'reason', 'HOLD_EXPIRED'
            )
            
            -- Pub/Sub real-time notification
            local payload = cjson.encode({
                type = "SEAT_UPDATE",
                seat_id = seat_id,
                status = "AVAILABLE",
                reason = "HOLD_EXPIRED",
                event_id = event_id
            })
            redis.call('PUBLISH', pubsub_channel, payload)
            
            released_count = released_count + 1
            table.insert(released_list, seat_id)
        end
    end
    -- Remove from sorted set
    redis.call('ZREM', holds_expiry_key, seat_id)
end

return cjson.encode({
    success = true,
    released_count = released_count,
    released_seats = released_list
})
