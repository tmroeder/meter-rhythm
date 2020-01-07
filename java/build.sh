#!/bin/sh

javac Rhythm.java
jar cvfm MeterAsRhythm.jar manifest.txt *.class
