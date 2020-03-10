# Meter as Rhythm

The Java source in this directory was originally an applet that demonstrated
concepts from Chapter 7 of Christopher Hasty's Meter as Rhythm. It has been
slightly updated from the original 1998 version to run as a desktop Java
application from a jar file. The code has otherwise been left in its original
state.

# Creating a JAR file

The file `manifest.txt` contains the JAR manifest. Build a JAR file using the
`jar` tool as follows.

```
$ javac Rhythm.java
$ jar cvfm MeterAsRhythm.jar manifest.txt *.class
```
