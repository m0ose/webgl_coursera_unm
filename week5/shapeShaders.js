
var shapeShaders = {

    vertex1 : `
        precision mediump float;
        attribute vec4 vPosition;
        attribute vec4 vColor;
        attribute vec4 vAxis;
        attribute vec4 vCenter;
        attribute float vRotation;
        uniform mat4 projection;
        varying vec4 fColor;

        // quaternion multiplier
        vec4 multq(vec4 a, vec4 b)
        {
           return(vec4(a.x*b.x - dot(a.yzw, b.yzw), a.x*b.yzw+b.x*a.yzw+cross(b.yzw, a.yzw)));
        }

        // inverse quaternion
        vec4 invq(vec4 a)
        {
           return(vec4(a.x, -a.yzw)/dot(a,a));
        }

        void main() {
            float c = cos(radians(vRotation)/2.0);
            float s = sin(radians(vRotation)/2.0);
            vec4 r = vec4(c, s*vAxis);
            //vec4 p = vPosition;
            vec4 p = vec4(0.0, vPosition.xyz);  // input point quaternion
            p = multq(r, multq(p, invq(r))); // rotated point quaternion
            p = vec4( p.yzw, 1.0); // convert back to homogeneous coordinates
            // shift center
            p = p + vCenter;
            gl_Position = projection*p;
            fColor = vColor;
        }
    `,

    fragment1 : `
        precision mediump float;
        varying vec4 fColor;
        
        void main() {
            gl_FragColor = fColor;
        }
    `,

}