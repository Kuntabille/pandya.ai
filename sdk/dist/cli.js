#!/usr/bin/env node
"use strict";var B=Object.create;var _=Object.defineProperty;var R=Object.getOwnPropertyDescriptor;var q=Object.getOwnPropertyNames;var J=Object.getPrototypeOf,K=Object.prototype.hasOwnProperty;var H=(t,e,o,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of q(e))!K.call(t,a)&&a!==o&&_(t,a,{get:()=>e[a],enumerable:!(n=R(e,a))||n.enumerable});return t};var r=(t,e,o)=>(o=t!=null?B(J(t)):{},H(e||!t||!t.__esModule?_(o,"default",{value:t,enumerable:!0}):o,t));var N=require("commander");var T=r(require("express")),F=r(require("open")),x=r(require("fs")),A=r(require("path")),D=A.default.join(process.cwd(),".pandya-token");async function E(t){return new Promise((e,o)=>{let n=(0,T.default)(),a=3001;n.get("/callback",(i,s)=>{let c=i.query.token;c?(x.default.writeFileSync(D,c,"utf-8"),s.send("<h1>Login successful!</h1><p>You can close this window and return to the CLI.</p>"),console.log("Login successful! Token saved."),p.close(),e(),setTimeout(()=>process.exit(0),100)):(s.status(400).send("No token provided"),o(new Error("No token provided")))});let p=n.listen(a,async()=>{let i=`${t}/cli-login?redirect=http://localhost:${a}/callback`;console.log("Opening browser to authenticate..."),console.log(`If the browser does not open, please navigate to: ${i}`);try{await(0,F.default)(i)}catch(s){console.error("Failed to open browser:",s)}})})}function k(){return x.default.existsSync(D)?x.default.readFileSync(D,"utf-8").trim():null}var h=r(require("fs")),v=r(require("path"));async function L(t){let e=v.default.resolve(process.cwd(),t);h.default.existsSync(e)||h.default.mkdirSync(e,{recursive:!0});let o=`-- pandya.ai Game Logic Script
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
`,n=`import React from 'react';

export default function CustomGameBoard({ gameState, onMove }: any) {
  return (
    <div style={{ padding: 20, color: 'white' }}>
      <h1>My Pandya Game</h1>
      <pre>{JSON.stringify(gameState, null, 2)}</pre>
      <button onClick={() => onMove('custom_action', {})}>
        Test Move
      </button>
    </div>
  );
}
`,a=`{
  "name": "${v.default.basename(e)}",
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
`;h.default.writeFileSync(v.default.join(e,"logic.lua"),o,"utf-8"),h.default.writeFileSync(v.default.join(e,"component.tsx"),n,"utf-8"),h.default.writeFileSync(v.default.join(e,"canvas.json"),a,"utf-8"),console.log(`Successfully initialized game assets in ${e}`),console.log("Created: logic.lua, component.tsx, canvas.json")}var u=r(require("fs")),G=r(require("path")),j=r(require("axios"));async function Z(t,e,o=!1){let n=k();if(!n)throw new Error('Not authenticated. Please run "pandya login" first.');let a=process.cwd(),p=G.default.join(a,"logic.lua"),i=G.default.join(a,"component.tsx"),s=G.default.join(a,"canvas.json");if(!u.default.existsSync(p)||!u.default.existsSync(i))throw new Error("Missing required files. Ensure logic.lua and component.tsx exist in the current directory.");let c=u.default.readFileSync(p,"utf-8"),l=u.default.readFileSync(i,"utf-8"),m;if(u.default.existsSync(s))try{m=JSON.parse(u.default.readFileSync(s,"utf-8"))}catch(d){throw new Error(`Failed to parse canvas.json: ${d.message}`)}let w=`${e}/gameauthor.GameAuthorService/UpdateGameDefinition`,S={id:t,lua_script:c,ui_component_code:l,create_version:!0};if(m&&(S.gdl=m),await j.default.post(w,S,{headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"}}),o){let d=`${e}/gameauthor.GameAuthorService/PublishGameDefinition`;await j.default.post(d,{id:t,is_public:!0},{headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"}})}}async function U(t,e){try{await Z(t,e,!1),console.log("Successfully pushed game assets! Refresh the browser to play/test.")}catch(o){console.error("Failed to push game:",o.response?.data||o.message),process.exit(1)}}var g=r(require("fs")),f=r(require("path")),C=r(require("adm-zip")),$=r(require("axios"));function z(t,e){let o=f.default.resolve(t);g.default.existsSync(o)||(console.error(`Directory not found: ${o}`),process.exit(1));let n=f.default.join(o,"logic.lua"),a=f.default.join(o,"component.tsx"),p=f.default.join(o,"canvas.json");(!g.default.existsSync(p)||!g.default.existsSync(n)||!g.default.existsSync(a))&&(console.error("Missing required files. A package must contain at least canvas.json, logic.lua, and component.tsx"),process.exit(1));let i;try{i=JSON.parse(g.default.readFileSync(p,"utf-8"))}catch(m){console.error(`Failed to parse canvas.json: ${m.message}`),process.exit(1)}let s=e||(i.name||"game").toLowerCase().replace(/[^a-z0-9]/g,"_")+".pgame",c=f.default.resolve(s),l=new C.default;l.addLocalFile(p),l.addLocalFile(n),l.addLocalFile(a),l.writeZip(c),console.log(`\u2705 Successfully packaged game into ${c}`)}async function I(t,e){let o=f.default.resolve(t);g.default.existsSync(o)||(console.error(`Package not found: ${o}`),process.exit(1));let n=k();n||(console.error('Not authenticated. Please run "pandya login" first.'),process.exit(1)),console.log(`\u{1F4E6} Extracting ${t}...`);let a=new C.default(o),p=a.getEntry("canvas.json"),i=a.getEntry("logic.lua"),s=a.getEntry("component.tsx");(!p||!i||!s)&&(console.error("Invalid package: Missing canvas.json, logic.lua, or component.tsx inside the archive."),process.exit(1));let c=JSON.parse(p.getData().toString("utf-8")),l=i.getData().toString("utf-8"),m=s.getData().toString("utf-8"),w=c.name||"scaffolded-game",S=c.description||"Uploaded via Pandya SDK";console.log(`\u{1F680} Creating game: ${w}...`);try{let d=`${e}/gameauthor.GameAuthorService/CreateGameDefinition`,M={name:w,description:S},P=(await $.default.post(d,M,{headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"}})).data.gameDefinition?.id;if(!P)throw new Error("Server returned success but no game ID was provided.");console.log(`\u2705 Game created with ID: ${P}. Uploading assets...`);let O=`${e}/gameauthor.GameAuthorService/UpdateGameDefinition`,b={id:P,lua_script:l,ui_component_code:m,create_version:!0};c&&(b.gdl=c),await $.default.post(O,b,{headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"}}),console.log("\u{1F389} Successfully uploaded package!"),console.log(`\u{1F3AE} Play test it here: ${e.replace("api.","")}/lobby`)}catch(d){console.error("\u274C Failed to upload game:",d.response?.data||d.message),process.exit(1)}}var y=new N.Command;y.name("pandya").description("CLI and SDK for pandya.ai game authoring").version("1.0.0");y.command("login").description("Login to pandya.ai (or a local instance) via OAuth").option("-h, --host <url>","The pandya instance URL","https://pandya.ai").action(async t=>{await E(t.host)});y.command("init").description("Scaffold a new game in the current directory").argument("[directory]","Directory to initialize (defaults to current)",".").action(async t=>{await L(t)});y.command("push").description("Push game assets to pandya.ai for testing (Updates Draft)").argument("<gameId>","The ID of the game to push assets to").option("-h, --host <url>","The pandya instance URL","https://pandya.ai").action(async(t,e)=>{await U(t,e.host)});y.command("package").description("Package a game directory into a .pgame archive").argument("[directory]","Directory containing the game files",".").option("-o, --out <filename>","Output filename (e.g. game.pgame)").action((t,e)=>{z(t,e.out)});y.command("upload").description("Upload a .pgame archive to pandya.ai (Creates a Draft game)").argument("<package>","Path to the .pgame file").option("-h, --host <url>","The pandya instance URL","https://pandya.ai").action(async(t,e)=>{await I(t,e.host)});y.parse();
