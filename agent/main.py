"""
Vision Quest — NPC Agent Server
================================
Runs Vision AI agents for each NPC zone using the Vision Agents SDK.
Each NPC (Jester, Sage, Shadow) has its own personality and instructions.

Usage:
    cd agent
    uv run python main.py --call-type default --call-id <call_id> --npc <jester|sage|shadow>

Or start all agents at once:
    uv run python main.py serve
"""

import os
import sys
import asyncio
import argparse
from dotenv import load_dotenv

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


async def create_agent(npc_id: str = "jester", **kwargs):
    """Create a Vision Agent configured as a specific NPC."""
    try:
        from vision_agents.core import Agent, User
        from vision_agents.plugins import getstream, gemini
    except ImportError:
        print("Error: vision-agents not installed. Run: uv add 'vision-agents[getstream,gemini]'")
        sys.exit(1)

    instructions = NPC_INSTRUCTIONS.get(npc_id, NPC_INSTRUCTIONS["jester"])
    npc_name = npc_id.upper() if npc_id != "sage" else "THE SAGE"

    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name=npc_name, id=f"npc-{npc_id}"),
        instructions=instructions,
        llm=gemini.Realtime(fps=3),  # 3 video frames per second to Gemini
    )

    return agent


async def join_call(agent, call_type: str, call_id: str, **kwargs):
    """Have the agent join a Stream video call."""
    call = await agent.create_call(call_type, call_id)

    print(f"🎭 Agent joining call: {call_type}/{call_id}")

    async with agent.join(call):
        # The agent will now see the user's video and hear their audio
        # Gemini Realtime processes everything and responds
        await agent.simple_response("Greet the player in character.")
        await agent.finish()


async def run_agent(npc_id: str, call_type: str, call_id: str):
    """Run a single NPC agent."""
    agent = await create_agent(npc_id)
    await join_call(agent, call_type, call_id)


def main():
    parser = argparse.ArgumentParser(description="Vision Quest NPC Agent Server")
    parser.add_argument(
        "--npc",
        type=str,
        default="jester",
        choices=["jester", "sage", "shadow"],
        help="Which NPC to run (default: jester)",
    )
    parser.add_argument(
        "--call-type",
        type=str,
        default="default",
        help="Stream call type (default: default)",
    )
    parser.add_argument(
        "--call-id",
        type=str,
        required=True,
        help="Stream call ID to join",
    )

    args = parser.parse_args()

    # Validate env vars
    required_vars = ["STREAM_API_KEY", "STREAM_API_SECRET", "GOOGLE_API_KEY"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        print("   Copy agent/.env.example to agent/.env and fill in your keys.")
        sys.exit(1)

    print(f"🎮 Vision Quest Agent Server")
    print(f"   NPC: {args.npc.upper()}")
    print(f"   Call: {args.call_type}/{args.call_id}")
    print()

    asyncio.run(run_agent(args.npc, args.call_type, args.call_id))


if __name__ == "__main__":
    main()
