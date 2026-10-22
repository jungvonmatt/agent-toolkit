#!/usr/bin/env bash
# Drives the macOS VoiceOver screen reader through its AppleScript interface and prints what it says.
#
# usage:
#   bash vo.sh check                       check that this Mac can run the check; starts nothing
#   bash vo.sh launch <app> <url> [seconds]  start a separate instance of a Chromium browser with a fresh profile
#   bash vo.sh close                       quit the instance that launch started and delete its profile
#   bash vo.sh focus <app> [seconds]       bring <app> forward and verify focus (default 5 s); use after OK
#   bash vo.sh wait <app> [seconds]        wait until <app> is in front (default 30 s); starts nothing
#   bash vo.sh start [app]                 run check, start VoiceOver, and confirm that it answers AppleScript;
#                                          with <app>: start only while <app> is in front, and check it again after
#   bash vo.sh stop [--force]              quit the VoiceOver that start started (--force: also the user's)
#   bash vo.sh front                       print the name of the app in front; it does not change it
#   bash vo.sh last                        print the last phrase VoiceOver spoke
#   bash vo.sh walk <app> <steps> [delay]  move the VoiceOver cursor <steps> items forward, print each phrase
#   bash vo.sh seek <app> <text> [max]     move forward until the spoken phrase contains <text>
#   bash vo.sh back <app> <steps> [delay]  like walk, but backward
#   bash vo.sh seekback <app> <text> [max] like seek, but backward
#   bash vo.sh act <app> [seconds]         activate the item under the cursor (VO-Space), print what follows
#   bash vo.sh into <app> | out <app>      move into or out of the item under the cursor (a dialog, a group)
#   bash vo.sh commands [filter]           list the VoiceOver command names of this Mac, for example: commands heading
#   bash vo.sh do <app> <command>          run a VoiceOver command by name, print what VoiceOver says next
#   bash vo.sh web <app> <title> [max]     move the VoiceOver cursor into the web area whose name starts with <title>
#   bash vo.sh poll <app> <seconds> [interval]  print every new phrase until the time runs out
#
# <app> is the app that must stay in front, as `front` prints it, for example "Safari".
# Exit codes: 1 usage or VoiceOver off, 2 another app is in front, 3 AppleScript control is off or fails,
#             4 the VoiceOver cursor does not move, 5 `seek` did not find the text, 6 not macOS or no VoiceOver,
#             7 `do` got a name that is not a VoiceOver command on this Mac.
set -uo pipefail

STARTER=/System/Library/CoreServices/VoiceOver.app/Contents/MacOS/VoiceOverStarter
APPLESCRIPT_MARKER=/private/var/db/Accessibility/.VoiceOverAppleScriptEnabled
# The English command names that `tell commander to perform command` accepts on this macOS version.
COMMAND_MAP=/System/Library/PrivateFrameworks/ScreenReader.framework/Versions/A/Resources/SCRStringsToCommandsMap.scrconfig
# Holds the process ID of the VoiceOver that start launched, so a retry and stop can tell it from the user's own session.
OWNER_FILE="${TMPDIR:-/tmp}/voiceover-check.pid"
# Holds the profile directory of the browser instance that launch started.
LAUNCH_FILE="${TMPDIR:-/tmp}/voiceover-check.browser"
LAUNCH_PID_FILE="${TMPDIR:-/tmp}/voiceover-check.browser-pid"
PREV=""
STUCK=0
DIRECTION=right
ACTION=""
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

front_pid() {
  lsappinfo info -only pid "$(lsappinfo front)" | sed -E 's/.*"pid"=([0-9]+).*/\1/'
}

activate_pid() {
  osascript -l JavaScript -e "ObjC.import('AppKit'); \$.NSRunningApplication.runningApplicationWithProcessIdentifier($1).activateWithOptions(\$.NSApplicationActivateAllWindows)" >/dev/null 2>&1
}

# VoiceOver reads whatever app is in front. A notification, a dialog or a locked screen
# takes the focus, and every following step would read the wrong app.
instance_in_front() {
  if [ -f "$LAUNCH_PID_FILE" ]; then
    local expected
    expected=$(cat "$LAUNCH_PID_FILE")
    [[ $expected =~ ^[0-9]+$ ]] && [ "$(front_pid)" = "$expected" ]
  else
    [ ! -f "$LAUNCH_FILE" ]
  fi
}

guard() {
  local front
  front=$(frontmost)
  [ "$front" = "$1" ] || die "stopped: \"$front\" is in front, not \"$1\". Run stop and ask the user." 2
  instance_in_front || die "stopped: the launched browser process is not in front. Run stop, then focus the test instance." 2
}

keep_awake() { caffeinate -di -w $$ & }

# Moves the VoiceOver cursor one item in $DIRECTION and prints the phrase.
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
  must "${ACTION:-tell vo cursor to move $DIRECTION}"
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
    if [ "$front" = "$app" ] && instance_in_front; then
      echo "\"$app\" is in front."
      return 0
    fi
    [ "$SECONDS" -ge "$end" ] && die "\"$app\" did not come to the front within $seconds s: \"$front\" is in front. Ask the user to click into \"$app\", then run wait again. Do not bring it forward yourself." 2
    sleep 0.5
  done
}

# The needle goes through the environment, so the search does not match its own arguments.
# Helper processes of the browser carry --type=; the main process does not.
instance_pids() {
  NEEDLE="--user-data-dir=$1" ps -axo pid=,args= | NEEDLE="--user-data-dir=$1" awk 'index($0, ENVIRON["NEEDLE"]) { print $1 }'
}
instance_pid() {
  NEEDLE="--user-data-dir=$1" ps -axo pid=,args= | NEEDLE="--user-data-dir=$1" awk 'index($0, ENVIRON["NEEDLE"]) && !index($0, "--type=") { print $1; exit }'
}

cmd_commands() {
  plutil -convert xml1 -o - "$COMMAND_MAP" 2>/dev/null |
    sed -nE 's/.*<key>([^<]*)<\/key>.*/\1/p' |
    grep -iF -- "${1:-}" || die "no VoiceOver command matches \"${1:-}\" on this Mac" 7
}

cmd_do() {
  local app=$1 name
  # Only names from the system list reach AppleScript, so the name cannot inject code.
  name=$(cmd_commands 2>/dev/null | grep -ixF -- "$2" | head -n 1)
  [ -n "$name" ] || die "\"$2\" is not a VoiceOver command on this Mac. List them with: commands <filter>" 7
  need_running
  keep_awake
  PREV=$(read_phrase) || exit $?
  ACTION="tell commander to perform command \"$name\""
  step "$app" 1.3 1
}

# Find commands search only the area that holds the cursor, so they need the cursor inside the web area.
# VoiceOver names that area after the page title, for example "<title> web content".
is_web_area() {
  [[ $PREV == "$1"* ]] || return 1
  local suffix=${PREV#"$1"}
  [[ $suffix =~ ^[[:space:],]+(web[[:space:]]+content|Webinhalt)[[:space:]]*$ ]]
}

cmd_web() {
  local app=$1 title=$2 max=$3 i
  int "$max" max
  need_running
  guard "$app"
  keep_awake
  must 'tell commander to perform command "jump to top level"'
  sleep 1.3
  PREV=$(read_phrase) || exit $?
  shopt -s nocasematch
  for ((i = 1; i <= max; i++)); do
    is_web_area "$title" && { cmd_move "$app" into; return; }
    step "$app" 1.3 "$i"
  done
  is_web_area "$title" && { cmd_move "$app" into; return; }
  die "no confirmed web area named \"$title\" within $max items. Expected a spoken web content or Webinhalt role. Other languages require manual confirmation." 5
}

cmd_launch() {
  local app=$1 url=$2 seconds=$3 profile
  int "$seconds" seconds
  case $app in
    "Google Chrome"* | Chromium | "Microsoft Edge"* | "Brave Browser"*) ;;
    *) die "launch supports Chromium browsers only, not \"$app\". Use focus with the user's own window." 1 ;;
  esac
  if [ -f "$LAUNCH_FILE" ] && [ -n "$(instance_pid "$(cat "$LAUNCH_FILE")")" ]; then
    die "a launched browser still runs. Run close first." 1
  fi
  profile=$(mktemp -d "${TMPDIR:-/tmp}/voiceover-check-profile.XXXXXX") || die "could not create a profile directory"
  rm -f "$LAUNCH_PID_FILE"
  echo "$profile" >"$LAUNCH_FILE"
  open -na "$app" --args --user-data-dir="$profile" --no-first-run --no-default-browser-check --new-window "$url" ||
    die "could not launch \"$app\"" 2
  local end=$((SECONDS + seconds)) pid=""
  while :; do
    [ -n "$pid" ] || pid=$(instance_pid "$profile")
    [ -n "$pid" ] && printf '%s\n' "$pid" >"$LAUNCH_PID_FILE"
    if [ -n "$pid" ] && [ "$(front_pid)" = "$pid" ]; then
      echo "\"$app\" (process $pid) is in front."
      return 0
    fi
    # macOS can start a new instance behind the terminal; open -a could pick the user's own window instead.
    [ -n "$pid" ] && activate_pid "$pid"
    [ "$SECONDS" -ge "$end" ] && die "the launched \"$app\" did not come to the front within $seconds s: \"$(frontmost)\" is in front. Ask the user to click into the new \"$app\" window, then run: wait \"$app\", and start." 2
    sleep 0.5
  done
}

cmd_close() {
  local profile pid
  if [ ! -f "$LAUNCH_FILE" ]; then
    rm -f "$LAUNCH_PID_FILE"
    echo "No browser was launched."
    return
  fi
  profile=$(cat "$LAUNCH_FILE")
  pid=$(instance_pid "$profile")
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
    kill -0 "$pid" 2>/dev/null && die "the launched browser (process $pid) still runs"
  fi
  # Helper processes end shortly after the main process and can still write to the profile.
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    [ -z "$(instance_pids "$profile")" ] && break
    sleep 0.5
  done
  case $profile in
    */voiceover-check-profile.*) rm -rf "$profile" ;;
  esac
  rm -f "$LAUNCH_FILE" "$LAUNCH_PID_FILE"
  echo "The launched browser is closed."
}

cmd_focus() {
  local app=$1 seconds=$2
  int "$seconds" seconds
  if [ -f "$LAUNCH_PID_FILE" ]; then
    local pid
    pid=$(cat "$LAUNCH_PID_FILE")
    int "$pid" "browser process ID"
    activate_pid "$pid" || die "could not bring the launched browser process to the front" 2
  else
    [ ! -f "$LAUNCH_FILE" ] || die "the launched browser process is unknown. Run close before retrying." 2
    open -a "$app" || die "could not bring \"$app\" to the front. Ask the user to click into it." 2
  fi
  cmd_wait "$app" "$seconds"
}

cmd_start() {
  local app=${1:-}
  cmd_check
  [ -z "$app" ] || guard "$app"
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
    guard "$app"
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
  launch) [ $# -ge 3 ] || usage; cmd_launch "$2" "$3" "${4:-15}" ;;
  close) cmd_close ;;
  focus) [ $# -ge 2 ] || usage; cmd_focus "$2" "${3:-5}" ;;
  wait) [ $# -ge 2 ] || usage; cmd_wait "$2" "${3:-30}" ;;
  start) cmd_start "${2:-}" ;;
  stop) cmd_stop "${2:-}" ;;
  front) frontmost ;;
  last) need_running; read_phrase ;;
  walk) [ $# -ge 3 ] || usage; cmd_walk "$2" "$3" "${4:-1.3}" ;;
  seek) [ $# -ge 3 ] || usage; cmd_seek "$2" "$3" "${4:-60}" ;;
  back) [ $# -ge 3 ] || usage; DIRECTION=left; cmd_walk "$2" "$3" "${4:-1.3}" ;;
  seekback) [ $# -ge 3 ] || usage; DIRECTION=left; cmd_seek "$2" "$3" "${4:-60}" ;;
  act) [ $# -ge 2 ] || usage; cmd_act "$2" "${3:-10}" ;;
  into) [ $# -ge 2 ] || usage; cmd_move "$2" into ;;
  out) [ $# -ge 2 ] || usage; cmd_move "$2" "out of" ;;
  commands) cmd_commands "${2:-}" ;;
  do) [ $# -ge 3 ] || usage; cmd_do "$2" "$3" ;;
  web) [ $# -ge 3 ] || usage; cmd_web "$2" "$3" "${4:-15}" ;;
  poll) [ $# -ge 3 ] || usage; int "$3" seconds; num "${4:-0.1}" interval; cmd_poll "$2" "$3" "${4:-0.1}" ;;
  *) usage ;;
esac
