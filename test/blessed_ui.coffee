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
      @screen.debug("hit the space bar at " + @pos)
      for fn in @clickRegistry
        @screen.debug "Called a click function"
        fn? @pos, 0

  setUpMoveHandlers: (leftKeys, rightKeys) ->
    @screen.key leftKeys, (ch, key) =>
      if not @allowMovement
        return
      if @pos >= @moveIncrement
        @pos -= @moveIncrement
        @screen.debug("move left to " + @pos)
        for fn in @moveRegistry
          @screen.debug "Called a left function"
          fn? @pos, 0
      else
        @screen.debug "can't move below 0"

    @screen.key rightKeys, (ch, key) =>
      if not @allowMovement
        return
      if @pos <= @screen.width - @moveIncrement
        @pos += @moveIncrement
        @screen.debug("moving right to " + @pos)
        for fn in @moveRegistry
          @screen.debug "Called a right function"
          fn? @pos, 0
      else
        @screen.debug("can't move beyond " + @screen.width)

# The Blessed UI for Meter as Rhythm runs in an 80x25 terminal.
standardTerminalWidth = 80
standardTerminalHeight = 25
shortSoundLen = 5
    
# BlessedDraw uses the Blessed UI to draw to the terminal.
exports.BlessedDraw = class BlessedDraw extends Draw

  # The BlessedDraw class takes a structure that gives the parameters of the
  # screen and the heights and positions of the elements.
  constructor: (screenParams) ->
    super(shortSoundLen)

    {
      @durationHeight = 17
      @expectHeight = 13
      @projHeight = 15
      @symbolHeight = 19
      @leftStart = 0
      @title = "Meter as Rhythm"
      @logName = "meter.log"
      @boxHeight = 6
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

    @screenWidth = @screen.width

    @commentBox = @createBox "top", "left"
    @messageBox = @createBox @commentBox.position.height, "left"
    @screen.append @messageBox
    @screen.append @commentBox

    @firstLine = @createLine 0, 0, @durationHeight
    @secondLine = @createLine 0, 0, @durationHeight
    @thirdLine = @createLine 0, 0, @durationHeight
    @screen.append @firstLine
    @screen.append @secondLine
    @screen.append @thirdLine

    @firstProj = @createLine 0, 0, @projHeight, "red"
    @secondProj = @createLine 0, 0, @projHeight, "yellow"
    @expectedProj = @createLine 0, 0, @expectHeight, "green"
    @screen.append @firstProj
    @screen.append @secondProj
    @screen.append @expectedProj

    @hiatus = @createText "h", @symbolHeight, 0
    @accel = @createText "accel", @symbolHeight, 0
    @decel = @createText "decel", @symbolHeight, 0
    @parens = @createText "p", @symbolHeight, 0
    @accent = @createText "a", @symbolHeight, 0
    @screen.append @hiatus
    @screen.append @accel
    @screen.append @decel
    @screen.append @parens
    @screen.append @accent

    # Quit on Escape, q, or Control-C.
    @screen.key ["escape", "q", "C-c"], (ch, key) =>
      @screen.debug "exiting"
      process.exit 0

  createBox: (top, left) ->
    return blessed.Box(
      top: top
      left: left
      width: standardTerminalWidth
      height: @boxHeight
      content: ""
      border:
        type: "line"
      style:
        fg: "white"
        border:
          fg: "white"
    )

  createLine: (start, end, pos, color) ->
    return blessed.Line(
      orientation: "horizontal"
      width: end - start
      top: pos
      left: start
      style:
        fg: color ? "blue"
        invisible: true
    )

  createText: (ch, top, left) ->
    text = blessed.Text(
      top: top
      left: left
      invisible: true
    )
    text.setContent(ch)
    return text

  # draw calls the parent Draw class and follows it by rendering the screen.
  draw: (points, state, states, cur) ->
    super(points, state, states, cur)
    @updateElements()
    @screen.render()

  updateDuration: (lineName, line) ->
    start = @state.lines[lineName]?[Draw.start] ? 0
    end = @state.lines[lineName]?[Draw.end] ? 0
    line.left = start
    line.width = end - start
    line.style.invisible = start == 0 and end == 0

  updateProjection: (lineName, projType, proj) ->
    start = @state.projs[lineName]?[projType]?[Draw.start] ? 0
    end = @state.projs[lineName]?[projType]?[Draw.end] ? 0
    proj.left = start
    proj.width = end - start
    proj.style.invisible = start == 0 and end == 0

  updateElements: ->
    @commentBox.setContent(@state.text[Draw.comment] ? "")
    @messageBox.setContent(@state.text[Draw.message] ? "")

    @updateDuration Draw.first, @firstLine
    @updateDuration Draw.second, @secondLine
    @updateDuration Draw.third, @thirdLine

    @updateProjection Draw.first, Draw.proj, @firstProj
    @updateProjection Draw.first, Draw.exp, @expectedProj
    @updateProjection Draw.second, Draw.proj, @secondProj

    @hiatus.left = @state.hiatus
    @hiatus.style.invisible = @hiatus.left == 0
    @accel.left = @state.accel
    @accel.style.invisible = @accel.left == 0
    @decel.left = @state.decel
    @decel.style.invisible = @decel.left == 0
    @parens.left = @state.parens
    @parens.style.invisible = @parens.left == 0
    @accent.left = @state.accent
    @accent.style.invisible = @accent.left == 0

exports.StartUI = ->
  maxLen = 10
  draw = new BlessedDraw()
  input = new BlessedInput draw.screen, 2, "space", "left", "right"
  driver = new Driver maxLen, states, input, draw
  draw.screen.key "c", (data) =>
    draw.screen.debug "Current driver state is " + driver.cur

  draw.screen.render()
