-- pandya.ai Game Logic Script
function setup()
    -- Initialize game state and pieces here
    print("Game setup")
end

function get_actions(player)
    -- Return available actions for the given player
    return {}
end

function on_move(action_id, player, payload)
    -- Handle moves
    print("Move applied")
end

function check_win()
    -- Check if a player has won
    return -1
end
