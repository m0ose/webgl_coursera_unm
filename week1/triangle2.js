/*
Cody Smith 2015

For Ed Angel's webgl class on coursera. 

*/

var gl;

GLtriangle = {
    
    theta : 0.0, // initial angle for spin
    sierpinskiateIterations : 4, // the triangle count is 3^n and can get big fast
    fillMesh:false, // fully tesselate. If false it will do a sierpinski's gasket. If true it will fill with tiny triangles. 
    spinCenter : [0,-0.2, 0], // shift the final display by this much.
    initialVertices : [
            vec3(  0.0,  1.0, 0 ),
            vec3( -Math.cos(Math.PI/6),-Math.sin(Math.PI/6), 0 ),
            vec3( Math.cos(Math.PI/6),-Math.sin(Math.PI/6), 0 ),
        ],
    initialColors : [
            vec3(  1.3,  0.0, 0.0 ),
            vec3(  0.0, 0.0, 1.3 ),
            vec3( 0.0, 1.3, 0.0 ),
        ],
    idleUpdate: new Date().getTime(),//this is used for the idle animation

    init: function() {
        console.log('init called')
        // Get canvas
        var can = document.getElementById("can")
        gl = WebGLUtils.setupWebGL( can )
        if ( !gl ) { alert( "WebGL isn't available" ) }
        //  Configure WebGL
        //gl.viewport( 0, 0, can.width, can.height )
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 )
        gl.enable(gl.DEPTH_TEST)
        // Load shaders
        this.program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( this.program );
        // make initial vertices
        this.vertices = this.initialVertices
        this.colors = this.initialColors
        // vertices
        var positionLocation = gl.getAttribLocation(this.program, "vPosition")
        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW)
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
        //colors
        var colorLoc = gl.getAttribLocation(this.program, "vColor")
        this.colorBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW)
        gl.enableVertexAttribArray(colorLoc)
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0)
        // tesselate the triangle. Also tesselate the colors just for fun.
        this.updateVertices( this.sierpinskiateIterations)
        // draw some triangles
        this.renderLoop()
    },

    //tesselate the triangle. Also tesselate the colors just for fun.
    //
    updateVertices: function( iterations) {
        if( iterations === undefined) { iterations = this.sierpinskiateIterations }
        this.sierpinskiateIterations = Number(iterations) //|| this.sierpinskiateIterations
        this.vertices = this.sierpinskiate(this.initialVertices, this.sierpinskiateIterations, this.fillMesh)
        this.colors = this.sierpinskiate(this.initialColors, this.sierpinskiateIterations, this.fillMesh)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW)
        console.log("# of vertices", this.vertices.length)
    },
    //
    // turn a normal triangle into a serpinkskis gasket
    //   iterations is the number of recursive steps. 
    //   if fillMesh is true it will fill the gaps in the gasket. 
    sierpinskiate: function(vertices, iterations, fillMesh){
        //console.log(iterations)
        if(iterations <= 0) {
            return vertices
        }
        var tmpVerts = []
        var vertOut = []
        for(var i=2; i < vertices.length; i+=3 ) {
            var v1 = vertices[i]
            var v2 = vertices[i-1]
            var v3 = vertices[i-2]
            //find midpoint points
            var u1 = mix( v1, v2, 0.5 )
            var u2 = mix( v2, v3, 0.5 )
            var u3 = mix( v3, v1, 0.5 )
            //make new triangles
            tmpVerts.push([v1,u1,u3])
            tmpVerts.push([u1,v2,u2])
            tmpVerts.push([u3,u2,v3])
            if(fillMesh) {
                tmpVerts.push([u1,u2,u3])
            }
        }
        for(var i=0; i < tmpVerts.length; i++) {
            vertOut.push( tmpVerts[i][0])
            vertOut.push( tmpVerts[i][1])
            vertOut.push( tmpVerts[i][2])
        }
        return this.sierpinskiate(vertOut, iterations-1, fillMesh)
    },

    updateTheta: function( theta) {
        this.theta = theta
        this.idleUpdate = new Date().getTime()
    },

    render: function(){
        var wobblyTheta = this.theta
        var wobblyCenter = [0,0,0]
        // animate theta if idle
        if( new Date().getTime() - this.idleUpdate > 10000){
            this.theta = (this.theta + 0.05) % (64*Math.PI) // prevent overflow
            var wobblyTheta = (Math.PI/2)*Math.sin(this.theta)
            wobblyCenter = [Math.sin(this.theta/3)/2,Math.pow(Math.sin(this.theta*3)/3,2),0]
        }
        // send theta to vertexshader
        thetaLoc = gl.getUniformLocation( this.program, "theta" )
        gl.uniform1f( thetaLoc, wobblyTheta )
        // spin center
        var spinLoc = gl.getUniformLocation( this.program, "spinCenter" )
        gl.uniform3fv( spinLoc, flatten( add(wobblyCenter, this.spinCenter)) )
        // draw
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT )
        gl.drawArrays( gl.TRIANGLES, 0, this.vertices.length )
    },

    // keep calling render 30 fps or so.
    renderLoop: function(){
        this.render()
        requestAnimationFrame(this.renderLoop.bind(this))
    }

}

