/*
Cody Smith 2015

For Ed Angel's webgl class on coursera. 

*/

var gl;

GLtriangle = {
    vertices: [],
    program: undefined,
    theta : 0.0,
    sierpinskiateIterations : 7,
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
            vec3(  0.0,  1.0, 0 ),
            vec3(  1.0,-1.0, 0 ),
            vec3( -1.0, -1.0, 0 ),
        ]
        this.colors = [
            vec4( 1,0,0,1),
            vec4( 0,1,0,1),
            vec4( 0,0,1,1),
        ]
        this.vertices = this.sierpinskiate(this.vertices, this.sierpinskiateIterations)
        this.colors = this.randomlyColorVertices(this.vertices)
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
        // draw some triangles
        
        this.renderLoop()
    },

    //
    // turn a normal triangle into a serpinkskis gasket
    //  
    //
    sierpinskiate: function(vertices, iterations){
        var vertOut = []
        for(var i=2; i < vertices.length; i+=3 ) {
            var v1 = vertices[i]
            var v2 = vertices[i-1]
            var v3 = vertices[i-2]
            //find new points
            var u1 = add( v1, v2 )
            u1 = scale( 0.5, u1 )
            var u2 = add( v2, v3 )
            u2 = scale( 0.5, u2 )
            var u3 = add( v3, v1 )
            u3 = scale( 0.5, u3 )
            //make new triangles
            vertOut = vertOut.concat([v1,u1,u3])
            vertOut = vertOut.concat([u1,v2,u2])
            vertOut = vertOut.concat([u3,u2,v3])
        }
        if(iterations <= 1) {
            return vertOut
        }
        return this.sierpinskiate(vertOut, iterations-1)
    },

    randomlyColorVertices: function(vertices) {
        var colors = []
        for(var i=0; i < vertices.length; i++ ) {
            var v1 = vertices[i]
            colors.push(vec4(Math.sin(v1[0]), Math.cos(v1[1]), Math.random(), 1.0))
        }
        return colors
    },

    render: function(){
        this.theta += 0.01
        thetaLoc = gl.getUniformLocation( this.program, "theta" )
        gl.uniform1f( thetaLoc, Math.PI*Math.sin(this.theta) )
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays( gl.TRIANGLES, 0, this.vertices.length )
    },

    renderLoop: function(){
        this.render()
        requestAnimationFrame(this.renderLoop.bind(this))
    }

}

