-- atomic_seat_release.lua
-- Safely releases a held seat if requested by holder or admin.
-- Removes hold, clears expiry tracking, pushes to event stream and pubsub.

local venue_seats_key = KEYS[1]
local holds_expiry_key = KEYS[2]
local stream_events_key = KEYS[3]
local pubsub_channel = KEYS[4]

local seat_id = ARGV[1]
local user_id = ARGV[2] -- requesting user or "SYSTEM" / "ADMIN"

local raw_data = redis.call('HGET', venue_seats_key, seat_id)
if not raw_data then
    return cjson.encode({ success = true, seat_id = seat_id, message = "Seat was not held" })
end

local seat_data = cjson.decode(raw_data)
if seat_data.status == "SOLD" then
    return cjson.encode({ success = false, error = "CANNOT_RELEASE_SOLD_SEAT", message = "Seat is already confirmed as sold" })
end

-- Validate ownership if not admin/system
if user_id ~= "SYSTEM" and user_id ~= "ADMIN" and seat_data.held_by and seat_data.held_by ~= user_id then
    return cjson.encode({ success = false, error = "NOT_SEAT_HOLDER", message = "You do not own the hold on this seat" })
end

-- Reset seat to AVAILABLE (preserve row, number, tier, price)
seat_data.status = "AVAILABLE"
seat_data.held_by = nil
seat_data.held_at = nil
seat_data.expires_at = nil
redis.call('HSET', venue_seats_key, seat_id, cjson.encode(seat_data))
redis.call('ZREM', holds_expiry_key, seat_id)

local event_id = redis.call('XADD', stream_events_key, 'MAXLEN', '~', 10000, '*',
    'type', 'SEAT_RELEASED',
    'seat_id', seat_id,
    'released_from', tostring(seat_data.held_by or "unknown")
)

local pubsub_payload = cjson.encode({
    type = "SEAT_UPDATE",
    seat_id = seat_id,
    status = "AVAILABLE",
    event_id = event_id
})
redis.call('PUBLISH', pubsub_channel, pubsub_payload)

return cjson.encode({
    success = true,
    seat_id = seat_id,
    status = "AVAILABLE"
})
