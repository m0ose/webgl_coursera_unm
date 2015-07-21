
var paintShaders = {

    vertex1 : `
        attribute vec4 vPosition;
        uniform mat4 projection;

        void main() {
            gl_Position = projection*vPosition;
        }
    `,

    fragment1 : `
        precision mediump float;
        
        void main() {
            gl_FragColor = vec4(0.0,1.0,1.0,1.0);
        }
    `,

}