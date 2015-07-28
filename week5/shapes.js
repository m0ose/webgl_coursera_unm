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
        gl.enable(gl.DEPTH_TEST)
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
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
        this.bufferVAxis = this.setupAttribute(4,"vAxis")
        this.bufferVRotation = this.setupAttribute(1,"vRotation")
        this.bufferVCenter = this.setupAttribute(4,"vCenter")
        // model view projection matrix or MVP
        gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "projection" ), false, flatten(this.projMatrix))
    },

    setupAttribute: function(length, location) {
        var loc0 = gl.getAttribLocation( this.program1, location )
        var buff = gl.createBuffer()
        if( loc0 >= 0) {
            gl.bindBuffer( gl.ARRAY_BUFFER, buff)
            gl.vertexAttribPointer(loc0, length, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(loc0)
        } else {
            console.warn(location, 'not found in program1')
        }
        return buff
    },


    render: function() {
        var colors = []
        var vertices = []
        var centers = []
        var axis = []
        var angles = []
        for(var i=0; i < this.shapes.length; i++) {
            var sh = this.shapes[i].generateVertices()
            for(var j=0; j<sh.vertices.length; j++) {
                vertices.push(sh.vertices[j])
                colors.push(sh.colors[j])
                centers.push(sh.centers[j])
                axis.push(sh.axis[j])
                angles.push(sh.rotations[j])
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVPos)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVColor)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVCenter)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(centers), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVAxis)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(axis), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVRotation)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(angles), gl.STATIC_DRAW)
        // call render
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        //gl.drawArrays( gl.TRIANGLES, 0, vertices.length )
        gl.drawArrays( gl.LINES, 0, vertices.length )
    }
}

test1 = function(){
    var tri = new shapeMaker()
    var sph = new shapeMaker({
        type:shapeTypes.sphere, 
        center:vec4(1,0,0,0),
        axis:vec4(0,1,0,0),
        stepsX:41,
        //stepsTheta:100,
    })
    var cone = new shapeMaker({type:shapeTypes.cone, 
        color:vec4(1,0,0,1), 
        center:vec4(-1,0,0,0),
        axis:vec4(0,1,-1,0),
        rotation:45,
        stepsX:2,
    })
    var cyl = new shapeMaker({type:shapeTypes.cylinder, 
        color:vec4(0,1,0,1), 
        center:vec4(0,1,0,0),
        axis:vec4(1,0,1,0),
        rotation:-45,
        stepsX:2,
    })
    glShapes.shapes.push(sph)
    glShapes.shapes.push(cone)
    glShapes.shapes.push(cyl)
    //
    glShapes.render()

    setInterval( function(){ 
        for(var i=0; i < glShapes.shapes.length; i++) {
            var sh = glShapes.shapes[i]
            sh.rotation += 1
        }
        glShapes.render()
    }, 60)
}




window.onload = function(){
    glShapes.init()
    test1()
}

