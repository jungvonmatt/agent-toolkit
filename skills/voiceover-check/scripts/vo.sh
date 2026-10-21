#!/usr/bin/env bash
# Drives the macOS VoiceOver screen reader through its AppleScript interface and prints what it says.
#
# usage:
#   bash vo.sh start                       start VoiceOver and check that AppleScript control works
#   bash vo.sh stop                        quit VoiceOver and confirm that it is off
#   bash vo.sh front                       print the name of the app in front
#   bash vo.sh last                        print the last phrase VoiceOver spoke
#   bash vo.sh walk <app> <steps> [delay]  move the VoiceOver cursor <steps> items forward, print each phrase
#   bash vo.sh seek <app> <text> [max]     move forward until the spoken phrase contains <text>
#   bash vo.sh act <app> [seconds]         activate the item under the cursor (VO-Space), print what follows
#   bash vo.sh into <app> | out <app>      move into or out of the item under the cursor (a dialog, a group)
#   bash vo.sh poll <seconds> [interval]   print every new phrase until the time runs out
#
# <app> is the app that must stay in front, as `front` prints it, for example "Safari".
# Exit codes: 1 usage or VoiceOver off, 2 another app is in front, 3 AppleScript control fails,
#             4 the VoiceOver cursor does not move, 5 `seek` did not find the text.
set -uo pipefail

STARTER=/System/Library/CoreServices/VoiceOver.app/Contents/MacOS/VoiceOverStarter
PREV=""
STUCK=0

die() {
  echo "vo.sh: $1" >&2
  exit "${2:-1}"
}

usage() {
  sed -n '2,17p' "$0" | sed -E 's/^# ?//' >&2
  exit 1
}

int() { [[ $1 =~ ^[0-9]+$ ]] || die "$2 must be a whole number"; }
num() { [[ $1 =~ ^[0-9]+([.][0-9]+)?$ ]] || die "$2 must be a number"; }

running() { pgrep -xq VoiceOver; }
need_running() { running || die "VoiceOver is not running. Start it with: bash vo.sh start"; }

# Telling VoiceOver anything while it is off starts it without warning, so every call checks first.
vo() {
  need_running
  osascript -e "tell application \"VoiceOver\" to $1"
}

phrase() { vo 'return content of last phrase' 2>/dev/null; }
cursor() { vo 'return bounds of vo cursor' 2>/dev/null; }

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
# The cursor counts as moved when its position or the phrase changes, so two equal items in a row are fine.
step() {
  local app=$1 delay=$2 n=$3 text before after
  need_running
  guard "$app"
  before=$(cursor)
  vo 'tell vo cursor to move right' >/dev/null
  sleep "$delay"
  text=$(phrase)
  after=$(cursor)
  if [ "$text" = "$PREV" ] && [ "$after" = "$before" ]; then
    # Do not step into the item here: on a plain control, VoiceOver then interacts with its parts.
    STUCK=$((STUCK + 1))
    [ "$STUCK" -ge 3 ] && die "stopped at step $n: the VoiceOver cursor does not move (end of the content, a focus trap, or a dialog to step into with: into)" 4
    printf '%03d  (no move) %s\n' "$n" "$text"
  else
    STUCK=0
    printf '%03d  %s\n' "$n" "$text"
  fi
  PREV=$text
}

cmd_start() {
  if running; then
    echo "VoiceOver was already running. It is the user's session: do not stop it at the end without their OK."
  else
    "$STARTER" >/dev/null 2>&1
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      running && break
      sleep 0.5
    done
    running || die "VoiceOver did not start"
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
}

cmd_stop() {
  if ! running; then
    echo "VoiceOver is not running."
    return
  fi
  osascript -e 'tell application "VoiceOver" to quit' >/dev/null 2>&1
  for _ in 1 2 3 4 5 6; do
    running || { echo "VoiceOver stopped."; return; }
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
  PREV=$(phrase)
  for ((i = 1; i <= steps; i++)); do
    step "$app" "$delay" "$i"
  done
}

cmd_seek() {
  local app=$1 needle=$2 max=$3 i
  int "$max" max
  need_running
  keep_awake
  PREV=$(phrase)
  shopt -s nocasematch
  for ((i = 1; i <= max; i++)); do
    step "$app" 1.3 "$i"
    [[ $PREV == *"$needle"* ]] && return 0
  done
  die "\"$needle\" was not spoken within $max items" 5
}

cmd_poll() {
  local interval=$2 end=$((SECONDS + $1)) prev text
  need_running
  keep_awake
  prev=$(phrase) # the phrase from before the poll is not news
  while [ "$SECONDS" -lt "$end" ]; do
    need_running
    text=$(phrase)
    if [ -n "$text" ] && [ "$text" != "$prev" ]; then
      printf '%s [%s] %s\n' "$(date +%T)" "$(frontmost)" "$text"
      prev=$text
    fi
    sleep "$interval"
  done
}

# The poller starts before the action, so an announcement that follows at once is not lost.
cmd_act() {
  local app=$1 seconds=$2 pid
  int "$seconds" seconds
  need_running
  guard "$app"
  cmd_poll "$seconds" 0.1 &
  pid=$!
  sleep 0.5
  printf '%s [act] VO-Space\n' "$(date +%T)"
  vo 'tell vo cursor to perform action' >/dev/null
  wait "$pid"
}

cmd_move() {
  need_running
  guard "$1"
  vo "tell vo cursor to move $2 item" >/dev/null
  sleep 1.3
  phrase
}

case "${1:-}" in
  start) cmd_start ;;
  stop) cmd_stop ;;
  front) frontmost ;;
  last) need_running; phrase ;;
  walk) [ $# -ge 3 ] || usage; cmd_walk "$2" "$3" "${4:-1.3}" ;;
  seek) [ $# -ge 3 ] || usage; cmd_seek "$2" "$3" "${4:-60}" ;;
  act) [ $# -ge 2 ] || usage; cmd_act "$2" "${3:-10}" ;;
  into) [ $# -ge 2 ] || usage; cmd_move "$2" into ;;
  out) [ $# -ge 2 ] || usage; cmd_move "$2" "out of" ;;
  poll) [ $# -ge 2 ] || usage; int "$2" seconds; num "${3:-0.1}" interval; cmd_poll "$2" "${3:-0.1}" ;;
  *) usage ;;
esac
