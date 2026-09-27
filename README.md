# Cat Bluff

A planned private-card commitment foundation for a multiplayer bluffing game on Midnight.

## Current status

Requirements and the protocol design are documented. Implementation has not started. There is no compiled contract, passing test run, deployment, public repository, or Rise In submission yet. Ubuntu installation is blocked pending user intervention; see [the handoff](docs/STATUS.md).

## Initial product idea

Cat Bluff is a multiplayer card game in which players make public claims while their actual cards stay hidden. Midnight can let a player prove that a hidden rank was committed consistently without revealing it during play, then selectively disclose that rank when challenged. Level 1 will implement one fixed round with two pre-authorized roles, a salted card commitment, an independent public claimed rank, and a challenge followed by verified resolution. Later levels will add the game interface, wallet connection, and fuller multiplayer rules.

## Project documents

- [Verified Level 1 checklist](docs/LEVEL1-CHECKLIST.md)
- [Protocol design and privacy model](docs/DESIGN.md)
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md)
- [Environment findings and exact blocker](docs/STATUS.md)

## Deployment

Not deployed. Preprod is the intended network. No contract address is available.
