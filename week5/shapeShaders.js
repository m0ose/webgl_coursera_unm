
var shapeShaders = {

    vertex1 : `
        precision mediump float;
        attribute vec4 vPosition;
        attribute vec4 vColor;
        attribute vec4 vAxis;
        attribute vec4 vCenter;
        attribute float vAngle;
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
            vec4 p = vPosition;
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