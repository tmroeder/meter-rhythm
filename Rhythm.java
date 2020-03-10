import java.awt.*;
import java.awt.event.*;
import javax.swing.event.*;

/*
 * The basic structure of this code originates in a Sun
 *  Microsystems code fragment which receives a mouse click in a frame
 *  and prints the coordinates of the click and a dot where the click was.
 *  It has been completely modified to implement an
 *  interactive demo of a theory of musical meter.
 *  (Christopher F. Hasty, *Meter as Rhythm*, Oxford, 1997)
 *  The user can input 3 click-move-click sequences to define three events,
 *  and the program will give a graphical representation of these events
 *  together with some commentary and instructions.
 *  Program design: John Roeder
 *  Java programming: Tom Roeder, 1998.
 */

public class Rhythm extends Panel {
	CoordinateArea coordinateArea; // the area receiving the clicks
	TextArea label; // to hold the instructions to the user
	Button button1, button2; // the "Back one step" and "Restart" buttons
	TextArea textArea; // to hold the commentary
	// TextArea results; // not required any more: used to hold results
	final int commWidth = 60;
	final int commHeight = 6;
	Point[] points; // the array of events
	int wherein; // where we are in the array
	String buffer = ""; // a handy constant to have, given what happens in init
	MouseHandler mouseHandler; // a handler for the mouse events (calls into the coordinateArea)
	//final int row1Begin = 0; // result-associated comments
	//final int row1End = 53;
	//final int row2Begin = 54;
	//final int row2End = 107;
	//final int row3Begin = 108;
	//final int row3End = 161;
	//final int row4Begin = 162;
	//final int row4End = 215;
	//final int row5Begin = 216;
	//final int row5End = 269;

	// an inner class to handle mouse events on the containing CoordinateArea
	private class MouseHandler extends MouseInputAdapter {
		CoordinateArea area;

		// Initializes a new instance of the MouseHandler class with the parent CoordinateArea
		public MouseHandler(CoordinateArea area) {
			if (null == area) {
				throw new IllegalArgumentException("The MouseHandler class was passed a null CoordinateArea object");
			}

			this.area = area;
		}

		// handle the mouseClicked event by passing it to the handleMouseDown method
		public void mouseClicked(MouseEvent event) {
			int x = event.getX();
			int y = event.getY();
			
			this.area.handleMouseDown(x, y);
		}

		// handle the mouseMoved event by passing it to the handleMouseMove method 
		public void mouseMoved(MouseEvent event) {
			int x = event.getX();
			int y = event.getY();
			
			this.area.handleMouseMove(x, y);
		}

	}

	/* The messages to go into the commentary box */
	final static String commIntro = "This applet demonstrates the concepts in Chapter 7 of\n Christopher Hasty\'s \"Meter as Rhythm\". Imagine time 0\n as an instant that is a potential beginning of a sound,\n yet prior to and independent of it.";
	final static String comm1MoveStart = "The first sound begins, but time 0 will not be a beginning\n until it is past.";
	final static String comm1MoveP5 = "The first sound is becoming. Time 0 becomes its beginning.\n \"Projective potential\"--the potential of a duration to\n be reproduced by a successive duration--accumulates,\n as indicated by the solid arc.";
	final static String comm1MoveA5 = "The first sound\'s duration is so long that it is\n \"mensurally indeterminate\"--it has lost its projective\n potential to be reproduced.";
	final static String commEnd1Right = "The first sound ends. Its duration is \"mensurally\n determinate\" because it has the potential for being\n precisely reproduced.";
	final static String commEnd1Wrong = "The first sound ends; it is too long to have\n projective potential.";
	final String commTooBack = buffer;
	final static String commPLimit = "There is a pause between the first two sounds. Its duration\n is relatively indeterminate, if our attention is focused\n on the beginning of sounds. The growing arc indicates that\n the duration of the first sound *plus* the following\n silence itself has the \"projective potential\" to be\n reproduced.";
	final static String commPLimitEvent = "This beginning of the second sound \"realizes\" the\n projective potential of the duration begun by the first\n event\'s attack. The solid arrow represents this\n projective potential. The event now beginning has the\n potential to reproduce this past duration. The dotted arc,\n extending for this duration into the future, symbolizes this\n \"projected potential\".";
	final static String commALimitEvent = "The second sound begins. It is so long since the beginning\n of the first event that the interonset duration is mensurally\n indeterminate--it has no potential to be reproduced--so\n there is no projection.";
	final static String commP2bMove = "The accumulating duration of the second sound is realizing\n the projected potential (symbolized by the dashed arc) of\n the first interonset duration. Simultaneously the present\n event accumulates its own projective potential\n (represented by the growing solid arc) to be reproduced by\n a successive, third event.";
	final static String commA2bPbPLimitMove = "The second sound exceeds the duration projected at its onset;\n the projection is not clearly realized, as indicated by\n the X through the dashed arc.";
	final static String commAbPLimitMoveIn2 = "The second sound is so long that it is mensurally\n indeterminate. (The projection of the first interonset\n duration is not realized.)";
	final static String commP2bEvent = "The second sound ends. Its duration is \"mensurally\n determinate\" because it has the potential for being\n precisely reproduced. But it does not affect the\n projection of the first interonset duration, shown by the\n arrow and dashed arc";
	final static String commA2bPbLimitEvent = "The second sound exceeds the duration projected at its\n onset. The projection is not clearly realized, as\n indicated by the X through the dashed arc. The projective\n potential of the duration initiated by the second\n sound\'s beginning continues to accumulate.";
	final static String commAbPLimitEventIn2 = "The second sound is so long that it is mensurally\n indeterminate. Since the projected potential of the first\n interonset duration is denied there is no projection at all.";
	final String commPcMove = buffer;
	final static String commAcPEbPLimitMove = "The silence between the second and third sounds is\n relatively indeterminate if our attention is focused on the\n sounds\' beginnings. The growing arc indicates that the\n duration from the beginning of the second sound up to now,\n including the silence, has \"projective potential\" to be\n reproduced.";
	final static String commAbPLimitMove = "The time since the beginning of the second sound is\n mensurally indeterminate, having no projective potential\n to be reproduced.";
	final static String commdP2bAE175bEvent = "The beginning of the third sound is earlier than projected.\n The second interonset duration is shorter than, but at\n least three-fourths of the first interonset duration.\n We feel an *acceleration* because we sense the realization\n of the first projected duration even as we also perceive\n the difference between the two durations.";
	final static String commdE2bEvent = "Since the third sound begins exactly at the end of the\n projected duration (the upper dashed arc), the projected\n duration is \"realized\". A new projection is created,\nconditioned by the first, in which the second interonset\n duration has the projective potential (the lower arrow)\n to be reproduced.";
	final static String commAbPLimitEvent = "The projective potential of the first interonset duration\n (the dashed arc) is realized, but the projective potential\n of the second interonset duration is not, since it is\n mensurally indeterminate. Because the third sound begins\n much later than projected, we may come to feel \"hiatus\"\n (symbolized by the double bar)--a break between the\n realization of projected potential and a new beginning. A\n new and relatively unconditioned potential emerges\n from the beginning of the third sound.";
	final static String commdP175bEvent1 = "The projection of the first interonset duration is realized.\n Another projection (the rightmost arrow and dashed arc)\n can be completed within the promised duration, so may\n enhance its mensural determinacy. The emergence of a new\n beginning, shown in parentheses, would clarify this.";
	final static String commdP175bEvent2 = "In this interpretation the accent symbolizes an unequivocal\n second beginning that denies the projection of the first\n interonset duration in order to realize a larger projective\n potential, symbolized by the large arrow.";
	final static String commdB2t25Event = "The beginning of the third sound is slightly later than\n projected. We hear a *deceleration* because we sense the\n realization of the first projected duration even as we\n also perceive the difference between the two durations.";
	final static String commA25bPbPLimitEvent = "The third sound begins somewhat later than projected. A new\n projection, indicated by the lowest arrow and dashed arc,\n emerges, breaking off from the emerging first projection.\n We reject the relevance of the first projection to the\n mensural determinacy of the second interonset duration.";

	/* The messages to go into the instruction box */
	final static String instrStart = "You may perform graphically up to three successive sounds\n by clicking and moving the mouse. First, click the mouse\n at time 0, the leftmost point, but don\'t move it.";
	final static String instr1MoveStart = "Perform the first sound by moving the mouse to the right.";
	final static String instr1MoveP5 = "End the first sound by clicking the mouse.";
	final static String instr1MoveA5 = "To make the first sound's duration determinate, move the\n mouse back to the left. Or click to end the sound.";
	final static String instrEnd1Right = "To begin the second sound, click the mouse.";
	final static String instrEnd1Wrong = "Click on the Restart button to try again.";
	final static String instrTooBack = "Click the mouse at the end of the first sound or later.";
	final static String instrPLimit = "Click the mouse to begin the second sound.";
	final static String instrPLimitEvent = "Perform the second sound by moving the mouse to the right.";
	final static String instrALimitEvent = "Click on the \"Back one step\" button to select an earlier\n beginning for the second sound, or click \"Restart\".";
	final static String instrP2bMove = "Click the mouse to end the second sound.";
	final static String instrA2bPbPLimitMove = "Click the mouse to end the second sound.";
	final static String instrAbPLimitMoveIn2 = "Move the mouse to the left to shorten the second sound,\n or click the mouse to end it.";
	final static String instrP2bEvent = "Click on the \"Back one step\" button to select an earlier\n beginning for the second sound, or click \"Restart\".";
	final static String instrA2bPbLimitEvent = "Click the mouse to begin the third sound.";
	final static String instrAbPLimitEventIn2 = "Click on the \"Back one step\" button to define a\n different second sound or \"Restart\" to start all over.";
	final static String instrPcMove = "Click the mouse at the end of the second sound or later.";
	final static String instrAcPEbPLimitMove = "Click the mouse button to begin the third sound.";
	final static String instrAbPLimitMove = "Click the mouse button to begin the third sound (earlier if\n you want a projection).";
	final static String instrdP2bAE175bEvent = "Click on \"Back one step\" to define a different third sound\n or \"Restart\" to begin again.";
	final static String instrdE2bEvent =  "Click on \"Back one step\" to define a different third sound\n or \"Restart\" to begin again.";
	final static String instrAbPLimitEvent =  "Click on \"Back one step\" to define a different third sound\n or \"Restart\" to begin again.";
	final static String instrdP175bEvent1 = "Click anywhere to see an alternate interpretation.";
	final static String instrdP175bEvent2 =  "Click on \"Back one step\" to define a different third sound\n or \"Restart\" to begin again.";
	final static String instrdB2t25Event =  "Click on \"Back one step\" to define a different third sound\n or \"Restart\" to begin again.";
	final static String instrA25bPbPLimitEvent =  "Click on \"Back one step\" to define a different third sound\n or \"Restart\" to begin again.";

	public void init() {
		/* This gridbag code is used to set everything up in its
		 *  proper place.
		 */
		GridBagLayout layout = new GridBagLayout();
		setLayout(layout);

		/* First we want a text area into which go the various explanations
		 *  (The text area for instructions is below the graphics)
		 */
		textArea = new TextArea(commIntro, commHeight, commWidth);
		GridBagConstraints taConstraints = new GridBagConstraints();
		taConstraints.fill = GridBagConstraints.HORIZONTAL;
		taConstraints.gridwidth = GridBagConstraints.REMAINDER;
		layout.setConstraints(textArea, taConstraints);
		textArea.setEditable(false);
		add(textArea);


		/* Here we add the main, controlling part of the applet: the
		 *  coordinateArea (see class below).  It serves to receive the
		 *  events and display the results.
		 */
		coordinateArea = new CoordinateArea(this);
		GridBagConstraints caConstraints = new GridBagConstraints();
		caConstraints.fill = GridBagConstraints.BOTH;
		caConstraints.weighty = 1.0;
		caConstraints.gridwidth = GridBagConstraints.REMAINDER; //end row
		layout.setConstraints(coordinateArea, caConstraints);
		add(coordinateArea);

		// add our MouseHandler class as a listener on the coordinateArea
		this.mouseHandler = new MouseHandler(this.coordinateArea);
		this.coordinateArea.addMouseListener(this.mouseHandler);
		this.coordinateArea.addMouseMotionListener(this.mouseHandler);


		/* The data for each of the points to be defined later
		   results = new TextArea("           | First Sound | Second Sound |
		   Third Sound ------------------------------------------------------begin
		   time |             |              |             end time   |             |
		   |             duration   |             |              |
		   ", 5, 54, TextArea.SCROLLBARS_NONE);
		   c.fill = GridBagConstraints.NONE;
		   c.weightx = 1.0;
		   c.weighty = 0.0;
		   results.setEditable(false);
		   gridBag.setConstraints(results, c);
		   add(results);
		*/


		/* This label is merely used for displaying status and other
		 *  handy pieces of information.
		 */
		label = new TextArea(instrStart, 5, 70);
		GridBagConstraints lConstraints = new GridBagConstraints();
		lConstraints.fill = GridBagConstraints.HORIZONTAL;
		lConstraints.gridwidth = GridBagConstraints.REMAINDER;
		lConstraints.weightx = 1.0;
		lConstraints.weighty = 0.0;
		label.setEditable(false);
		layout.setConstraints(label, lConstraints);
		add(label);

		/* I then added two buttons which do exactly as they claim (see action
		 *  code below).
		 */
		button1 = new Button("Back one step");
		GridBagConstraints b1Constraints = new GridBagConstraints();

		// place this directly below the last added component (the text area)
		b1Constraints.gridy = GridBagConstraints.RELATIVE;
		layout.setConstraints(button1, b1Constraints);
		add(button1);

		// initialize the listener for this button
		button1.addActionListener(
								  new ActionListener() {
									  public void actionPerformed(ActionEvent e) {
										  pressedBack();
									  }
								  });

		button2 = new Button("Restart");
		GridBagConstraints b2Constraints = new GridBagConstraints();

		// place this button directly to the right of the previous button
		b2Constraints.gridx = GridBagConstraints.RELATIVE;
		layout.setConstraints(button2, b2Constraints);
		add(button2);

		// initialize the listener for this class, as well
		button2.addActionListener(
								  new ActionListener() {
									  public void actionPerformed(ActionEvent e) {
										  pressedRestart();
									  }
								  });

		// I initialize the points and their associated index pointer
		points = new Point[6];
		for (int i = 0; i < 6; i++)
			points[i] = null;
		wherein = -1;

		// make the buffer big enough to erase anything else
		for (int i = 0; i< 200; i++)
			buffer += " ";

		doLayout();
		validate();
	}

	/* This method is the main workhorse of the class; it serves to control
	 *  the points and their array, to the point of deciding whether or not
	 *  to add a new one and printing associated status messages.  It is
	 *  called from the coordinateArea class.
	 */
	public void newPoint(int x, int y) {
		for(int i = 0; i <= wherein; i++) { // for each earlier point
			if (points[i].x >= x) { // make sure it preceedes the current
				//...otherwise complain and die
				label.setText("Not a well-defined event. Try again");
				coordinateArea.backOne(wherein + 2);
				repaint();
				return;
			}
		}
		//...but if we're OK, increment the index and add the point
		wherein++;
		if (wherein != 0)
			points[wherein] = new Point(x, y);
		else
			points[wherein] = new Point(0, y);
		// print the status message
		//int val =
		Math.round((x/(coordinateArea.unitLength/(float)(coordinateArea.interval))))
			;
		/*switch (wherein) {
		  case 1:
		  results.replaceText(String.valueOf(val), row3Begin + 13, row3Begin + 26);
		  break;
		  case 2:
		  results.replaceText(String.valueOf(val), row4Begin + 13, row4Begin + 26);
		  int val2 = Math.round((points[wherein -
		  1].x)/(coordinateArea.unitLength/(float)(coordinateArea.interval)));
		  results.replaceText(String.valueOf(val2 - val), row3Begin + 13,
		  row3Begin + 26);
		  break;
		  }*/
		/*  label.replaceRange("Event " + ((wherein + 2)/2) +
			" began at " +
	
			Math.round((points[wherein-1].x)/(coordinateArea.unitLength/(float)(coordina
			teArea.interval))) +
			" and ended at " +
	
			Math.round(x/(coordinateArea.unitLength/(float)(coordinateArea.interval))),
			0, 200 );
		*/
		//...and repaint
		repaint();
	}

	public void setMessages(int x) {
		switch (x) {
		case -1:
			label.setText("");
			textArea.setText("");
			break;
		case 0:
			label.setText(instrStart);
			textArea.setText(commIntro);
			break;
		case 1:
			label.setText(instr1MoveStart);
			textArea.setText(comm1MoveStart);
			break;
		case 2:
			label.setText(instr1MoveP5);
			textArea.setText(comm1MoveP5);
			break;
		case 3:
			label.setText(instr1MoveA5);
			textArea.setText(comm1MoveA5);
			break;
		case 4:
			label.setText(instrEnd1Right);
			textArea.setText(commEnd1Right);
			break;
		case 5:
			label.setText(instrEnd1Wrong);
			textArea.setText(commEnd1Wrong);
			break;
		case 6:
			label.setText(instrTooBack);
			textArea.setText(commTooBack);
			break;
		case 7:
			label.setText(instrPLimit);
			textArea.setText(commPLimit);
			break;
		case 8:
			label.setText(instrPLimitEvent);
			textArea.setText(commPLimitEvent);
			break;
		case 9:
			label.setText(instrALimitEvent);
			textArea.setText(commALimitEvent);
			break;
		case 10:
			label.setText(instrP2bMove);
			textArea.setText(commP2bMove);
			break;
		case 11:
			label.setText(instrA2bPbPLimitMove);
			textArea.setText(commA2bPbPLimitMove);
			break;
		case 12:
			label.setText(instrAbPLimitMoveIn2);
			textArea.setText(commAbPLimitMoveIn2);
			break;
		case 13:
			label.setText(instrP2bEvent);
			textArea.setText(commP2bEvent);
			break;
		case 14:
			label.setText(instrA2bPbLimitEvent);
			textArea.setText(commA2bPbLimitEvent);
			break;
		case 15:
			label.setText(instrAbPLimitEventIn2);
			textArea.setText(commAbPLimitEventIn2);
			break;
		case 16:
			label.setText(instrPcMove);
			textArea.setText(commPcMove);
			break;
		case 17:
			label.setText(instrAcPEbPLimitMove);
			textArea.setText(commAcPEbPLimitMove);
			break;
		case 18:
			label.setText(instrAbPLimitMove);
			textArea.setText(commAbPLimitMove);
			break;
		case 19:
			label.setText(instrdP2bAE175bEvent);
			textArea.setText(commdP2bAE175bEvent);
			break;
		case 20:
			label.setText(instrdE2bEvent);
			textArea.setText(commdE2bEvent);
			break;
		case 21:
			label.setText(instrAbPLimitEvent);
			textArea.setText(commAbPLimitEvent);
			break;
		case 22:
			label.setText(instrdP175bEvent1);
			textArea.setText(commdP175bEvent1);
			break;
		case 23:
			label.setText(instrdP175bEvent2);
			textArea.setText(commdP175bEvent2);
			break;
		case 24:
			label.setText(instrdB2t25Event);
			textArea.setText(commdB2t25Event);
			break;
		case 25:
			label.setText(instrA25bPbPLimitEvent);
			textArea.setText(commA25bPbPLimitEvent);
			break;
		}
		repaint();
	}

	// Just good programming style: private data and public accessors
	//  I don't worry about array bounds checking, 'cause Java does it for me
	public Point getPoint(int which) {
		return points[which];
	}

	private void pressedBack() {
		if (wherein >= 0) { // make sure we really can
			points[wherein--] = null;
			if (wherein == 4)
				points[wherein--] = null;
			// print a status message and update the display
			label.setText("Stepped back");
			coordinateArea.repaint();
			coordinateArea.backOne(wherein + 1);
		}

		return;
	}

	private void pressedRestart() {
		// just reset all the data
		wherein = -1;
		for (int i = 0; i < 6; i++)
			points[i] = null;
		//... print a status message, and repaint
		setMessages(0);
		coordinateArea.repaint();
		coordinateArea.restart();
	}

	public int getWherein() {
		return wherein;
	}

	public static void main(String argv[]) {
  	Frame frame = new Frame();
		frame.addWindowListener(new WindowAdapter() {
				 public void windowClosing(WindowEvent event) {
				   System.exit(0);
				 };
			 });

    Rhythm rhythm = new Rhythm();
    rhythm.setSize(400, 350);
    frame.add(rhythm);
    frame.pack();
    rhythm.init();
    frame.setSize(400,450);
    frame.setVisible(true);
	}

}

