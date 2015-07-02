var gl;

GLtriangle = {
    vertices: [],
    program: undefined,
    init: function() {
        console.log('init called')
        // Get canvas
        var can = document.getElementById("can")
        gl = WebGLUtils.setupWebGL( can )
        if ( !gl ) { alert( "WebGL isn't available" ) }
        //  Configure WebGL
        //
        gl.viewport( 0, 0, can.width, can.height )
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 )
        gl.enable(gl.DEPTH_TEST)
        // Load shaders
        this.program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( this.program );
        // look up where the vertex data needs to go.
        this.vertices = [
            vec3(  0.0,  0.2, 0 ),
            vec3(  0.2,-0.2, 0 ),
            vec3( -0.2, -0.2, 0 ),
        ]
        this.colors = [
            vec4( 1,0,0,1),
            vec4( 0,1,0,1),
            vec4( 0,0,1,1),
        ]
        // vertices
        var positionLocation = gl.getAttribLocation(this.program, "vPosition");
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        //colors
        var colorLoc = gl.getAttribLocation(this.program, "vColor")
        this.colorBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW)
        gl.enableVertexAttribArray(colorLoc)
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
        //shift and draw 1st triangle
        shiftLoc = gl.getUniformLocation( this.program, "vShift" );
        this.drawSomeTriangles(12)
    },

    drawSomeTriangles: function(n){
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        shiftLoc = gl.getUniformLocation( this.program, "vShift" )
        for(var i=0; i<n; i++) {
            //shift a triangle by a little bit then draw again
            shift = vec3(2*Math.random()-1,2*Math.random()-1,0.0)
            gl.uniform3fv( shiftLoc, flatten(shift) )
            gl.drawArrays( gl.TRIANGLES, 0, this.vertices.length )
        }
    },


}

