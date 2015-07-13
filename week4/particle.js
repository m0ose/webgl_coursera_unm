/*
Cody Smith 2015

For Ed Angel's webgl class on coursera. 

*/

var gl;

var particleScreen = {

    program:undefined,
    initialVertices : [], // vec3, where the 3rd part is the width of the particle in pixels
    initialTypeDensity : [], // type: there are 3 types. Density: is basiacaly opacity at the center. 
    // vertex shader
    program1Vertex : `
        attribute vec3 vPosition;
        attribute vec2 vTypeDens;
        varying float partType;
        varying float density;
        void main() {
            gl_Position = vec4(vPosition.xy, 0.0, 1.0);
            gl_PointSize = vPosition.z;
            partType = vTypeDens.x;
            density = vTypeDens.y;
        }
    `,
    // fragment shader
    program1Fragment : `
        precision mediump float;
        varying float partType;
        varying float density;
        void main() {
          vec2 pointCenter = gl_PointCoord - 0.5;
          float dist = 0.5-sqrt(dot(pointCenter,pointCenter)); // scale density based on the distance from the center of the point
          if( partType == 0.0) {
            gl_FragColor = vec4(1.0,0.0,0.0,dist*density);
          } else if (partType == 1.0) {
            gl_FragColor = vec4(0.0,1.0,0.0,dist*density);
          } else { //type 2
            gl_FragColor = vec4(0.0,0.0,1.0,dist*density);
          } 
        }
    `,

    init: function() {
        console.log('init called')
        // Get canvas
        var can = document.getElementById("gl-canvas")
        gl = WebGLUtils.setupWebGL( can )
        if ( !gl ) { 
            throw( "WebGL isn't available" ) 
        }
        //  Configure WebGL
        gl.viewport( 0, 0, can.width, can.height )
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 )
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA)
        // Load shaders
        this.program = initShadersFromStrings( gl, this.program1Vertex, this.program1Fragment );
        gl.useProgram( this.program );
        // make initial vertices
        this.vertices = this.initialVertices
        this.typeDensity = this.initialTypeDensity
        // vertices
        var positionLocation = gl.getAttribLocation(this.program, "vPosition")
        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW)
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
        // type and density
        var TDLocation = gl.getAttribLocation(this.program, "vTypeDens")
        this.TDBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.TDBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.typeDensity), gl.STATIC_DRAW)
        gl.enableVertexAttribArray(TDLocation)
        gl.vertexAttribPointer(TDLocation, 2, gl.FLOAT, false, 0, 0)
        // 
        this.makeRandomVertices()
        this.updateVertices( )
        // draw some triangles
        this.renderLoop()
    },

    makeRandomVertices: function() {
        this.vertices = [];
        this.typeDensity = []
        for(var i=0; i<2001; i++) {
            this.vertices.push(vec3(2*Math.random()-1, 2*Math.random()-1, Math.random()*100))
            this.typeDensity.push(vec2(Math.floor(Math.random()*3), Math.random()    ))
        }
    },

    moveVertices: function() {
        var amount = 0.02
        for(var i=0; i < this.vertices.length; i++) {
            var v = this.vertices[i]
            v[0] = v[0] + Math.random()*amount - amount/2
            v[1] = v[1] + Math.random()*amount - amount/2
        }
    },

    updateVertices: function( ) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.TDBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.typeDensity), gl.STATIC_DRAW)
    },

    render: function(){
        // draw
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT )
        gl.drawArrays( gl.POINTS, 0, this.vertices.length )
    },

    renderLoop: function() {
        this.moveVertices()
        this.updateVertices()
        this.render()
        requestAnimationFrame( this.renderLoop.bind(this))
    }
}

var gpartscreen
window.onload = function(){
    particleScreen.init()
}