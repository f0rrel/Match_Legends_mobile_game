# Match Legends — Game Direction

## Vision
A bright, cute and competitive match-3 with funny monsters. Quick games (≤3 min) that make you want "just one more", and powers you unlock solo and then show off against friends.

## Audience
Mainly women 20–55, casual phone players. Short sessions on a phone, portrait mode, played with one thumb. English first; text kept ready for translation.

## Feel (every change is judged against this)
Bright · flashy · juicy · cute · competitive. Every action gets visible, satisfying feedback. Big moments (specials, powers, wins) must feel big: you should see and hear them. Never overdo the colors: readability comes first.

## Never change
- A square board (rows and columns) that fills a portrait phone screen.
- Core matching: 3 or more of the same monster in a row or column.
- Games last ≤3 minutes.
- Free to play, no real money.

## Look
- Tiles are simple glossy jewels drawn in SVG: sword=red circle, shield=blue rounded square, urn=purple triangle, crown=yellow star, flame=orange diamond, gem=green hexagon. Each is filled with its own colour, wrapped in a darker outline and lit with a white gloss and shine, and each has its own silhouette, so tiles are distinguishable even without colour. Readable on a small phone.
- Special tiles never look like normal tiles: a line blaster shows its direction, a bomb glows and pulses. The monster stays visible underneath.
- Avatars are monster characters in a Hotel-Transylvania-like style: ridiculous and lovable (a fly, a blob, a tiny vampire…). Portraits are AI-generated in one fixed style; the owner picks from candidates.
- Effects are readable, not rushed: a normal 3-match takes about 0.4–0.6 s from pop to falling tiles. Bigger matches get a bigger moment: tiles swell for a split second, then burst; up to about 1 s for 5+ matches and combos. A power gets its own moment of up to about 1.2 s: the screen dims, the avatar appears, the board shakes. Taps are never lost (queued during effects). Reduced motion and the effects toggle make everything short again.

## Modes
- Normal (solo): endless levels generated from a seed, with a move limit (≈20 moves); leftover moves become a bonus. Goals rotate: score target, collect X of a monster, clear blockers. Difficulty rises slowly with regular easier "breather" levels. Levels are grouped into worlds, one world = one hotel floor. 1–3 stars per level.
- Versus AI: a turn-based duel, 2 moves per turn, extra moves for big matches, highest score after 5 rounds wins. Easy / Normal / Hard; Easy must lose to beginners.
- Versus friends (later): the same duel rules, played asynchronously.

## Avatars and powers
Before each game you pick one avatar; each avatar has one signature power with its own animation and sound. In duels, powers differ in kind, not in strength (no pay-to-win).

## Progression (the "one more game" loop)
Coins and stars from solo play unlock new avatars and powers. One guaranteed new avatar every few worlds. Daily rewards, streaks, near-miss "so close!" moments and surprise bonuses are welcome.

## Sound
Real sound files (www/assets/audio/) for matches, specials, powers and wins, with the synthesized beeps as a fallback. Cute monster sounds and short looping music. Separate sound and music toggles, always available.

## Testing
A group of friends plays the preview link and gives feedback outside the game.
