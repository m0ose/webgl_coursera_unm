/*
Assignment 2. for Webgl class on Coursera

Drawing program
Cody Smith
2015/7/23


*/

var glShapes = {

    vertex1prog: shapeShaders.vertex1,
    frag1prog: shapeShaders.fragment1,
    shapes: [],

    init: function() {
        console.log("Init")
        this.canvas = document.getElementById("gl-canvas")
        gl = WebGLUtils.setupWebGL( this.canvas )
        if ( !gl ) { 
            throw( "WebGL isn't available" ) 
        }
        //  Configure WebGL
        gl.viewport( 0, 0, this.canvas.width, this.canvas.height )
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 )
        gl.clear( gl.COLOR_BUFFER_BIT  )
        this.projMatrix = mat4()
        this.projMatrix[0][0] = this.projMatrix[1][1] = this.projMatrix[2][2] = 0.4
        //
        this.setupProgram()
    },

    setupProgram: function() {
        // Load shaders
        this.program1 = initShadersFromStrings( gl, this.vertex1prog, this.frag1prog )
        gl.useProgram( this.program1 )
        // Attributes
        this.bufferVPos = this.setupAttribute(4,"vPosition")
        this.bufferVColor = this.setupAttribute(4,"vColor")
        //this.bufferVAxis = this.setupAttribute(4,"vAxis")
        //this.bufferVAxis = this.setupAttribute(1,"vAngle")
        this.bufferVCenter = this.setupAttribute(4,"vCenter")

        // model view projection matrix or MVP
        gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "projection" ), false, flatten(this.projMatrix))
        //gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "projection" ), false, flatten(this.projMatrix))
    },

    setupAttribute: function(length, location) {
        var loc0 = gl.getAttribLocation( this.program1, location )
        var buff = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, buff)
        gl.vertexAttribPointer(loc0, length, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(loc0)
        return buff
    },


    render: function() {
        var colors = []
        var vertices = []
        var centers = []
        for(var i=0; i < this.shapes.length; i++) {
            var sh = this.shapes[i]
            for(var j=0; j<sh.vertices.length; j++) {
                vertices.push(sh.vertices[j])
                colors.push(sh.colors[j])
                centers.push(sh.centers[j])
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVPos)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVColor)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVCenter)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(centers), gl.STATIC_DRAW)
        gl.drawArrays( gl.LINES, 0, vertices.length )
    }
}

test1 = function(){
    var tri = shapeMaker.parameterizeShape( shapeMaker.sphere, 4,4)
    //console.assert(tri.length == 288, "wrong size")
    glShapes.shapes.push( shapeMaker.makeShape({type:shapeMaker.sphere, center:vec4(1,0,0,0)}) )
    glShapes.shapes.push( shapeMaker.makeShape({type:shapeMaker.cone, color:vec4(1,0,0,1), center:vec4(-1,0,0,0)}) )
    glShapes.shapes.push( shapeMaker.makeShape({type:shapeMaker.cylinder, color:vec4(0,1,0,1), center:vec4(0,1,0,0)}) )

    //glShapes.shapes.push( shapeMaker.makeShape({type:shapeMaker.sphere}) )

    glShapes.render()

}


window.onload = function(){
    glShapes.init()
    test1()
}

