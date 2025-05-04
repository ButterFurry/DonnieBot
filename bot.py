import discord
from discord.ext import commands
import asyncio
import os
DCTOKEN = os.environ.get('DCTOKEN')

intents = discord.Intents.default()
intents.message_content = True  # Add this
intents.voice_states = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

donnie_enabled = {}

@bot.command()
async def donnie(ctx, arg):
    if ctx.channel.name != "bot-commands":
        await ctx.send("Commands can only be used in #bot-commands.")
        return

    if arg.lower() == "on":
        donnie_enabled[ctx.guild.id] = True
        await ctx.send("ENABLED")
    elif arg.lower() == "off":
        donnie_enabled[ctx.guild.id] = False
        await ctx.send("DISABLED")

	
    else:
        await ctx.send("Usage: `!donnie on` or `!donnie off`")

@bot.event
async def on_voice_state_update(member, before, after):
    if member.bot or not after.channel:
        return

    guild_id = member.guild.id
    if not donnie_enabled.get(guild_id, False):
        return

    vc = after.channel
    if any(vc_client.channel == vc for vc_client in bot.voice_clients):
        return  # Already in the call

    try:
        vc_client = await vc.connect()
    except discord.ClientException:
        return

    audio_file = "clip1.mp3"

    try:
        while donnie_enabled.get(guild_id, False) and len(vc.members) > 1:
            vc_client.play(discord.FFmpegPCMAudio(audio_file))
            while vc_client.is_playing():
                await asyncio.sleep(1)
            await asyncio.sleep(1.5)
    finally:
        await vc_client.disconnect()

bot.run(DCTOKEN)
