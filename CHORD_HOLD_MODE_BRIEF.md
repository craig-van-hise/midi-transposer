### **Function Specification: MIDI "Chord Hold"**

**Overview**
Chord Hold is a toggleable MIDI operational mode designed to automatically sustain overlapping MIDI notes after physical key release. It functions analogously to an automated sustain pedal—capturing a cluster of overlapping notes, maintaining their `Note On` state upon physical release, and instantly clearing them the moment a new phrase begins.

---

### **Operational Logic & State Machine**

**1. Note Accumulation (`Keys Down > 0`)**

* While the user is actively pressing keys, the system tracks and groups overlapping notes into an active chord array.
* Notes do not need to be struck simultaneously to group. For example, if a user plays and holds **C**, subsequently adds and holds **E**, and finally adds and holds **G**, all three notes form the active cluster as long as they overlap.

**2. Sustain State (`Keys Down = 0`)**

* When the user releases all keys (triggering a `Keys Down = 0` state), the system intercepts and suppresses the standard MIDI `Note Off` messages.
* The active chord remains fully engaged in a sustained `Note On` state. The system is now primed for a reset trigger.

**3. Reset & Retrigger**

* The sustained chord holds indefinitely until the user strikes any new note.
* The detection of a new physical key press acts as the reset trigger, commanding the system to immediately flush all pending `Note Off` messages from the previous chord cluster before initiating the new notes.

---

### **Strict Technical Constraints: Sample-Accurate Timing**

The transition between the Sustain State and the Reset & Retrigger state demands absolute precision to ensure clean MIDI routing.

* **The 1-Sample Offset:** When a new note triggers the reset sequence, the system must force the delayed `Note Off` messages for the previously held chord to execute **exactly one sample prior** to sending the new `Note On` messages.
* **Error Mitigation:** This strict, sample-accurate sequence (`Note Offs` forced *before* new `Note Ons`) is mandatory. Failure to sequence this correctly will result in cross-triggering, voice doubling, or stuck MIDI notes.