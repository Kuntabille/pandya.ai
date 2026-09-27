#!/usr/bin/env node
"use strict";var O=Object.create;var b=Object.defineProperty;var R=Object.getOwnPropertyDescriptor;var B=Object.getOwnPropertyNames;var q=Object.getPrototypeOf,M=Object.prototype.hasOwnProperty;var J=(e,t,a,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of B(t))!M.call(e,n)&&n!==a&&b(e,n,{get:()=>t[n],enumerable:!(o=R(t,n))||o.enumerable});return e};var i=(e,t,a)=>(a=e!=null?O(q(e)):{},J(t||!e||!e.__esModule?b(a,"default",{value:e,enumerable:!0}):a,e));var I=require("commander");var j=i(require("express")),C=i(require("open")),v=i(require("fs")),T=i(require("path")),_=T.default.join(process.cwd(),".pandya-token");async function A(e){return new Promise((t,a)=>{let o=(0,j.default)(),n=3001;o.get("/callback",(s,r)=>{let c=s.query.token;c?(v.default.writeFileSync(_,c,"utf-8"),r.send("<h1>Login successful!</h1><p>You can close this window and return to the CLI.</p>"),console.log("Login successful! Token saved."),l.close(),t(),setTimeout(()=>process.exit(0),100)):(r.status(400).send("No token provided"),a(new Error("No token provided")))});let l=o.listen(n,async()=>{let s=`${e}/cli-login?redirect=http://localhost:${n}/callback`;console.log("Opening browser to authenticate..."),console.log(`If the browser does not open, please navigate to: ${s}`);try{await(0,C.default)(s)}catch(r){console.error("Failed to open browser:",r)}})})}function x(){return v.default.existsSync(_)?v.default.readFileSync(_,"utf-8").trim():null}var f=i(require("fs")),h=i(require("path"));async function E(e){let t=h.default.resolve(process.cwd(),e);f.default.existsSync(t)||f.default.mkdirSync(t,{recursive:!0});let a=`-- pandya.ai Game Logic Script
-- Engine hooks: setup(players), get_actions(), on_move(player_index, action_id, move), check_win()
-- Use the get_lua_libraries MCP tool for the full Lua API reference.

function setup(players)
    -- 'players' is a 1-indexed table of { id = <user id>, index = <0-based index> }.
    -- Create every piece here with game.place_piece(def_id, "col,row", owner_index).
end

function get_actions()
    -- Return an array of { id = "...", name = "...", type = "..." } action definitions.
    -- get_actions() must return at least one action.
    return {
        { id = "end_turn", name = "End Turn", type = "button" }
    }
end

function on_move(player_index, action_id, move)
    -- Return two values: true on success, or false plus a human-readable reason.
    if action_id == "end_turn" then
        game.end_turn()
        return true, ""
    end
    return false, "Unknown action: " .. tostring(action_id)
end

function check_win()
    -- Return { winner = player_index } or { draw = true } to end the game, else nil.
    return nil
end
`,o=`{
  "name": "${h.default.basename(t)}",
  "description": "A newly scaffolded Pandya game.",
  "players": {
    "min_players": 2,
    "max_players": 2,
    "turn_order": "sequential"
  },
  "board": {
    "width": 800,
    "height": 600,
    "zones": []
  },
  "pieces": [],
  "rules": [],
  "actions": [],
  "phases": [],
  "variations": [
    {
      "id": "default",
      "name": "Default",
      "description": "The base game rules without any variations applied."
    }
  ]
}
`;f.default.writeFileSync(h.default.join(t,"logic.lua"),a,"utf-8"),f.default.writeFileSync(h.default.join(t,"canvas.json"),o,"utf-8"),console.log(`Successfully initialized game assets in ${t}`),console.log("Created: logic.lua, canvas.json")}var y=i(require("fs")),k=i(require("path")),G=i(require("axios"));async function K(e,t,a=!1){let o=x();if(!o)throw new Error('Not authenticated. Please run "pandya login" first.');let n=process.cwd(),l=k.default.join(n,"logic.lua"),s=k.default.join(n,"canvas.json");if(!y.default.existsSync(l))throw new Error("Missing required files. Ensure logic.lua exists in the current directory.");let r=y.default.readFileSync(l,"utf-8"),c;if(y.default.existsSync(s))try{c=JSON.parse(y.default.readFileSync(s,"utf-8"))}catch(p){throw new Error(`Failed to parse canvas.json: ${p.message}`)}let u=`${t}/gameauthor.GameAuthorService/UpdateGameDefinition`,w={id:e,lua_script:r,create_version:!0};if(c&&(w.gdl=c),await G.default.post(u,w,{headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"}}),a){let p=`${t}/gameauthor.GameAuthorService/PublishGameDefinition`;await G.default.post(p,{id:e,is_public:!0},{headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"}})}}async function U(e,t){try{await K(e,t,!1),console.log("Successfully pushed game assets! Refresh the browser to play/test.")}catch(a){console.error("Failed to push game:",a.response?.data||a.message),process.exit(1)}}var m=i(require("fs")),g=i(require("path")),D=i(require("adm-zip")),P=i(require("axios"));function F(e,t){let a=g.default.resolve(e);m.default.existsSync(a)||(console.error(`Directory not found: ${a}`),process.exit(1));let o=g.default.join(a,"logic.lua"),n=g.default.join(a,"canvas.json");(!m.default.existsSync(n)||!m.default.existsSync(o))&&(console.error("Missing required files. A package must contain at least canvas.json and logic.lua"),process.exit(1));let l;try{l=JSON.parse(m.default.readFileSync(n,"utf-8"))}catch(u){console.error(`Failed to parse canvas.json: ${u.message}`),process.exit(1)}let s=t||(l.name||"game").toLowerCase().replace(/[^a-z0-9]/g,"_")+".pgame",r=g.default.resolve(s),c=new D.default;c.addLocalFile(n),c.addLocalFile(o),c.writeZip(r),console.log(`\u2705 Successfully packaged game into ${r}`)}async function L(e,t){let a=g.default.resolve(e);m.default.existsSync(a)||(console.error(`Package not found: ${a}`),process.exit(1));let o=x();o||(console.error('Not authenticated. Please run "pandya login" first.'),process.exit(1)),console.log(`\u{1F4E6} Extracting ${e}...`);let n=new D.default(a),l=n.getEntry("canvas.json"),s=n.getEntry("logic.lua");(!l||!s)&&(console.error("Invalid package: Missing canvas.json or logic.lua inside the archive."),process.exit(1));let r=JSON.parse(l.getData().toString("utf-8")),c=s.getData().toString("utf-8"),u=r.name||"scaffolded-game",w=r.description||"Uploaded via Pandya SDK";console.log(`\u{1F680} Creating game: ${u}...`);try{let p=`${t}/gameauthor.GameAuthorService/CreateGameDefinition`,z={name:u,description:w},S=(await P.default.post(p,z,{headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"}})).data.gameDefinition?.id;if(!S)throw new Error("Server returned success but no game ID was provided.");console.log(`\u2705 Game created with ID: ${S}. Uploading assets...`);let N=`${t}/gameauthor.GameAuthorService/UpdateGameDefinition`,$={id:S,lua_script:c,create_version:!0};r&&($.gdl=r),await P.default.post(N,$,{headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"}}),console.log("\u{1F389} Successfully uploaded package!"),console.log(`\u{1F3AE} Play test it here: ${t.replace("api.","")}/lobby`)}catch(p){console.error("\u274C Failed to upload game:",p.response?.data||p.message),process.exit(1)}}var d=new I.Command;d.name("pandya").description("CLI and SDK for pandya.ai game authoring").version("1.0.0");d.command("login").description("Login to pandya.ai (or a local instance) via OAuth").option("-h, --host <url>","The pandya instance URL","https://pandya.ai").action(async e=>{await A(e.host)});d.command("init").description("Scaffold a new game in the current directory").argument("[directory]","Directory to initialize (defaults to current)",".").action(async e=>{await E(e)});d.command("push").description("Push game assets to pandya.ai for testing (Updates Draft)").argument("<gameId>","The ID of the game to push assets to").option("-h, --host <url>","The pandya instance URL","https://pandya.ai").action(async(e,t)=>{await U(e,t.host)});d.command("package").description("Package a game directory into a .pgame archive").argument("[directory]","Directory containing the game files",".").option("-o, --out <filename>","Output filename (e.g. game.pgame)").action((e,t)=>{F(e,t.out)});d.command("upload").description("Upload a .pgame archive to pandya.ai (Creates a Draft game)").argument("<package>","Path to the .pgame file").option("-h, --host <url>","The pandya instance URL","https://pandya.ai").action(async(e,t)=>{await L(e,t.host)});d.parse();
