blessed = require "blessed"
{Driver} = require "../src/driver.coffee"
{states} = require "../src/state_machine.coffee"
{Draw, Input} = require "../src/ui.coffee"

# BlessedInput tracks an implicit horizontal position on the window.  It sends
# click and move events to registered handlers.  Click and move keys are defined
# by incoming arrays.
exports.BlessedInput = class BlessedInput extends Input
  constructor: (@screen, @moveIncrement, clickKeys, leftKeys, rightKeys) ->
    @pos = 0

    # BlessedInput avoids knowing much about the underlying driver, but it
    # does need to know that no movement is possible without an initial click.
    # This member variable tracks that information.
    @allowMovement = false
    @moveRegistry = []
    @clickRegistry = []

    @setUpClickHandlers clickKeys
    @setUpMoveHandlers leftKeys, rightKeys

  registerMove: (fn) ->
    @moveRegistry.push fn

  registerClick: (fn) ->
    @clickRegistry.push fn

  setUpClickHandlers: (clickKeys) ->
    @screen.key clickKeys, (data) =>
      @allowMovement = true
      if not @allowMovement
        return
      @screen.debug("{click: " + @pos + "}")
      for fn in @clickRegistry
        fn? @pos, 0

  setUpMoveHandlers: (leftKeys, rightKeys) ->
    @screen.key leftKeys, (ch, key) =>
      if not @allowMovement
        return
      if @pos >= @moveIncrement
        @pos -= @moveIncrement
        @screen.debug("{move: " + @pos + "}")
        for fn in @moveRegistry
          fn? @pos, 0
      else
        @screen.debug "can't move below 0"

    @screen.key rightKeys, (ch, key) =>
      if not @allowMovement
        return
      if @pos <= @screen.width - @moveIncrement
        @pos += @moveIncrement
        @screen.debug("{move: " + @pos + "}")
        for fn in @moveRegistry
          fn? @pos, 0
      else
        @screen.debug("can't move beyond " + @screen.width)

# The Blessed UI for Meter as Rhythm runs in an 80x25 terminal.
standardTerminalWidth = 120
standardTerminalHeight = 60
shortSoundLen = 5

# These are the properties to be exposed in JSON.stringify
    
# BlessedDraw uses the Blessed UI to draw to the terminal.
exports.BlessedDraw = class BlessedDraw extends Draw

  # The BlessedDraw class takes a structure that gives the parameters of the
  # screen and the heights and positions of the elements.
  constructor: (screenParams) ->
    super(shortSoundLen)

    {
      @title = "Meter as Rhythm"
      @logName = "meter.log"
      @boxHeight = 6
      @pos = 0
    } = (screenParams ? {})

    @screen = blessed.Screen(
      smartCSR: true
      autoPadding: true
      log: @logName
      debug: true
      dockBorders: true
      title: @title
      width: standardTerminalWidth
      height: standardTerminalHeight
    )

    @screenWidth = @screen.width

    @stateBox = @createBox "top", "left", standardTerminalHeight
    @screen.append @stateBox

    # Quit on Escape, q, or Control-C.
    @screen.key ["escape", "q", "C-c"], (ch, key) =>
      @screen.debug "exiting"
      process.exit 0

  createBox: (top, left, height) ->
    return blessed.Box(
      top: top
      left: left
      width: standardTerminalWidth
      height: height ? @boxHeight
      content: ""
      border:
        type: "line"
      style:
        fg: "white"
        border:
          fg: "white"
    )

  moveHandler: (x, y) =>
    @pos = x

  # draw calls the parent Draw class and follows it by rendering the screen.
  draw: (points, state, states, cur) ->
    super(points, state, states, cur)
    @updateElements()
    @screen.render()

  updateElements: ->
    @stateBox.setContent("pos: " + @pos + "\n" +
        JSON.stringify(@state, null, 2))

exports.StartUI = ->
  maxLen = 10
  draw = new BlessedDraw()
  input = new BlessedInput draw.screen, 2, "space", "left", "right"
  input.registerMove draw.moveHandler
  driver = new Driver maxLen, states, input, draw

  draw.screen.render()
