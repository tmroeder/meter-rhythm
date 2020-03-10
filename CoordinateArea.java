import java.awt.*;
import java.awt.event.*;
import javax.swing.event.*;

// The class to deal with the main mouse events and to handle the display
public class CoordinateArea extends Canvas {
	Rhythm controller; // a controlling object
	Point[] line1; // the line connecting the first two points
	Point[] line2; // ditto for the second two
	Point[] line3; // same here for the third
	boolean arcing1 = false; // is the first arc on?
	boolean arcing2 = false; // is the second?
	boolean in1 = false; // are we in the first line?
	boolean in2 = false; // second?
	boolean done = false; // have we finished (in one of the many ways)?
	Point moveArcPos = null; // where the end of the current arc is
	public final static int interval = 5; // constant for drawing
	public final static int unitLength = 400/3; // same here
	int X1 = -1; // where is the X through the first dashed arc?
	boolean redrawDashedArc1 = false; // do we resize the first dashed arc?
	boolean clickToChange = false; // can we click anywhere to switch views?
	boolean addParenthShort = false; // do we add a hypothetical segment?
	boolean inAlternativeView = false; // are we in a second view?
	boolean drawTracks = false; // do we draw the railroad tracks?

	public void restart() {

		// set all the points to null
		for(int i = 0; i < 2; i++) {
			line1[i] = null;
			line2[i] = null;
			line3[i] = null;
		}

		// and reset all the data to its default state
		arcing1 = arcing2 = in1 = in2 = done = false;
		moveArcPos = null;
		redrawDashedArc1 = clickToChange = addParenthShort = false;
		inAlternativeView = drawTracks = false;
		X1 = -1;

		// then redraw
		repaint();
	}

	public void backOne(int wherein) {
		switch (wherein) {
		case 0:
			// only one point was defined, so just reset everything
			restart();
			controller.setMessages(0);
			break;
		case 1:
			// two points were defined,
			// so put us back into drawing the first line
			in1 = true;
			// reset the drawing point
			line1[1] = null;
			// set the default message (this'll change very quickly)
			controller.setMessages(2);
			// turn off any possible X's
			X1 = -1;
			// make sure the arcing is set
			arcing1 = true;
			// we're not done, either
			done = false;
			break;
		case 2:
			// three points were defined,
			// so reset the third point to null
			line2[0] = null;
			// fix the arcing parameters
			arcing1 = true;
			arcing2 = false;
			// get us out of the second event
			in2 = false;
			// turn off any possible X's
			X1 = -1;
			// set the default message
			controller.setMessages(7);
			break;
		case 3:
			// four points were defined
			line2[1] = null;
			// so put us back into the second event
			in2 = true;
			// turn off the X's
			X1 = -1;
			// set the default message
			controller.setMessages(10);
			// make sure the arcing is set correctly
			arcing2 = true;
			// we're not done anymore
			done = false;
			break;
		case 4: case 5:
			// all 6 points were defined, since the 5th event generates a 6th
			// so set the second line back to null
			line3[0] = null;
			line3[1] = null;
			// (note that we can never be in the third event)
			// set the second arc to begin again
			arcing2 = true;
			// we're not done anymore
			done = false;
			// nor are we in a possible alternate reality ;-)
			inAlternativeView = false;
			// nor can we click to change
			clickToChange = false;
			// and the next three variables cannot possibly be set yet
			addParenthShort = false;
			redrawDashedArc1 = false;
			drawTracks = false;
			// so set the default message
			controller.setMessages(13);
			break;
		}
		repaint();
	}

	// a standard constructor
	public CoordinateArea(Rhythm controller) {
		super();
		// create the new lines and make them null
		line1 = new Point[2];
		line2 = new Point[2];
		line3 = new Point[2];
		for(int i = 0; i < 2; i++) {
			line1[i] = null;
			line2[i] = null;
			line3[i] = null;
		}

		// set the controller
		this.controller = controller;
	}

	// the mouseDown event handler
	public void handleMouseDown(int x, int y) {
		// if we can go to another reality :-)
		if (clickToChange) {
			// set that fact, and fix it so nothing else can happen
			inAlternativeView = true;
			clickToChange = false;
			done = true;
			controller.setMessages(23);
			repaint();
		}

		// if we're not done yet
		if (!done) {
			// just pass it off to the more intelligent code in Rhythm
			controller.newPoint(x, y);
			// and then fix the condition variables
			switch (controller.getWherein()) {
			case 0:
				// we just started the first event
				// so start arcing
				arcing1 = true;
				// the point must be at 0
				line1[0] = new Point(0,y);
				// note that we're in the first event
				in1 = true;
				// set the appropriate message
				controller.setMessages(1);
				break;
			case 1:
				// we just ended the first event
				// so note that this happened
				in1 = false;
				// make sure we're not indeterminate, and finish if we are
				if ((x > 0) && (x <= unitLength))
					controller.setMessages(4);
				else {
					controller.setMessages(5);
					done = true;
				}
				// get the new point
				line1[1] = new Point(x,y);
				break;
			case 2:
				// we just started the second event
				// so stop the first arc and begin the second
				arcing1 = false;
				arcing2 = true;
				// note that we're in the second event
				in2 = true;
				// now make sure we haven't gone too far in the intervening space
				int a = controller.getPoint(1).x;
				if ((x >= a) && (x < (a + unitLength)))
					controller.setMessages(8);
				else if (x >= (a + unitLength)) {
					controller.setMessages(9);
					done = true;
				}
				// and get the next point
				line2[0] = new Point(x,y);
				break;
			case 3:
				// we just ended the second event
				// so note this fact
				in2 = false;
				// now check to see what the distance relationships are
				// and print the correct commentary and instructions
				int b = controller.getPoint(2).x;
				if (x < (2*b))
					controller.setMessages(13);
				else if ((x > 2*b) && (x < b + unitLength)) {
					controller.setMessages(14);
					done = true;
				} else if (x > b + unitLength) {
					controller.setMessages(15);
					done = true;
				} else if (x == 2*b)
					controller.setMessages(20);
				// now get the new point
				line2[1] = new Point(x,y);
				break;
			case 4:
				// we're just starting the third event now; we'll end it too
				// so turn off the arcing
				arcing2 = false;
				// get the beginning of the second event
				int where = controller.getPoint(2).x;
				line3[0] = new Point(x,y);
				if ((x < 2*where) && (x >= 1.75*where)) {
					controller.setMessages(19);
					controller.newPoint(2*where - 5, y);
					line3[1] = new Point(2*where - 5, y);
					redrawDashedArc1 = true;
				} else if ((x < 1.75*where) && (x >= controller.getPoint(3).x)) {
					controller.setMessages(22);
					clickToChange = true;
					addParenthShort = true;
					controller.newPoint(2*where - 5, y);
					line3[1] = new Point(2*where - 5, y);
				} else if (x == 2*where) {
					controller.setMessages(20);
					controller.newPoint(x + 20, y);
					line3[1] = new Point(x + 20, y);
				} else if (x > where + unitLength) {
					controller.newPoint(x + 20, y);
					line3[1] = new Point(x + 20, y);
					controller.setMessages(21);
					drawTracks = true;
				} else if ((x < 2.5*where) && (x > 2*where)) {
					controller.setMessages(24);
					controller.newPoint(x + 20, y);
					line3[1] = new Point(x + 20, y);
					redrawDashedArc1 = true;
				} else if ((x > 2.5*where) && (x < where + unitLength)) {
					controller.newPoint(x + 20, y);
					line3[1] = new Point(x + 20, y);
					controller.setMessages(25);
				} else if (x > where + unitLength) {
					controller.newPoint(x + 20, y);
					line3[1] = new Point(x + 20, y);
					controller.setMessages(26);
					drawTracks = true;
				}
				done = true;
				break;
			case 5:
				done = true;
				break;
			}
			repaint();
		}
		return;
	}

	// The mouseMove code
	public void handleMouseMove(int x, int y) {
		if (!done) {
			if (in1) {
				line1[1] = new Point(x,y);
				if (x == 0)
					controller.setMessages(1);
				else if (x <= unitLength) {
					controller.setMessages(2);
					arcing1 = true;
				} else {
					controller.setMessages(3);
					arcing1 = false;
				}
				repaint();
			}
			if (in2) {
				int b = line2[0].x;
				if (x >= b)
					line2[1] = new Point(x,y);
				else
					line2[1] = null;
				if (x <= 2*b)
					X1 = -1;
				if (x < 2*b)
					controller.setMessages(10);
				else if ((x > 2*b) && (x < (b + unitLength))) {
					controller.setMessages(11);
					X1 = b;
					arcing2 = true;
				} else if (x > (b + unitLength)) {
					controller.setMessages(12);
					arcing2 = false;
				}
				repaint();
			}

			/*     if (in3)
				   if (x >= line3[0].x)
				   line3[1] = new Point(x,y);
				   else
				   line3[1] = null;
			*/

			if (controller.getPoint(2) == null) {
				if (controller.getPoint(0) != null) {
					if (x > controller.getPoint(0).x + unitLength)
						arcing1 = false;
					else if (!in1)
						arcing1 = true;
				}
			} else {
				if (x > controller.getPoint(2).x + unitLength)
					arcing2 = false;
				else if (!in1 && !in2)
					arcing2 = true;
			}

			if (in2 || arcing2) {
				arcing1 = false;
			}

			if (arcing1 || arcing2) {
				moveArcPos = new Point(x, y);
				if (arcing1 && !in1)
					if (x < controller.getPoint(1).x)
						controller.setMessages(6);
					else if ((x > controller.getPoint(1).x) &&
							 (x < controller.getPoint(1).x + unitLength))
						controller.setMessages(7);
				if (arcing2 && !in2)
					if (x < controller.getPoint(3).x)
						controller.setMessages(16);
					else if ((x > controller.getPoint(3).x) &&
							 (x < controller.getPoint(3).x + unitLength))
						controller.setMessages(17);
					else if (x > controller.getPoint(3).x + unitLength) {
						controller.setMessages(18);
					}
			}
			repaint();
		}
		return;
	}

	/* a simple helper routine to draw a 180 degree dashed arc on
	 *  a graphics object g, starting at start and going for length.
	 */
	public void drawDashedArcSpecial(Graphics g, int start, int length, int y) {
		for(int i = 0; i < 17; i += 2)
			g.drawArc(start, y, length, 15, -(i*10), 10);
	}

	// Another helper, this time to draw an arrowhead at the end of a line
	public void drawArrowhead(Graphics g, int x, int y) {
		g.drawLine(x, y, x - 5, y + 5);
		g.drawLine(x, y, x + 5, y + 5);
		g.drawLine(x - 5, y + 5, x + 5, y + 5);
	}

	// A helper to draw railroad tracks
	public void drawParallel(Graphics g, int whereX, int whereY) {
		g.drawLine(whereX - 5, whereY - 5, whereX - 5, whereY + 5);
		g.drawLine(whereX - 8, whereY - 5, whereX - 8, whereY + 5);
	}

	// A helper to draw an arrow
	public void drawArrow(Graphics g, int where) {
		g.drawArc(where, 60, 30, 15, -90, -90);
		g.drawLine(where + 10, 70, where + 15, 75);
		g.drawLine(where + 10, 80, where + 15, 75);
	}

	// A helper to draw an X through an arc
	public void addX(Graphics g, int start) {
		int halfway = 3*start/2;
		g.drawLine(halfway - 10, 65, halfway + 10, 75);
		g.drawLine(halfway - 10, 75, halfway + 10, 65);
	}

	// A helper to draw an "accel" centered at xEnd
	public void drawAccel(Graphics g, int xEnd) {
		g.drawString("accel.", xEnd - 20, 110);
	}

	public void drawRall(Graphics g, int xEnd) {
		g.drawString("rall.", xEnd - 20, 110);
	}

	// a helper to draw an accent centered at center
	public void drawAccent(Graphics g, int center, int height) {
		g.drawLine(center - 2, height - 2, center + 2, height);
		g.drawLine(center - 2, height + 2, center + 2, height);
	}

	// a helper to draw a hypothetical parenthesized point
	public void drawShortParenth(Graphics g, int center) {
		g.drawString("(", center, 60);
		g.drawLine(center + 2, 55, center + 30, 55);
		g.drawString(")", center + 32, 60);
	}

	/* This code will be called an umpteen number of times, since it is used
	 *  in the execution of repaint().
	 */
	public void paint(Graphics g) {
		// draw a number line
		int unitLength2 = unitLength/interval;
		g.drawLine(0, 10, 3*unitLength, 10);
		for (int n = 0; n < 3*interval; n++)
			g.drawLine(n*unitLength2, 8, n*unitLength2, 12);
		for (int k = 0; k < 4; k++) {
			g.drawLine(k*unitLength2*interval, 5, k*unitLength2*interval, 15);
			switch (k) {
			case 0:
				g.drawString(Integer.toString(k),
							 k*unitLength + 3, 25);
				break;
			case 1:
				g.drawString("Lim",
							 k*unitLength - 10, 25);
				break;
			case 2:
				g.drawString(Integer.toString(k) + "*Lim",
							 k*unitLength - 20, 25);	
				break;
			case 3:
				g.drawString(Integer.toString(k) + "*Lim",
							 k*unitLength - 35, 25);	
				break;
			}
		}

		// draw any points stored in the array
		for(int i = 0; i < 6; i++) {
			Point point = controller.getPoint(i);
			if (point != null)
				g.fillRect(point.x - 1, 50, 2, 2);
		}

		// draw the lines as we drag
		if (line1[0] != null && line1[1] != null
			&& controller.getPoint(1) == null)
			g.drawLine(line1[0].x, 50, line1[1].x, 50);
		if (line2[0] != null && line2[1] != null
			&& controller.getPoint(3) == null)
			g.drawLine(line2[0].x, 50, line2[1].x, 50);
		if (line3[0] != null && line3[1] != null
			&& controller.getPoint(5) == null)
			g.drawLine(line3[0].x, 50, line3[1].x, 50);

		//... and then once they're stable
		for(int i = 0; i <= 4; i += 2) {
			Point start = controller.getPoint(i);
			Point end = controller.getPoint(i+1);
			if (start != null && end != null)
				g.drawLine(start.x, 50, end.x, 50);
		}

		if (!inAlternativeView) {
			// draw the arcs if we're arcing
			if (arcing1) {
				if (moveArcPos != null) {
					int end = moveArcPos.x;
					if (line1[1] != null) {
						if (line1[1].x <= end)
							g.drawArc(0, 55, 2*end , 15, -90, -90);
						else
							g.drawArc(0, 55, 2*line1[1].x, 15, -90, -90);
					}
				}
			} else if (arcing2) {
				if (line2[0] != null && moveArcPos != null) {
					int start = line2[0].x;
					int end = moveArcPos.x;
					if (line2[1] != null) {
						if (in2)
							g.drawArc(start, 80, 2*(end - start), 15, -90, -90);
						else if (line2[1].x <= end)
							g.drawArc(start, 80, 2*(end - start), 15, -90, -90);
						else
							g.drawArc(start, 80, 2*(controller.getPoint(3).x - start),
									  15, -90, -90);			
					}	
				}
			}

			// draw railroad tracks and an arrow if we're supposed to
			if (drawTracks) {
				drawParallel(g, controller.getPoint(2).x + unitLength, 50);
				drawArrow(g, line3[0].x);
	
			}

			// Draw an X if we're supposed to
			if (X1 != -1)
				addX(g, X1);

			// add an extra hypothetical event if we're supposed to
			if (addParenthShort) {
				int b = controller.getPoint(2).x;
				drawShortParenth(g, 2*b);
			}

			// Draw arcs between the first and third points and the second and fourth
			// Also draw a dashed arc projection.
			for (int m = 0; m <= 2; m += 2) {
				Point point1 = controller.getPoint(m);
				Point point2 = controller.getPoint(m+1);
				Point point3 = controller.getPoint(m+2);
				if ((point1 != null) && (point2 != null) && (point3 != null)) {
					if (m == 0) {
						int xStart = point1.x;
						int xEnd = point3.x;
						g.drawArc(xStart, 55, xEnd - xStart, 15, 0, -180);
						drawArrowhead(g, xEnd, 55);
						if (redrawDashedArc1) {
							xEnd = controller.getPoint(4).x;
							if (xEnd > 2*point3.x)
								drawRall(g, xEnd);
							else
								drawAccel(g, xEnd);
							for(int i = 0; i < 17; i += 2)
								g.drawArc(point3.x, 55, xEnd - point3.x, 15, -(i*10), 10);
						} else
							drawDashedArcSpecial(g, xEnd, xEnd - xStart, 55);
					}
					if (m == 2) {
						int xStart = point1.x;
						int xEnd = point3.x;
						g.drawArc(xStart, 80, xEnd - xStart, 15, 0, -180);
						drawArrowhead(g, xEnd, 80);
						drawDashedArcSpecial(g, xEnd, xEnd - xStart, 80);
					}
				}
			}
		} else if (controller.getPoint(4) != null) {
			int xStart1 = controller.getPoint(0).x;
			int xEnd1 = controller.getPoint(2).x;
			int xStart2 = xStart1;
			int xEnd2 = controller.getPoint(4).x;
			g.drawArc(xStart1, 55, xEnd1 - xStart1, 15, 0, -180);
			drawArrowhead(g, xEnd1, 55);
			for(int i = 8; i < 17; i += 2)
				g.drawArc(xEnd1, 55, xEnd2 - xEnd1, 15, -(i*10), 10);
			addX(g, (xEnd1 + xEnd2)/3);
			drawAccent(g, xEnd2, 45);
			g.drawArc(xStart2, 80, xEnd2 - xStart2, 15, 0, -180);
			drawArrowhead(g, xEnd2, 80);
			drawDashedArcSpecial(g, xEnd2, xEnd2 - xStart2, 80);
		}
	}
}


