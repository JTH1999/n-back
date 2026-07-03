# N-Back Trainer

A client-side, highly configurable n-back cognitive training app. Supports the classic single n-back task up through "quad" n-back (four simultaneous stimulus streams), with all timing, stream selection, and training parameters left to the user.

## Language

**Stream**:
One of the (up to four) independent stimulus channels a session can track: Position, Shape, Color, or Letter. Each stream is toggled on/off independently and judged for matches separately.
_Avoid_: Modality, channel, dimension

**Position / Shape / Color / Letter**:
The four supported streams. Position and Shape and Color are visual (shown together on the grid); Letter is audio (played via a pre-recorded clip).
_Avoid_: Visual stream (for Position/Shape/Color individually — name the stream directly)

**N-back level (N)**:
How many trials back a stimulus must match to count as a match. A single global N applies to every active stream in a session — there is no per-stream N.
_Avoid_: Level, difficulty (difficulty is influenced by N but isn't identical to it — timing and stream count also affect difficulty)

**Trial**:
One presentation cycle: a stimulus is shown/played for the configured display duration, then a response window continues until the trial length elapses and the next trial begins.
_Avoid_: Round, tick

**Session**:
One complete run of trials at a fixed configuration (N, active streams, timing, trial count) from start to either completion or abort.
_Avoid_: Game, run (except informally)

**Stimulus**:
The concrete value presented on a given trial for a given stream (e.g., grid cell 3 for Position, red for Color).

**Trial length / ISI**:
The total time budget for one trial, including both the stimulus display duration and the response window that follows it.
_Avoid_: Inter-stimulus interval when referring to the whole trial (ISI here means the full per-trial time budget, not just the gap after the stimulus)

**Match**:
The user's assertion, via that stream's key or tap button, that the current trial's stimulus equals the stimulus N trials back on that same stream. Only asserted matches are recorded — there is no explicit "no-match" input (respond-on-match-only).

**Hit / Miss / False Alarm / Correct Rejection**:
The four possible per-stream, per-trial scoring outcomes: Hit (matched and asserted), Miss (matched, not asserted), False Alarm (not matched, asserted), Correct Rejection (not matched, not asserted).

**Preset**:
A named, saved bundle of session configuration (active streams, N, timing, trial count, adaptive settings) that can be recalled later. The most recently used preset is restored automatically on app open.

**Adaptive mode**:
An optional per-session setting where N is automatically raised or lowered for the *next* session based on the previous session's accuracy against configurable thresholds. Off by default (manual N).
_Avoid_: Staircase (used in the training literature but not surfaced as a term in-app)

**Grid**:
The fixed spatial layout (default 3×3) that the Position stream's stimuli are drawn from.
