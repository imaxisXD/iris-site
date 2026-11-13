"""Records the /02 demo: the real Iris in TextEdit, on this Mac, as a person would use it.

    python3 -I scripts/record-demo.py [--now]

Waits until nobody has touched the Mac for a minute (--now skips that; only when the owner
said go ahead), then takes the screen for about half a minute:

  1. notes how the Mac is (light or dark, which apps are showing, which is in front, the
     desktop picture) in /tmp/iris-demo/restore.json, then hides the other apps, turns on
     light mode and puts the desk print (scripts/art.mjs) on the desktop
  2. opens a scratch document with the draft in TextEdit (made here, in /tmp: nothing of
     the owner's is on screen), and places its window
  3. a dry run: presses the panel's shortcut, waits for the answer, notes where Iris put its
     flower and panel, presses Escape
  4. the take: the draft again, then a screen recording of that area while it presses the
     shortcut, waits for the fixes, holds so they can be read, presses Return and waits for
     the document to change
  5. puts the Mac back exactly as step 1 found it: quits TextEdit, shows the apps it hid,
     sets light or dark and the desktop picture back, brings back the app that was in front

Step 5 runs however the script ends, Ctrl-C and kill included, and a run that was cut off
harder than that is put back by the next run before it starts. No AppleScript goes to
TextEdit (no Automation prompt): the document is a file, the rest is cua-driver.

Uses the installed Iris with its real model and the shortcut it's set to, so what shows is
what Iris really does. Writes /tmp/iris-demo/take.mov and take.json (where things were, and
when each key went down); scripts/demo-video.mjs makes the page's video from those.
"""

import json
import os
import plistlib
import signal
import subprocess
import sys
import time

DRAFT = "hey, i have checked the PR and its look fine but one thing need to change before merge"
OUT = "/tmp/iris-demo"
DOC = os.path.join(OUT, "Reply to Sam.rtf")
RESTORE = os.path.join(OUT, "restore.json")
DESK = "/tmp/iris-art/desk.png"  # the desktop for the take, printed by scripts/art.mjs
SESSION = f"iris-demo-{os.getpid()}-{int(time.time())}"
NOW = "--now" in sys.argv
WINDOW = (820, 300)  # TextEdit's window, in points, centred
MARGIN = 36          # points of desktop kept round the windows in the shot
DESKTOP = {"kind": "desktop", "display_id": "primary"}


def sh(*args, check=True):
    return subprocess.run(args, capture_output=True, text=True, check=check).stdout.strip()


def osa(script, check=True):
    return sh("osascript", "-e", script, check=check)


def cua(tool, args):
    run = subprocess.run(["cua-driver", "call", tool, json.dumps({**args, "session": SESSION})], capture_output=True, text=True)
    try:
        return json.loads(run.stdout)
    except json.JSONDecodeError:
        raise RuntimeError(f"cua-driver {tool} failed: {run.stdout}{run.stderr}")


# ── Putting the Mac back ──────────────────────────────────────────────────────────────
def snapshot():
    state = {
        "dark": osa('tell application "System Events" to tell appearance preferences to get dark mode') == "true",
        "visible": [n for n in osa('tell application "System Events" to get name of every application process whose visible is true').split(", ") if n],
        "front": osa('tell application "System Events" to name of first application process whose frontmost is true'),
        "textedit_was_running": bool(sh("pgrep", "-x", "TextEdit", check=False)),
        # Each desktop's picture, in order, so the owner's comes back exactly.
        "wallpapers": [p for p in osa('tell application "System Events" to get picture of every desktop').split(", ") if p],
    }
    os.makedirs(OUT, exist_ok=True)
    with open(RESTORE, "w") as f:
        json.dump(state, f)
    return state


def restore():
    """Puts the Mac back as restore.json says it was, then forgets it."""
    if not os.path.exists(RESTORE):
        return
    with open(RESTORE) as f:
        state = json.load(f)
    if not state["textedit_was_running"]:
        subprocess.run(["pkill", "-x", "TextEdit"], capture_output=True)  # only the scratch document was open
    if os.path.exists(DOC):
        os.remove(DOC)  # so TextEdit can't reopen it next time
    for name in state["visible"]:
        osa(f'tell application "System Events" to set visible of application process "{name}" to true', check=False)
    osa(f'tell application "System Events" to tell appearance preferences to set dark mode to {"true" if state["dark"] else "false"}', check=False)
    for i, pic in enumerate(state.get("wallpapers", []), start=1):
        osa(f'tell application "System Events" to set picture of desktop {i} to POSIX file "{pic}"', check=False)
    if state["front"]:
        osa(f'tell application "System Events" to set frontmost of application process "{state["front"]}" to true', check=False)
    os.remove(RESTORE)


def on_signal(signum, _frame):
    raise SystemExit(f"record-demo: stopped (signal {signum}); putting the Mac back")


# ── Waiting, keys, windows ────────────────────────────────────────────────────────────
def idle_seconds():
    for line in sh("ioreg", "-c", "IOHIDSystem").splitlines():
        if "HIDIdleTime" in line:
            return int(line.split()[-1]) / 1e9
    return 0


def wait_until_idle(need=60):
    if NOW:
        return
    print(f"record-demo: waiting until nobody has touched the Mac for {need} s", flush=True)
    while (idle := idle_seconds()) < need:
        time.sleep(max(2, need - idle))


def open_shortcut():
    """The keys that open the panel on this Mac, as Iris stores them (KeyCombo in
    Hotkey.swift): ⌃⌥G unless the person changed it. Same reading as Iris's panel-check.py."""
    exported = subprocess.run(["defaults", "export", "local.iris.app", "-"], capture_output=True).stdout
    stored = plistlib.loads(exported).get("openShortcut") if exported else None
    combo = json.loads(stored) if stored else {"keyCode": 5, "modifiers": 0x1000 | 0x800}
    keys = {0: "a", 1: "s", 2: "d", 3: "f", 4: "h", 5: "g", 6: "z", 7: "x", 8: "c", 9: "v", 11: "b", 12: "q", 13: "w",
            14: "e", 15: "r", 16: "y", 17: "t", 31: "o", 32: "u", 34: "i", 35: "p", 37: "l", 38: "j", 40: "k", 45: "n",
            46: "m", 49: "space"}
    if combo["keyCode"] not in keys:
        sys.exit(f"record-demo: can't press the panel's shortcut (key code {combo['keyCode']})")
    mods = [name for bit, name in [(0x1000, "ctrl"), (0x800, "option"), (0x200, "shift"), (0x100, "cmd")] if combo["modifiers"] & bit]
    return mods + [keys[combo["keyCode"]]]


def iris_pid():
    pid = sh("pgrep", "-x", "Iris", check=False).split()
    if not pid:
        sys.exit("record-demo: Iris isn't running")
    return int(pid[0])


def iris_windows(pid):
    """Iris's windows on screen, apart from its menu bar item."""
    return [w for w in cua("list_windows", {"pid": pid})["windows"] if w["is_on_screen"] and w["bounds"]["height"] > 60 and w["bounds"]["y"] > 30]


def panel(pid, timeout=8.0):
    end = time.time() + timeout
    while time.time() < end:
        for w in iris_windows(pid):
            if 600 <= w["bounds"]["width"] <= 800 and w["bounds"]["height"] > 120:
                return w
        time.sleep(0.15)
    return None


def answered(window, timeout=30.0):
    """Waits until the panel shows its answer: its Replace button is there (the panel says
    nothing to VoiceOver while the flower waits for the model)."""
    # cua-driver caps a check's wait (10 s), so ask in short checks until the deadline.
    end = time.time() + timeout
    result = {}
    while time.time() < end:
        result = cua("run_steps", {"pid": window["pid"], "window_id": window["window_id"],
                                   "steps": [{"expect": [{"role": "button", "name": "Replace", "timeout_ms": 8000}]}]})
        if result.get("ok"):
            return True
    print(f"record-demo: no Replace yet; cua-driver said {json.dumps(result)[:600]}", flush=True)
    return False


def editor():
    found = [w for w in cua("list_windows", {"app": "TextEdit"})["windows"] if w["is_on_screen"] and (w.get("title") or "").startswith("Reply to Sam")]
    if not found:
        raise RuntimeError("TextEdit isn't showing the document")
    return found[0]


def text_area(w):
    state = cua("get_window_state", {"pid": w["pid"], "window_id": w["window_id"], "tree_format": "elements",
                                     "include_screenshot": False, "max_elements": 60})
    return next(e for e in state["elements"] if e["role"] == "AXTextArea")


def park_pointer():
    """The real pointer out of the shot: the middle of the left edge (corners can be hot
    corners, and the bottom right opens a Quick Note). Desktop scope is in pixels."""
    screen = cua("get_screen_size", {})
    cua("move_cursor", {"x": 4, "y": round(screen.get("height", 900) * screen.get("scale_factor", 2) / 2), "scope": "desktop"})


def set_draft(w):
    """The draft in the document, TextEdit in front, the caret after the last word."""
    cua("set_value", {"element_token": text_area(w)["element_token"], "value": DRAFT})
    cua("bring_to_front", {"pid": w["pid"]})
    time.sleep(0.5)
    cua("hotkey", {"keys": ["cmd", "down"], "target": DESKTOP})
    park_pointer()
    time.sleep(0.3)


def union(rects):
    x0 = min(r["x"] for r in rects); y0 = min(r["y"] for r in rects)
    x1 = max(r["x"] + r["width"] for r in rects); y1 = max(r["y"] + r["height"] for r in rects)
    return {"x": x0, "y": y0, "width": x1 - x0, "height": y1 - y0}


def write_doc():
    """The draft as a rich text file, set large in Helvetica Neue like a real reply."""
    with open(DOC, "w") as f:
        f.write("{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 HelveticaNeue;}}\\f0\\fs40 " + DRAFT + "}")


# ── The take ──────────────────────────────────────────────────────────────────────────
def take():
    shortcut = open_shortcut()
    if not os.path.exists(DESK):
        sys.exit("record-demo: print the desk first: node scripts/art.mjs")
    if sh("pgrep", "-x", "TextEdit", check=False):
        sys.exit("record-demo: TextEdit is open; close it first, so only the scratch document is on screen")
    state = snapshot()
    cua("set_agent_cursor_enabled", {"enabled": False})
    for name in state["visible"]:
        if name not in ("Finder", "Iris"):
            osa(f'tell application "System Events" to set visible of application process "{name}" to false', check=False)
    if state["dark"]:
        osa('tell application "System Events" to tell appearance preferences to set dark mode to false')
    # The desk print behind the windows, so the shot shows Iris's garden, not the owner's desktop.
    osa(f'tell application "System Events" to tell every desktop to set picture to POSIX file "{DESK}"')

    write_doc()
    subprocess.run(["open", "-a", "TextEdit", DOC], check=True)
    end = time.time() + 15
    while True:
        try:
            w = editor()
            break
        except RuntimeError:
            if time.time() > end:
                raise
            time.sleep(0.3)
    screen = cua("get_screen_size", {})
    sw, shh = screen.get("width", 1440), screen.get("height", 900)
    placed = cua("set_window_frame", {"pid": w["pid"], "window_id": w["window_id"], "x": round((sw - WINDOW[0]) / 2) + 60,
                                      "y": round(shh * 0.3), "width": WINDOW[0], "height": WINDOW[1]})
    print(f"record-demo: window placed: {json.dumps(placed)[:300]}", flush=True)
    time.sleep(0.4)
    w = editor()

    # Dry run: where do the flower and the panel go, and is the model awake (Iris frees it
    # when idle, so the first answer can take a while).
    pid = iris_pid()
    set_draft(w)
    cua("hotkey", {"keys": shortcut, "target": DESKTOP})
    p = panel(pid, timeout=20)
    if not p or not answered(p, timeout=120):
        seen = iris_windows(pid)
        area = union([x["bounds"] for x in seen] + [w["bounds"]])
        sh("screencapture", "-x", "-R", f'{area["x"]},{area["y"]},{area["width"]},{area["height"]}', os.path.join(OUT, "dry-run-failed.png"), check=False)
        raise RuntimeError(f"the panel didn't answer in the dry run (panel {'found' if p else 'not found'}; Iris windows: {[x['bounds'] for x in seen]})")
    rects = [w["bounds"]] + [x["bounds"] for x in iris_windows(pid)]
    cua("press_key", {"key": "escape", "target": DESKTOP})
    time.sleep(1.2)
    area = union(rects)
    area = {"x": max(0, area["x"] - MARGIN), "y": max(25, area["y"] - MARGIN),
            "width": area["width"] + 2 * MARGIN, "height": area["height"] + 2 * MARGIN}

    # The take.
    set_draft(w)
    movie = os.path.join(OUT, "take.mov")
    if os.path.exists(movie):
        os.remove(movie)
    rect = f'{area["x"]},{area["y"]},{area["width"]},{area["height"]}'
    rec = subprocess.Popen(["screencapture", "-v", "-V", "20", "-R", rect, "-x", movie])
    t0 = time.time()
    events = {}
    time.sleep(2.0)
    events["press"] = time.time() - t0
    cua("hotkey", {"keys": shortcut, "target": DESKTOP})
    p = panel(pid)
    if not p or not answered(p, timeout=60):
        raise RuntimeError("the panel didn't answer in the take")
    events["answer"] = time.time() - t0
    time.sleep(3.6)  # long enough to read the fixes
    events["replace"] = time.time() - t0
    cua("press_key", {"key": "return", "target": DESKTOP})
    end = time.time() + 8
    fixed = DRAFT
    while time.time() < end and fixed == DRAFT:
        fixed = text_area(editor()).get("value", DRAFT)
        time.sleep(0.15)
    events["replaced"] = time.time() - t0
    time.sleep(2.4)
    events["end"] = time.time() - t0
    rec.wait(timeout=40)
    with open(os.path.join(OUT, "take.json"), "w") as f:
        json.dump({"shortcut": shortcut, "area": area, "rects": rects, "events": events, "draft": DRAFT, "fixed": fixed}, f, indent=2)
    print(f"record-demo: {movie}, fixed to “{fixed}”", flush=True)


def main():
    signal.signal(signal.SIGTERM, on_signal)
    signal.signal(signal.SIGHUP, on_signal)
    restore()  # a run cut off before it could clean up
    wait_until_idle()
    print("record-demo: taking the screen for about half a minute", flush=True)
    try:
        take()
    finally:
        restore()
        cua("end_session", {})


main()
