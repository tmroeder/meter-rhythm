blessed = require "blessed"
{Draw, Input} = require "../src/ui.coffee"

# Create a screen object.
screen = blessed.Screen(
  smartCSR: true
  autoPadding: true
  log: "meter.log"
  debug: true
  dockBorders: true
)

screen.title = "Meter as Rhythm"

box = blessed.Box(
  top: "top"
  left: "center"
  width: 30
  height: 10
  content: ""
  tags: true
  border:
    type: "line"
  style:
    fg: "white"
    border:
      fg: "white"
)

# Append our box to the screen.
screen.append box

leftStart = 0
pos = leftStart
topStart = 30
symbolHeight = 35
pointHeight = 1
screenWidth = screen.width
moveIncrement = 1

# A line to represent a duration.
duration = blessed.Line(
  orientation: "horizontal"
  width: 1
  left: leftStart
  top: topStart
)

screen.append duration

screen.key "space", (data) ->
  screen.debug("hit the space bar at " + pos)
  point = blessed.Line(
    orientation: "vertical"
    left: pos
    top: topStart
    height: pointHeight
    line: "white"
  )
  screen.append point
  screen.render()

screen.key ["right"], (ch, key) ->
  if duration.width <= screen.width - moveIncrement
    duration.width = duration.width + moveIncrement
    pos = pos + moveIncrement
    screen.debug("moving right to " + duration.width)
  else
    screen.debug("can't move beyond " + screen.width)
  screen.render()

screen.key ["left"], (ch, key) ->
  if duration.width >= moveIncrement
    duration.width = duration.width - moveIncrement
    pos = pos - moveIncrement
    screen.debug("move left to " + duration.width)
  else
    screen.debug "can't move below 0"
  screen.render()

screen.key ["a"], (ch, key) ->
  screen.debug "accent at " + pos
  accent = blessed.Text(
    top: symbolHeight
    left: pos
    align: "center"
  )
  accent.setContent(">")
  screen.append accent
  screen.render()

screen.key ["p"], (ch, key) ->
  screen.debug "parentheses at " + pos
  parentheses = blessed.Text(
    top: symbolHeight
    left: pos
    align: "center"
  )
  parentheses.setContent("()")
  screen.append parentheses
  screen.render()

screen.key ["h"], (ch, key) ->
  screen.debug "hiatus at " + pos
  hiatus = blessed.Text(
    top: symbolHeight
    left: pos
    align: "center"
  )
  hiatus.setContent("||")
  screen.append hiatus
  screen.render()

# Quit on Escape, q, or Control-C.
screen.key ["escape", "q", "C-c"], (ch, key) ->
  screen.debug "exiting"
  process.exit 0


# Render the screen.
screen.render()
