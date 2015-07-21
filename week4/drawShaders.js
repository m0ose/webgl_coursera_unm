
var paintShaders = {

    vertex1 : `
        attribute vec4 vPosition;
        attribute vec4 vColor;
        uniform mat4 projection;
        varying vec4 fColor;

        void main() {
            gl_Position = projection*vPosition;
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