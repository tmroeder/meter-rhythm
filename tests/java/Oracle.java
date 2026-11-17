import java.awt.*;
import java.lang.reflect.*;
import java.io.*;

// Drive the 1998 applet without showing it. Reads one action per line from
// stdin ("m x", "c x", "b", "r") and prints the state after each as JSON.
public class Oracle {
    static int lastMsg = 0;

    static class OracleRhythm extends Rhythm {
        public void setMessages(int x) { lastMsg = x; super.setMessages(x); }
    }

    static Object get(Object o, String name) throws Exception {
        Class<?> c = o.getClass();
        while (c != null) {
            try { Field f = c.getDeclaredField(name); f.setAccessible(true); return f.get(o); }
            catch (NoSuchFieldException e) { c = c.getSuperclass(); }
        }
        throw new NoSuchFieldException(name);
    }

    static String pt(Object p) {
        if (p == null) return "null";
        Point q = (Point) p;
        return "{\"x\":" + q.x + ",\"y\":" + q.y + "}";
    }

    static String pts(Object arr) {
        Point[] a = (Point[]) arr;
        StringBuilder b = new StringBuilder("[");
        for (int i = 0; i < a.length; i++) { if (i > 0) b.append(","); b.append(pt(a[i])); }
        return b.append("]").toString();
    }

    public static void main(String[] args) throws Exception {
        OracleRhythm r = new OracleRhythm();
        r.init();
        CoordinateArea ca = (CoordinateArea) get(r, "coordinateArea");
        Method back = Rhythm.class.getDeclaredMethod("pressedBack"); back.setAccessible(true);
        Method restart = Rhythm.class.getDeclaredMethod("pressedRestart"); restart.setAccessible(true);
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] t = line.split("\\s+");
            String err = null;
            try {
                switch (t[0]) {
                    case "m": ca.handleMouseMove(Integer.parseInt(t[1]), 50); break;
                    case "c": ca.handleMouseDown(Integer.parseInt(t[1]), 50); break;
                    case "b": back.invoke(r); break;
                    case "r": restart.invoke(r); break;
                }
            } catch (Throwable e) {
                Throwable c = e instanceof InvocationTargetException ? e.getCause() : e;
                err = c.getClass().getSimpleName();
            }
            System.out.println("{\"action\":\"" + line + "\""
                + ",\"wherein\":" + get(r, "wherein")
                + ",\"points\":" + pts(get(r, "points"))
                + ",\"line1\":" + pts(get(ca, "line1"))
                + ",\"line2\":" + pts(get(ca, "line2"))
                + ",\"line3\":" + pts(get(ca, "line3"))
                + ",\"arcing1\":" + get(ca, "arcing1") + ",\"arcing2\":" + get(ca, "arcing2")
                + ",\"in1\":" + get(ca, "in1") + ",\"in2\":" + get(ca, "in2")
                + ",\"done\":" + get(ca, "done")
                + ",\"clickToChange\":" + get(ca, "clickToChange")
                + ",\"inAlternativeView\":" + get(ca, "inAlternativeView")
                + ",\"addParenthShort\":" + get(ca, "addParenthShort")
                + ",\"redrawDashedArc1\":" + get(ca, "redrawDashedArc1")
                + ",\"drawTracksFlag\":" + get(ca, "drawTracks")
                + ",\"X1\":" + get(ca, "X1")
                + ",\"moveArcPos\":" + pt(get(ca, "moveArcPos"))
                + ",\"msgIndex\":" + lastMsg
                + ",\"error\":" + (err == null ? "null" : "\"" + err + "\"")
                + "}");
        }
        System.exit(0);
    }
}
