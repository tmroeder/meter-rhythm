blessed = require "blessed"

# Create a screen object.
screen = blessed.screen smartCSR: true
screen.title = "Meter as Rhythm"

# Create a box perfectly centered horizontally and vertically.
box = blessed.box(
  top: "top"
  left: "center"
  width: "50%"
  height: "10%"
  content: ""
  tags: true
  border:
    type: "line"
  style:
    fg: "white"
    bg: "grey"
    border:
      fg: "#f0f0f0"
)

# Append our box to the screen.
screen.append box

# If our screen is clicked, change the content.
screen.key "space", (data) ->
  box.setContent "click"
  screen.render()

screen.key ["l", "right"], (ch, key) ->
  box.setContent "move right"
  screen.render()

screen.key ["h", "left"], (ch, key) ->
  box.setContent "move left"
  screen.render()

# Quit on Escape, q, or Control-C.
screen.key ["escape", "q", "C-c"], (ch, key) ->
  process.exit 0

# Render the screen.
screen.render()
