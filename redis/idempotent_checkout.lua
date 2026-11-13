-- idempotent_checkout.lua
-- Guarantees atomic seat confirmation and strict payment idempotency.
-- Prevents duplicate charges and eliminates double-booking race conditions.

local venue_seats_key = KEYS[1]
local holds_expiry_key = KEYS[2]
local stream_events_key = KEYS[3]
local pubsub_channel = KEYS[4]
local idempotency_key = KEYS[5]       -- e.g. idempotency:req_abc123

local seats_json = ARGV[1]            -- ["A-12", "A-13"]
local user_id = ARGV[2]
local amount = tonumber(ARGV[3]) or 0
local current_time = tonumber(ARGV[4])
local booking_id = ARGV[5]

-- 1. Check if idempotency key was already processed
local existing_result = redis.call('GET', idempotency_key)
if existing_result then
    local cached = cjson.decode(existing_result)
    cached.is_idempotent_replay = true
    return cjson.encode(cached)
end

local seats = cjson.decode(seats_json)
if #seats < 1 then
    return cjson.encode({ success = false, error = "NO_SEATS_SPECIFIED" })
end

-- 2. Verify all seats are still held by this exact user
for i = 1, #seats do
    local seat_id = seats[i]
    local raw = redis.call('HGET', venue_seats_key, seat_id)
    if not raw then
        return cjson.encode({
            success = false,
            error = "HOLD_EXPIRED",
            seat_id = seat_id,
            message = "Hold on seat " .. seat_id .. " has expired"
        })
    end
    local seat_data = cjson.decode(raw)
    if seat_data.status ~= "HELD" or seat_data.held_by ~= user_id then
        return cjson.encode({
            success = false,
            error = "HOLD_INVALID",
            seat_id = seat_id,
            message = "Seat " .. seat_id .. " is not held by you"
        })
    end
end

-- 3. Confirm all seats as SOLD
local confirmed_seats = {}
for i = 1, #seats do
    local seat_id = seats[i]
    local sold_record = {
        seat_id = seat_id,
        status = "SOLD",
        booked_by = user_id,
        booking_id = booking_id,
        booked_at = current_time,
        price = math.floor(amount / #seats)
    }
    redis.call('HSET', venue_seats_key, seat_id, cjson.encode(sold_record))
    redis.call('ZREM', holds_expiry_key, seat_id)

    local event_id = redis.call('XADD', stream_events_key, 'MAXLEN', '~', 10000, '*',
        'type', 'SEAT_SOLD',
        'seat_id', seat_id,
        'user_id', user_id,
        'booking_id', booking_id
    )

    local pubsub_payload = cjson.encode({
        type = "SEAT_UPDATE",
        seat_id = seat_id,
        status = "SOLD",
        booked_by = user_id,
        booking_id = booking_id,
        event_id = event_id
    })
    redis.call('PUBLISH', pubsub_channel, pubsub_payload)
    table.insert(confirmed_seats, seat_id)
end

local response = {
    success = true,
    booking_id = booking_id,
    user_id = user_id,
    seats = confirmed_seats,
    total_amount = amount,
    confirmed_at = current_time,
    is_idempotent_replay = false
}

-- Cache idempotency result for 24 hours (86400 seconds)
redis.call('SET', idempotency_key, cjson.encode(response), 'EX', 86400)

return cjson.encode(response)
