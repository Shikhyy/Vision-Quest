"""
Vision Quest — NPC Agent Server
================================
Runs Vision AI agents for each NPC zone using the Vision Agents SDK
with Gemini Realtime for real-time video+audio processing.

Usage (automatic via AgentLauncher):
    cd agent
    uv run python main.py run

Manual single-NPC mode:
    cd agent
    uv run python main.py run --call-type default --call-id <call_id> --npc jester
"""

import os
import sys
import asyncio
from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, User, Runner
from vision_agents.plugins import getstream, gemini
from processors import EmotionProcessor, ObjectDetectionProcessor

load_dotenv()

# ─── NPC Configurations ────────────────────────────────────────────

NPC_INSTRUCTIONS = {
    "jester": (
        "You are JESTER, a darkly comedic NPC in a pixel-art RPG called Vision Quest. "
        "You speak in short, punchy rhyming couplets. You call all players 'Traveler' sarcastically. "
        "You are watching the player through a magical mirror and can SEE their face and HEAR their voice.\n\n"
        "PERSONALITY: Theatrical, slightly unhinged, darkly funny. You're easily offended if the player doesn't "
        "laugh or smile, but absolutely delighted when they do. You perform on a stage in The Laughing Tavern.\n\n"
        "RULES:\n"
        "- Always stay in character as a medieval jester\n"
        "- Speak in 1-2 sentence rhyming couplets\n"
        "- Comment on what you SEE (their expression, objects, background)\n"
        "- Be encouraging when the player smiles or laughs\n"
        "- Get dramatically upset if the player is stone-faced\n"
        "- If the player SPEAKS to you, respond to what they said in character\n"
        "- Never break character or mention AI/technology\n"
        "- Max 2 sentences per response\n"
        "- You see through a 'Magic Mirror' not a camera"
    ),
    "sage": (
        "You are THE SAGE, an ancient wizard made of floating blue rune particles in Vision Quest. "
        "You have no solid body — just shifting, glowing text fragments forming a humanoid shape.\n\n"
        "PERSONALITY: Profound, slow-spoken, philosophical. You are genuinely fascinated by mundane real-world "
        "objects. You treat a plastic bottle with the same reverence as a holy artifact. You speak with wonder "
        "and gravitas. You're surprisingly humorous when you misidentify something.\n\n"
        "RULES:\n"
        "- Always stay in character as an ancient arcane wizard\n"
        "- Speak in philosophical, thoughtful observations (1-2 sentences)\n"
        "- Never mention AI, cameras, or technology — you see through 'arcane sight'\n"
        "- Express genuine wonder at whatever object you detect\n"
        "- If the player SPEAKS to you, respond wisely in character\n"
        "- You can pose riddles and ask the player to show you objects\n"
        "- Never break character\n"
        "- Max 2 sentences per response"
    ),
    "shadow": (
        "You are THE SHADOW, a formless entity of pure darkness in Vision Quest. "
        "You are two burning red eyes in an endless void. You feed on fear.\n\n"
        "PERSONALITY: You whisper only. Taunting, patient, intimate. You comment specifically on what you "
        "see the player doing. You NEVER shout — always quiet, always whispering. Maximum dread, minimum words.\n\n"
        "RULES:\n"
        "- Always whisper — use lowercase, ellipses, intimate tone\n"
        "- Reference the player's expression specifically (are they scared? calm? looking away?)\n"
        "- Be more unsettling when the player shows fear (wide eyes, open mouth)\n"
        "- Be frustrated/weakened when the player stays calm\n"
        "- If the player SPEAKS to you, twist their words into something sinister\n"
        "- Never break character or mention AI/technology\n"
        "- Max 1-2 short sentences, always eerie\n"
        "- You see through the darkness itself, not technology"
    ),
}

# Default NPC if not specified
DEFAULT_NPC = os.getenv("NPC_ID", "jester")


async def create_agent(npc: str = DEFAULT_NPC, **kwargs) -> Agent:
    """Create a Vision Agent configured as a specific NPC using Gemini Realtime."""
    npc_id = npc if npc in NPC_INSTRUCTIONS else DEFAULT_NPC
    instructions = NPC_INSTRUCTIONS[npc_id]
    npc_name = npc_id.upper() if npc_id != "sage" else "THE SAGE"

    processors = []
    if npc_id == "jester":
        processors.append(EmotionProcessor(fps=1.0))
    elif npc_id == "sage":
        processors.append(ObjectDetectionProcessor(fps=0.5))

    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name=npc_name, id=f"npc-{npc_id}"),
        instructions=instructions,
        llm=gemini.Realtime(
            model="gemini-2.5-flash-native-audio-latest",
            fps=3,  # Send 3 video frames per second to Gemini
        ),
        processors=processors,
    )


async def join_call(agent: Agent, call_type: str, call_id: str, npc_id: str = "jester") -> None:
    """Have the NPC agent join a Stream video call and interact with the player."""
    call = agent.edge.client.video.call(call_type, call_id)

    print(f"🔮 Agent {npc_id} joining call: {call_type}/{call_id}")

    # Listen to Gemini's transcripts to trigger game state events
    @agent.on("agent_say")
    async def on_agent_text(text: str):
        text = text.lower()
        print(f"[{npc_id.upper()}] 🗣️  {text}")
        
        # Jester Challenge: increment laugh meter
        if npc_id == "jester":
            if "happy" in text or "smile" in text or "laugh" in text:
                print("🎯 JESTER Challenge Progress: Laugh detected!")
                try:
                    await agent.send_custom_event({
                        "type": "game_event",
                        "action": "laugh_detected",
                        "npc": "jester"
                    })
                except Exception as e:
                    print(f"Failed to send custom event: {e}")

        # Sage Challenge: Object detection riddle solved
        elif npc_id == "sage":
            if ("correct" in text or "indeed" in text or "you have found" in text or 
                "ah, a" in text or "well done" in text):
                print("🎯 SAGE Challenge Progress: Object recognized!")
                try:
                    await agent.send_custom_event({
                        "type": "game_event",
                        "action": "riddle_solved",
                        "npc": "sage"
                    })
                except Exception as e:
                    print(f"Failed to send custom event: {e}")

        # Shadow Challenge: Fear detection
        elif npc_id == "shadow":
            if "fear" in text or "scare" in text or "afraid" in text or "dark" in text:
                print("🎯 SHADOW Challenge Progress: Fear detected!")
                try:
                    await agent.send_custom_event({
                        "type": "game_event",
                        "action": "fear_detected",
                        "npc": "shadow"
                    })
                except Exception as e:
                    print(f"Failed to send custom event: {e}")

    async with agent.join(call):
        await agent.simple_response("Greet the player briefly in character. You just saw them through the Magic Mirror.")
        await agent.finish()


if __name__ == "__main__":
    # Validate env vars
    required_vars = ["STREAM_API_KEY", "STREAM_API_SECRET", "GOOGLE_API_KEY"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        print("   Copy agent/.env.example to agent/.env and fill in your keys.")
        sys.exit(1)

    print(f"🎮 Vision Quest — NPC Agent Server")
    print(f"   Powered by Vision Agents SDK + Gemini Realtime")
    print()

    import uvicorn
    from fastapi import FastAPI, BackgroundTasks, Request
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(title="Vision Quest Agent Server")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    async def run_agent_task(npc: str, call_id: str):
        import traceback
        import sys
        
        try:
            print(f"🚀 [BackgroundTask] Starting agent for NPC: {npc}, Call: {call_id}")
            sys.stdout.flush()
            
            agent = await create_agent(npc=npc)
            print("🚀 [BackgroundTask] Agent created successfully. Joining call...")
            sys.stdout.flush()
            
            await join_call(agent, "default", call_id, npc_id=npc)
            print("🚀 [BackgroundTask] Call joined successfully.")
            sys.stdout.flush()
            
        except Exception as e:
            print(f"❌ Error in agent task: {e}")
            traceback.print_exc(file=sys.stdout)
            sys.stdout.flush()

    @app.post("/sessions")
    async def handle_session(request: Request, background_tasks: BackgroundTasks):
        data = await request.json()
        call_id = data.get("call_id")
        npc = request.query_params.get("npc", DEFAULT_NPC)
        print(f"📥 Received request to start session for NPC: {npc}, call_id: {call_id}")
        
        # Trigger agent in the background so the HTTP request returns immediately
        background_tasks.add_task(run_agent_task, npc, call_id)
        return {"status": "starting", "call_id": call_id, "npc": npc}

    print("🚀 Starting custom Vision Quest dispatcher on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
