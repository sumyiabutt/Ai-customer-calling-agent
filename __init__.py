"""Week 1 prototype of the AI Customer Calling Agent.

Run the simulated call from the project root:

    python -m src.cli          # interactive chat
    python -m src.cli --demo   # fixed sample conversation

No audio is recorded, no phone call is placed and no data leaves this machine.
"""

from .agent import AgentResponse, CustomerSupportAgent

__all__ = ["AgentResponse", "CustomerSupportAgent"]
