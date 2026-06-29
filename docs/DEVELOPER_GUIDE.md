# Developer Guide: Building Board Games

Pandya.ai is a highly extensible, real-time multiplayer board game platform. Developers can build and add games to the platform using two distinct methods:

1. **Dynamic Games (Recommended)**: Created using the Visual Canvas Designer and AI-powered Lua scripts. The system automatically compiles the game definition, generates high-fidelity React interfaces using standard gaming primitives, and runs them within a sandboxed Go-Lua engine. No server redeployments or backend compiling are required.
2. **Hardcoded Games**: Built by modifying the Protobuf APIs, writing custom Go state engines, registering handlers, and compiling custom React frontends. Best for performance-critical or non-standard visual structures.

This guide details both approaches, with a primary focus on showing a full, end-to-end workflow for implementing **Checkers** dynamically.

---

## 🏗️ 1. Dynamic Game Development (Lua & React)

Dynamic games are defined via a game definition bundle consisting of **Canvas GDL (JSON)** and a **Lua Logic Script**. The UI Agent translates the layout and rules into a dynamic React board rendering component.

### The Game Schema and State Contracts

#### 1. The Canvas JSON (GDL)
The GDL defines the spatial setup, grid/hex dimensions, piece templates, and visual properties of the board.

```json
{
  "name": "Checkers",
  "description": "A classic board game of strategy.",
  "players": { "minPlayers": 2, "maxPlayers": 2 },
  "board": { "width": 800, "height": 800, "type": "grid" },
  "pieceTemplates": [
    {
      "id": "pawn_red",
      "name": "Red Pawn",
      "visual": { "color": "#e74c3c", "shape": "circle", "icon": "🔴" }
    },
    {
      "id": "pawn_black",
      "name": "Black Pawn",
      "visual": { "color": "#2c3e50", "shape": "circle", "icon": "⚫" }
    }
  ],
  "setup": {
    "zones": [
      {
        "id": "main_board",
        "layout": "grid",
        "layoutConfig": { "rows": 8, "cols": 8 }
      }
    ]
  }
}
```

#### 2. The Game State Payload
The reactive client state, referred to as `gameState`, is streamed in real-time from the backend to the frontend components:

```typescript
interface GameState {
  pieces: Array<{
    id: string;          // Unique instance ID, e.g. "0", "1"
    position: string;    // "col,row" coordinate, e.g. "4,2"
    ownerIndex: number;  // 0-based index of owner
    definitionId: string; // References pieceTemplate ID
    properties?: Record<string, any>;
  }>;
  currentPlayerIndex: number;
  turnNumber: number;
  gameOver: boolean;
  winnerPlayerIndex: number; // -1 if active
  players: Array<{ id: string; index: number }>;
  variables?: Record<string, any>; // Arbitrary key-value store set by Lua
}
```

---

## 🕹️ 2. Step-by-Step Walkthrough: Implementing Checkers

Here is the full end-to-end setup for implementing a classic game of Checkers on Pandya.ai.

### Step 1: Spatial Canvas Design (GDL)
We design an 8x8 checkerboard. Player 1 (Red) starts at the bottom (rows 5 to 7), and Player 2 (Black) starts at the top (rows 0 to 2). Pieces move diagonally, only on dark squares.

```json
{
  "name": "Checkers",
  "description": "A classic board game of strategy.",
  "players": { "minPlayers": 2, "maxPlayers": 2 },
  "board": {
    "width": 600,
    "height": 600,
    "type": "grid"
  },
  "pieceTemplates": [
    { "id": "pawn_p1", "name": "Red Pawn", "visual": { "color": "#e74c3c", "icon": "🔴" } },
    { "id": "pawn_p2", "name": "Black Pawn", "visual": { "color": "#2c3e50", "icon": "⚫" } }
  ],
  "setup": {
    "zones": [
      {
        "id": "board",
        "layout": "grid",
        "layoutConfig": { "rows": 8, "cols": 8 }
      }
    ]
  }
}
```

### Step 2: Write the Lua Logic Script
Save this logic to regulate the rules. It uses the preloaded Host APIs to query board pieces, validate moves, delete captured targets, and verify victory state.

```lua
-- Checkers Game Rules

-- Called when the match initializes
function setup(players)
    -- Place Player 1 (Red) pieces on dark squares of rows 5, 6, 7
    local p1 = {"0,5","2,5","4,5","6,5","1,6","3,6","5,6","7,6","0,7","2,7","4,7","6,7"}
    for _, pos in ipairs(p1) do
        game.place_piece("pawn_p1", pos, 0)
    end
    
    -- Place Player 2 (Black) pieces on dark squares of rows 0, 1, 2
    local p2 = {"1,0","3,0","5,0","7,0","0,1","2,1","4,1","6,1","1,2","3,2","5,2","7,2"}
    for _, pos in ipairs(p2) do
        game.place_piece("pawn_p2", pos, 1)
    end
end

-- Validates and applies move attempts from players
function on_move(player_index, action_id, move)
    if action_id ~= "move" then return false end

    -- Verify the source coordinates contain a piece owned by the active player
    local p = board.get_piece(move.from)
    if not p then return false end
    if p.owner_index ~= player_index then return false end
    
    -- Destination square must be empty and on-board
    if not board.is_empty(move.target_cell) then return false end

    -- Moves must be strictly diagonal
    if not util.is_diagonal(move.from, move.target_cell) then return false end

    local dist = util.distance(move.from, move.target_cell)

    if dist == 1 then
        -- Simple move: apply position update
        game.move_piece(p.id, move.target_cell)
    elseif dist == 2 then
        -- Jump: midpoint must contain an opponent piece to capture
        local mid = util.midpoint(move.from, move.target_cell)
        local mid_piece = board.get_piece(mid)
        if not mid_piece or mid_piece.owner_index == player_index then
            return false
        end
        game.move_piece(p.id, move.target_cell)
        game.remove_piece_at(mid)
    else
        -- Moves greater than 2 squares are invalid in a single step
        return false
    end

    game.end_turn()
    return true
end

-- Evaluates victory status after each move
function check_win()
    if util.count_pieces(0) == 0 then return {winner = 1} end
    if util.count_pieces(1) == 0 then return {winner = 0} end
    return nil
end

-- Informs the UI Agent what interaction triggers to wire up
function get_actions()
    return {
        { id = "move", name = "Move Piece", type = "selectPieceThenCell" }
    }
end
```

### Step 3: Author the React Component
The UI Agent generates a polished React canvas wrapper utilizing CSS layouts.

```jsx
const CheckersBoard = ({ gameState, onMove, currentPlayerId, gdl }) => {
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  // Extract dimensions and construct grid cells
  const rows = gdl.setup.zones[0].layoutConfig.rows || 8;
  const cols = gdl.setup.zones[0].layoutConfig.cols || 8;

  // Build grid of piece placements
  const boardState = {};
  gameState.pieces.forEach((piece) => {
    boardState[piece.position] = piece;
  });

  const handleCellClick = (col, row) => {
    const coord = `${col},${row}`;
    const piece = boardState[coord];

    // Check if clicking own piece
    if (piece && String(piece.ownerIndex) === currentPlayerId) {
      setSelectedPiece(piece);
      // Pre-compute visual highlight vectors (diagonals 1 & 2 cells away)
      const moves = [];
      const directions = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      directions.forEach(([dc, dr]) => {
        const c1 = col + dc;
        const r1 = row + dr;
        if (c1 >= 0 && c1 < cols && r1 >= 0 && r1 < rows) {
          moves.push(`${c1},${r1}`);
        }
        const c2 = col + dc * 2;
        const r2 = row + dr * 2;
        if (c2 >= 0 && c2 < cols && r2 >= 0 && r2 < rows) {
          moves.push(`${c2},${r2}`);
        }
      });
      setValidMoves(moves);
    } else if (selectedPiece && validMoves.includes(coord)) {
      // Dispatches move payload to backend Lua engine
      onMove({
        actionId: "move",
        piece_id: selectedPiece.id,
        from: selectedPiece.position,
        target_cell: coord,
      });
      setSelectedPiece(null);
      setValidMoves([]);
    } else {
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  // Determine board rotation matrix based on seat perspective
  const shouldRotate = currentPlayerId === "1";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 70px)`,
          gridTemplateRows: `repeat(${rows}, 70px)`,
          border: "4px solid #3e2723",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          transform: shouldRotate ? "rotate(180deg)" : "none",
          transition: "transform 0.5s ease",
          background: "#d7ccc8",
        }}
      >
        {Array.from({ length: rows }).map((_, r) => {
          return Array.from({ length: cols }).map((_, c) => {
            const coord = `${c},${r}`;
            const piece = boardState[coord];
            const isDark = (c + r) % 2 === 1;
            const isSelected = selectedPiece && selectedPiece.position === coord;
            const isHighlighted = validMoves.includes(coord);

            return (
              <div
                key={coord}
                onClick={() => handleCellClick(c, r)}
                style={{
                  width: "70px",
                  height: "70px",
                  backgroundColor: isHighlighted
                    ? "#81c784"
                    : isSelected
                    ? "#ffe082"
                    : isDark
                    ? "#5d4037"
                    : "#efebe9",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: isDark ? "pointer" : "default",
                  position: "relative",
                }}
              >
                {piece && (
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      backgroundColor: piece.definitionId === "pawn_p1" ? "#e74c3c" : "#2c3e50",
                      border: "3px solid #fff",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: "18px",
                      transform: shouldRotate ? "rotate(180deg)" : "none",
                      transition: "transform 0.5s ease",
                    }}
                  >
                    {piece.definitionId === "pawn_p1" ? "R" : "B"}
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

// CRITICAL: Must include evaluation rendering trigger as the last statement for react-live evaluation
render(<CheckersBoard {...props} />);
```

---

## 🛠️ 3. Lua Sandboxed Environment Host API Reference

The sandboxed Lua VM injects structured modules to bridge board operations back into the Go backend manager:

### `board` Namespace
- `board.get_piece(position)`: Checks location. Returns a piece instance table containing `{ id, definition_id, owner_id, position, owner_index, properties }` or `nil` if unoccupied.
- `board.is_empty(position)`: Returns `true` if coordinates are empty or off the board coordinates.
- `board.width()`: Returns integer columns.
- `board.height()`: Returns integer rows.

### `game` Namespace
- `game.place_piece(definition_id, position, owner_index)`: Places a new piece template instance at coordinates. Returns the generated unique string ID.
- `game.move_piece(piece_id, target_position)`: Teleports piece, clearing its origin cell automatically.
- `game.remove_piece(piece_id)`: Un-registers and deletes the piece from the board.
- `game.remove_piece_at(position)`: Deletes whatever piece is occupying the cell.
- `game.end_turn()`: Advances current player seat and increments turn tracker.
- `game.declare_winner(player_index)`: Concludes the match and records the winner ID.
- `game.set_var(key, value)`: Stores arbitrary values/arrays in the global state sync variables.
- `game.get_var(key)`: Retrieves stored state variables.
- `game.current_player()`: Returns the integer index of the active player.
- `game.turn_number()`: Returns active turn counter.
- `game.player_count()`: Returns number of players seated.

### `piece` Namespace
- `piece.owner(piece_id)`: Returns piece's owner index.
- `piece.position(piece_id)`: Returns piece's position string.
- `piece.get_attr(piece_id, key)`: Retrieves custom piece state variable.
- `piece.set_attr(piece_id, key, value)`: Updates custom piece attribute.
- `piece.set_attrs(piece_id, table)`: Batch writes attributes to a piece instance.

### `util` Namespace
- `util.distance(pos1, pos2)`: Returns Chebyshev distance between two grids.
- `util.is_diagonal(pos1, pos2)`: Returns `true` if paths form a clean 45-degree angle.
- `util.is_adjacent(pos1, pos2)`: Returns `true` if coordinates border each other.
- `util.midpoint(pos1, pos2)`: Returns midpoint coordinates, e.g. `2,2` for `0,0` to `4,4`.
- `util.count_pieces(owner_index)`: Returns active piece count remaining.
- `util.abs(n)`: Standard absolute function.
- `util.create_standard_deck()`: Spawns standard 52-card dataset array.
- `util.shuffle(table)`: Performs Fisher-Yates array shuffling on list tables.

### `zone` Namespace (Preloaded Tabletop Library)
- `zone.init(zone_id)`: Initializes a zone variable under key `"zone_" .. zone_id`.
- `zone.add(zone_id, item)`: Appends an item to the designated zone.
- `zone.remove(zone_id, match_key, match_val)`: Traverses the zone, removes and returns the first item matching the property/key value.
- `zone.has(zone_id, match_key, match_val)`: Returns `true` if any item in the zone matches the property/key value.
- `zone.get(zone_id)`: Returns the array of items in the zone.
- `zone.set(zone_id, items)`: Replaces the zone array.
- `zone.size(zone_id)`: Returns the number of items in the zone.

### `deck` Namespace (Preloaded Card Library)
- `deck.new(deck_var_name, card_templates)`: Generates a shuffled deck of card objects and registers it under `deck_var_name`.
- `deck.shuffle(deck_var_name)`: Shuffles the designated deck in-place.
- `deck.draw(deck_var_name, player_index, count)`: Draws `count` cards from the top of the deck and places them into `"zone_hand_" .. player_index`. Returns the list of drawn cards.
- `deck.peek(deck_var_name, count)`: Returns a copy of the top `count` cards in the deck without removing them.
- `deck.insert_top(deck_var_name, card)`: Inserts a card onto the top of the deck.
- `deck.insert_bottom(deck_var_name, card)`: Inserts a card at the bottom of the deck.
- `deck.size(deck_var_name)`: Returns the number of cards in the deck.

### `hand` Namespace (Preloaded Hand Library)
- `hand.new(player_index)`: Initializes a hand zone under `"zone_hand_" .. player_index`.
- `hand.add_card(player_index, card)`: Adds a card object to the player's hand zone.
- `hand.remove_card(player_index, match_key, match_val)`: Removes and returns a matching card from the player's hand.
- `hand.has_card(player_index, match_key, match_val)`: Returns `true` if the player has a matching card.
- `hand.get(player_index)`: Returns the list of cards in the player's hand.
- `hand.set(player_index, cards)`: Replaces the player's hand array.

---

## 🏗️ 4. Adding a Hardcoded Game (Native Go)

For complex multiplayer boards requiring custom network messaging payloads (e.g. non-standard JSON transforms), you can add a static Go engine.

### Step 1: Define Protobuf Messages (`api/proto/`)
Add your game to the registration enum in `api/proto/lobby.proto` and build move payloads in `api/proto/game.proto`:

```protobuf
// api/proto/game.proto
message CheckersMove {
  string from_cell = 1;
  string target_cell = 2;
  string piece_id = 3;
}

message CheckersState {
  repeated string board_squares = 1;
  // ... custom structured state fields
}
```
Run compilation scripts:
```bash
make proto
cd ui && npm run proto
```

### Step 2: Implement Game Engine Interface (`internal/game/`)
Create a struct implementing the standard `Game` interface defined in `internal/game/game.go`:

```go
type CheckersEngine struct{}

func (e *CheckersEngine) ApplyMove(state *gamev1.GameState, move *gamev1.GameMove) (*gamev1.GameState, error) {
    // 1. Unmarshal move payload
    // 2. Validate move coordinates against rules
    // 3. Mutate Board state structure
    // 4. Return new state
    return state, nil
}
```
Register the engine inside `cmd/server/main.go` using `gameService.RegisterEngine()`.

### Step 3: Frontend Setup
1. Define visual styles in `ui/src/game-ui/tokens.css` inside a `[data-game="checkers"]` block.
2. Build custom wrapper board component `CheckersBoard.tsx` receiving `GameBoardProps`.
3. Register your component in `ui/src/components/GameBoard.tsx` using a case block.

---

## ✅ Checklist for New Games
- [ ] Registered the game ID in `lobby.proto` / `lobby.v1.LobbyService`.
- [ ] GDL canvas setup definitions successfully validate using `/gameauthor.v1.GameAuthorService/ValidateGDL`.
- [ ] Lua action hooks match React UI event triggers exactly.
- [ ] Verified that state attributes in UI React match backend field case (camelCase vs snake_case).
- [ ] UI board component supports dynamic rotation for active player perspectives.
- [ ] Board handles spectator mode securely, redacting sensitive hidden data.
- [ ] Added a simulation test to `luaengine/simulator_test.go` or unit test to the Go engine.

---

## 🤖 5. AI Agent Integrations (MCP & A2A)

Pandya.ai provides specialized endpoints designed for external AI agents (like Claude or Antigravity) to autonomously author or debug games:

### Model Context Protocol (MCP)
Agents can use the provided SSE-based MCP server to validate their code against the engine directly from their IDEs (like Cursor or Windsurf) or desktop apps (like Claude Desktop).
1. Configure your agent with the SSE URL: `https://pandya.ai/mcp/sse`
2. Tools provided include `validate_game_code` (checks React-to-Lua contract matching) and `simulate_game_logic` (runs the Lua VM headless to ensure state stability).
*You can find ready-to-use plugin configurations in the root of the `pandya-community` repository.*

### Agent-to-Agent (A2A) Endpoints
For fully autonomous orchestrators, Pandya exposes direct Chat Completions endpoints in `internal/gameauthor/service.go`.
1. **Agent Card**: `GET /a2a/app/.well-known/agent-card.json`
2. **Chat Pipeline**: `POST /a2a/chat`
These bypass the standard UI/auth flows, accepting raw system prompts and piping them directly into the Go-based `SupervisorAgent` for multi-stage game generation.
