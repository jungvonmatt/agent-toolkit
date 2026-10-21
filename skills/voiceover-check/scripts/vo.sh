#!/usr/bin/env bash
# Drives the macOS VoiceOver screen reader through its AppleScript interface and prints what it says.
#
# usage:
#   bash vo.sh check                       check that this Mac can run the check; starts nothing
#   bash vo.sh wait <app> [seconds]        wait until <app> is in front (default 30 s); starts nothing
#   bash vo.sh start [app]                 run check, start VoiceOver, and confirm that it answers AppleScript;
#                                          with <app>: start only while <app> is in front, and check it again after
#   bash vo.sh stop [--force]              quit the VoiceOver that start started (--force: also the user's)
#   bash vo.sh front                       print the name of the app in front; it does not change it
#   bash vo.sh last                        print the last phrase VoiceOver spoke
#   bash vo.sh walk <app> <steps> [delay]  move the VoiceOver cursor <steps> items forward, print each phrase
#   bash vo.sh seek <app> <text> [max]     move forward until the spoken phrase contains <text>
#   bash vo.sh act <app> [seconds]         activate the item under the cursor (VO-Space), print what follows
#   bash vo.sh into <app> | out <app>      move into or out of the item under the cursor (a dialog, a group)
#   bash vo.sh poll <app> <seconds> [interval]  print every new phrase until the time runs out
#
# <app> is the app that must stay in front, as `front` prints it, for example "Safari".
# Exit codes: 1 usage or VoiceOver off, 2 another app is in front, 3 AppleScript control is off or fails,
#             4 the VoiceOver cursor does not move, 5 `seek` did not find the text, 6 not macOS or no VoiceOver.
set -uo pipefail

STARTER=/System/Library/CoreServices/VoiceOver.app/Contents/MacOS/VoiceOverStarter
APPLESCRIPT_MARKER=/private/var/db/Accessibility/.VoiceOverAppleScriptEnabled
# Holds the process ID of the VoiceOver that start launched, so a retry and stop can tell it from the user's own session.
OWNER_FILE="${TMPDIR:-/tmp}/voiceover-check.pid"
PREV=""
STUCK=0
POLLER=""
POLL_ERR=""

# Ends the poller of `act` and its children. Their messages go to $POLL_ERR, which is dropped here,
# so a stopped poller prints nothing after the real error.
stop_poller() {
  if [ -n "$POLLER" ]; then
    pkill -P "$POLLER" 2>/dev/null
    kill "$POLLER" 2>/dev/null
  fi
  [ -n "$POLL_ERR" ] && rm -f "$POLL_ERR"
  return 0
}
trap stop_poller EXIT

die() {
  echo "vo.sh: $1" >&2
  exit "${2:-1}"
}

usage() {
  awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0" >&2
  exit 1
}

int() { [[ $1 =~ ^[0-9]+$ ]] || die "$2 must be a whole number"; }
num() { [[ $1 =~ ^[0-9]+([.][0-9]+)?$ ]] || die "$2 must be a number"; }

running() { pgrep -xq VoiceOver; }
need_running() { running || die "VoiceOver is not running. Start it with: bash vo.sh start"; }
vo_pid() { pgrep -x VoiceOver | head -n 1; }
owned() { [ -f "$OWNER_FILE" ] && [ "$(cat "$OWNER_FILE")" = "$(vo_pid)" ]; }

# Telling VoiceOver anything while it is off starts it without warning, so every call checks first.
# Inside $(...), a failure only ends the subshell, so the callers check the status.
vo() {
  need_running
  osascript -e "tell application \"VoiceOver\" to $1"
}

must() { vo "$1" >/dev/null || die "VoiceOver did not accept: $1" 3; }
phrase() { vo 'return content of last phrase' 2>/dev/null; }
read_phrase() { phrase || die "could not read the last phrase from VoiceOver" 3; }
# The cursor bounds are optional. Without them, the phrase alone shows whether the cursor moved.
cursor() { vo 'return bounds of vo cursor' 2>/dev/null || true; }

frontmost() {
  lsappinfo info -only name "$(lsappinfo front)" | sed -E 's/.*"LSDisplayName"="([^"]*)".*/\1/'
}

# VoiceOver reads whatever app is in front. A notification, a dialog or a locked screen
# takes the focus, and every following step would read the wrong app.
guard() {
  local front
  front=$(frontmost)
  [ "$front" = "$1" ] || die "stopped: \"$front\" is in front, not \"$1\". Run stop and ask the user." 2
}

keep_awake() { caffeinate -di -w $$ & }

# Moves the VoiceOver cursor one item forward and prints the phrase.
# With hints on, VoiceOver replaces the item's phrase with a usage hint after a short pause. So only a
# phrase that is new within ITEM_WINDOW seconds of the move counts as the item; a later one is the hint.
# Without a new phrase, the item has the same text as the one before, or the cursor did not move:
# the cursor position tells the two apart.
ITEM_WINDOW=0.8
step() {
  local app=$1 delay=$2 n=$3 text now before after timer window
  need_running
  guard "$app"
  before=$(cursor)
  must 'tell vo cursor to move right'
  sleep "$delay" &
  timer=$!
  sleep "$(awk -v d="$delay" -v w="$ITEM_WINDOW" 'BEGIN { print (d < w) ? d : w }')" &
  window=$!
  text=$PREV
  while kill -0 "$window" 2>/dev/null; do
    # A read that returns after the window closed may already be the hint.
    if now=$(phrase) && kill -0 "$window" 2>/dev/null && [ "$now" != "$PREV" ]; then
      text=$now
      break
    fi
    sleep 0.1
  done
  kill "$window" 2>/dev/null
  wait "$timer" "$window" 2>/dev/null
  read_phrase >/dev/null || exit $? # VoiceOver must still answer
  after=$(cursor)
  if [ "$text" != "$PREV" ]; then
    STUCK=0
    printf '%03d  %s\n' "$n" "${text:-(empty phrase)}"
  elif [ "$after" != "$before" ]; then
    STUCK=0
    printf '%03d  (same text) %s\n' "$n" "$text"
  else
    # Do not step into the item here: on a plain control, VoiceOver then interacts with its parts.
    STUCK=$((STUCK + 1))
    [ "$STUCK" -ge 3 ] && die "stopped at step $n: the VoiceOver cursor does not move (end of the content, a focus trap, or a dialog to step into with: into)" 4
    printf '%03d  (no move) %s\n' "$n" "$text"
  fi
  PREV=$text
}

# The VoiceOver Utility checkbox "Allow VoiceOver to be controlled with AppleScript" writes a user setting
# and a marker file that only an administrator can create. Both are read here; nothing is changed.
applescript_setting() {
  local pref
  pref=$(defaults read com.apple.VoiceOver4/default SCREnableAppleScript 2>/dev/null)
  if [ "$pref" = 0 ] || [ ! -e "$APPLESCRIPT_MARKER" ]; then
    echo off
  elif [ "$pref" = 1 ]; then
    echo on
  else
    echo unknown
  fi
}

cmd_check() {
  [ "$(uname -s)" = Darwin ] || die "This is not macOS ($(uname -s)), and VoiceOver runs only on a Mac. Tell the user that a person must do the screen reader check: VoiceOver on a Mac, or NVDA on Windows." 6
  [ -x "$STARTER" ] || die "VoiceOver was not found on this Mac ($STARTER). Tell the user that a person must do the screen reader check." 6
  case $(applescript_setting) in
    off) die "AppleScript control of VoiceOver is off. Ask the user to open VoiceOver Utility > General and turn on \"Allow VoiceOver to be controlled with AppleScript\" (references/setup.md, step 1). Do not change it yourself." 3 ;;
    on) echo "AppleScript control of VoiceOver is on." ;;
    *) echo "The AppleScript setting is not readable. start tests it when VoiceOver runs." ;;
  esac
  echo "This Mac is ready. On the first start, macOS can ask the user to allow Automation for VoiceOver."
}

cmd_wait() {
  local app=$1 seconds=$2 end front
  int "$seconds" seconds
  end=$((SECONDS + seconds))
  while :; do
    front=$(frontmost)
    if [ "$front" = "$app" ]; then
      echo "\"$app\" is in front."
      return 0
    fi
    [ "$SECONDS" -ge "$end" ] && die "\"$app\" did not come to the front within $seconds s: \"$front\" is in front. Ask the user to click into \"$app\", then run wait again. Do not bring it forward yourself." 2
    sleep 0.5
  done
}

cmd_start() {
  local app=${1:-} front
  cmd_check
  if [ -n "$app" ] && ! running; then
    front=$(frontmost)
    [ "$front" = "$app" ] || die "not started: \"$front\" is in front, not \"$app\". Ask the user to click into \"$app\", then run: wait \"$app\", and start again." 2
  fi
  if running && owned; then
    echo "VoiceOver is already running: start launched it in an earlier attempt."
  elif running; then
    echo "VoiceOver was already running. It is the user's session: stop leaves it on."
  else
    "$STARTER" >/dev/null 2>&1
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      running && break
      sleep 0.5
    done
    running || die "VoiceOver did not start"
    vo_pid >"$OWNER_FILE"
    sleep 2 # VoiceOver speaks its own start message first
  fi

  local out
  if ! out=$(osascript -e 'tell application "VoiceOver" to return content of last phrase' 2>&1); then
    case $out in
      *-1743*) die "macOS blocks Apple events to VoiceOver: Automation is not allowed (references/setup.md, step 4). VoiceOver is still on: ask the user to press Cmd+F5." 3 ;;
      *-1712*) die "The Apple event timed out. macOS probably waits for the user to answer the Automation prompt. Ask the user to answer it, then run start again." 3 ;;
      *) die "VoiceOver runs, but AppleScript control fails: $out
Turn on \"Allow VoiceOver to be controlled with AppleScript\" (references/setup.md, step 1). VoiceOver is still on: ask the user to press Cmd+F5." 3 ;;
    esac
  fi
  echo "VoiceOver is running and answers AppleScript."
  if [ -n "$app" ]; then
    front=$(frontmost)
    [ "$front" = "$app" ] || die "VoiceOver runs, but \"$front\" came to the front, not \"$app\". Run stop, ask the user to click into \"$app\", then run: wait \"$app\", and start again." 2
    echo "\"$app\" is in front."
  fi
}

cmd_stop() {
  if ! running; then
    rm -f "$OWNER_FILE"
    echo "VoiceOver is not running."
    return
  fi
  if ! owned && [ "${1:-}" != "--force" ]; then
    echo "VoiceOver was not started by start. It is the user's session, so it stays on. With the user's OK: bash vo.sh stop --force"
    return
  fi
  osascript -e 'tell application "VoiceOver" to quit' >/dev/null 2>&1
  for _ in 1 2 3 4 5 6; do
    if ! running; then
      rm -f "$OWNER_FILE"
      echo "VoiceOver stopped."
      return
    fi
    sleep 0.5
  done
  die "VoiceOver still runs. Ask the user to press Cmd+F5."
}

cmd_walk() {
  local app=$1 steps=$2 delay=$3 i
  int "$steps" steps
  num "$delay" delay
  need_running
  keep_awake
  PREV=$(read_phrase) || exit $?
  for ((i = 1; i <= steps; i++)); do
    step "$app" "$delay" "$i"
  done
}

cmd_seek() {
  local app=$1 needle=$2 max=$3 i
  int "$max" max
  need_running
  keep_awake
  PREV=$(read_phrase) || exit $?
  shopt -s nocasematch
  for ((i = 1; i <= max; i++)); do
    step "$app" 1.3 "$i"
    [[ $PREV == *"$needle"* ]] && return 0
  done
  die "\"$needle\" was not spoken within $max items" 5
}

cmd_poll() {
  local app=$1 interval=$3 end=$((SECONDS + $2)) prev text
  need_running
  guard "$app"
  keep_awake
  prev=$(read_phrase) || exit $? # the phrase from before the poll is not news
  while [ "$SECONDS" -lt "$end" ]; do
    need_running
    guard "$app"
    text=$(read_phrase) || exit $?
    if [ -n "$text" ] && [ "$text" != "$prev" ]; then
      printf '%s %s\n' "$(date +%T)" "$text"
      prev=$text
    fi
    sleep "$interval"
  done
}

# The poller starts before the action, so an announcement that follows at once is not lost.
# The EXIT trap ends the poller when the action fails.
cmd_act() {
  local app=$1 seconds=$2 status
  int "$seconds" seconds
  need_running
  guard "$app"
  POLL_ERR=$(mktemp) || die "could not create a temporary file"
  cmd_poll "$app" "$seconds" 0.1 2>"$POLL_ERR" &
  POLLER=$!
  sleep 0.5
  if ! kill -0 "$POLLER" 2>/dev/null; then
    wait "$POLLER" # the poller failed before the action; pass its message and exit code on
    status=$?
    POLLER=""
    cat "$POLL_ERR" >&2
    exit "$status"
  fi
  guard "$app"
  printf '%s [act] VO-Space\n' "$(date +%T)"
  must 'tell vo cursor to perform action'
  wait "$POLLER"
  status=$?
  POLLER=""
  cat "$POLL_ERR" >&2
  return "$status"
}

cmd_move() {
  need_running
  guard "$1"
  must "tell vo cursor to move $2 item"
  sleep 1.3
  read_phrase
}

case "${1:-}" in
  check) cmd_check ;;
  wait) [ $# -ge 2 ] || usage; cmd_wait "$2" "${3:-30}" ;;
  start) cmd_start "${2:-}" ;;
  stop) cmd_stop "${2:-}" ;;
  front) frontmost ;;
  last) need_running; read_phrase ;;
  walk) [ $# -ge 3 ] || usage; cmd_walk "$2" "$3" "${4:-1.3}" ;;
  seek) [ $# -ge 3 ] || usage; cmd_seek "$2" "$3" "${4:-60}" ;;
  act) [ $# -ge 2 ] || usage; cmd_act "$2" "${3:-10}" ;;
  into) [ $# -ge 2 ] || usage; cmd_move "$2" into ;;
  out) [ $# -ge 2 ] || usage; cmd_move "$2" "out of" ;;
  poll) [ $# -ge 3 ] || usage; int "$3" seconds; num "${4:-0.1}" interval; cmd_poll "$2" "$3" "${4:-0.1}" ;;
  *) usage ;;
esac
