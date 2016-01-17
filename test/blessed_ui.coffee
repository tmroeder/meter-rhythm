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
      @screen.debug("hit the space bar at " + @pos)
      for fn in @clickRegistry
        fn? @pos, 0

  setUpMoveHandlers: (leftKeys, rightKeys) ->
    @screen.key leftKeys, (ch, key) =>
      if @pos >= @moveIncrement
        @pos -= @moveIncrement
        @screen.debug("move left to " + @pos)
        for fn in @moveRegistry
          fn? @pos, 0
      else
        @screen.debug "can't move below 0"

    @screen.key rightKeys, (ch, key) =>
      if @pos <= @screen.width - @moveIncrement
        @pos += @moveIncrement
        @screen.debug("moving right to " + @pos)
        for fn in @moveRegistry
          @screen.debug "Called a function"
          fn? @pos, 0
      else
        @screen.debug("can't move beyond " + @screen.width)

# The Blessed UI for Meter as Rhythm runs in an 80x25 terminal.
standardTerminalWidth = 80
standardTerminalHeight = 25
    
# BlessedDraw uses the Blessed UI to draw to the terminal.
exports.BlessedDraw = class BlessedDraw extends Draw

  # The BlessedDraw class takes a structure that gives the parameters of the
  # screen and the heights and positions of the elements.
  constructor: (screenParams) ->
    {
      @durationHeight = 11
      @expectHeight = 7
      @projHeight = 9
      @symbolHeight = 13
      @leftStart = 0
      @title = "Meter as Rhythm"
      @logName = "meter.log"
      @boxHeight = 4
    } = (screenParams ? {})

    # Insist on a screen of size 80x25.
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

    @pointHeight = 1
    @screenWidth = @screen.width

    @commentBox = @createBox "top", "left"
    @screen.append @commentBox

    @messageBox = @createBox @commentBox.position.height, "left"
    @screen.append @messageBox

    # Quit on Escape, q, or Control-C.
    @screen.key ["escape", "q", "C-c"], (ch, key) =>
      @screen.debug "exiting"
      process.exit 0

  createBox: (top, left) ->
    return blessed.Box(
      top: top
      left: left
      width: @screen.width
      height: @boxHeight
      content: ""
      border:
        type: "line"
      style:
        fg: "white"
        border:
          fg: "white"
    )

  createLine: (start, end, pos) ->
    line = blessed.Line(
      orientation: "horizontal"
      width: end - start
      top: pos
      left: start
    )

    # Lines always need to be in the back so they don't cover points.
    line.setBack()
    return line

  createText: (ch, top, left) ->
    text = blessed.Text(
      top: top
      left: left
    )
    text.setContent(ch)
    return text

  createPoint: (top, left) ->
    point = blessed.Line(
      orientation: "vertical"
      height: @pointHeight
      top: top
      left: left
    )
    point.setFront()
    return point

  clearScreen: ->
    for child in @screen.children
      @screen.remove child?
    @screen.append @commentBox
    @screen.append @messageBox

  # draw calls the parent Draw class but clears the screen first and renders it
  # after the call completes.
  draw: (points, state, states, cur) ->
    @clearScreen()
    super(points, state, states, cur)
    @screen.render()

  # drawSoundStart draws the beginning of a sound.
  drawSoundStart: (x) ->
    p = @createPoint @durationHeight, x
    @screen.append p

  # drawDuration draws the length of a duration.
  drawDuration: (start, end) ->
    @screen.debug "Called drawDuration with " + start + ", " + end
    d = @createLine start, end, @durationHeight
    @screen.append d

  # drawSoundEnd draws the endpoint of a sound.
  drawSoundEnd: (x) ->
    p = @createPoint @durationHeight, x
    @screen.append p

  # drawProjection draws a projection, potentially one that is not realized.
  drawProjection: (start, end, dashed) ->
    # TODO(tmroeder): this implementation ignores the "dashed" argument.
    proj = @createLine start, end, @projHeight
    @screen.append proj

  # drawExpected draws a projection that is expected to be realized.
  drawExpectedProjection: (start, end) ->
    exp = @createLine start, end, @expectHeight
    @screen.append exp

  # writeComment outputs comment text.
  writeComment: (text) ->
    @commentBox.setContent text

  # writeMessage outputs message text.
  writeMessage: (text) ->
    @messageBox.setContent text

  # drawHiatus outputs something that represents a hiatus.
  drawHiatus: (pos) ->
    t = createText "h", @symbolHeight, pos
    @screen.append t

  # drawAccel outputs a representation of an accelerando at the given position.
  drawAccel: (pos) ->
    t = createText "accel", @symbolHeight, pos
    @screen.append t

  # drawDecel outputs a representation of an decelerando at the given position.
  drawDecel: (pos) ->
    t = createText "decel", @symbolHeight, pos
    @screen.append t

  # drawParens outputs a representation of parentheses bracketing the range start
  # to end.
  drawParens: (start, end) ->
    t = createText "p", @symbolHeight, pos
    @screen.append t

  # drawAccent outputs an accent mark at the given point.
  drawAccent: (pos) ->
    t = createText "a", @symbolHeight, pos
    @screen.append t

  # shortSoundLength returns the length that should be used for a short sound,
  # like for some of the cases in the third sound (the ones that are past the
  # projected duration).
  shortSoundLength: -> 5

maxLen = 10
draw = new BlessedDraw()
input = new BlessedInput draw.screen, 1, "space", "left", "right"
driver = new Driver maxLen, states, input, draw

draw.screen.render()
