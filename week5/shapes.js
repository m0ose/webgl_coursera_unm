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
        gl.lineWidth(2)
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
        this.bufferVNormals = this.setupAttribute(4,"vNormal")
        this.bufferVColor = this.setupAttribute(4,"vColor")
        // model view projection matrix or MVP
        gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "projection" ), false, flatten(this.projMatrix))
        this.locaAxis = gl.getUniformLocation( this.program1, "vAxis")
        gl.uniform4fv( this.locaAxis, vec4(1,0,0,0))
        this.locaRotation = gl.getUniformLocation( this.program1, "vRotation")
        gl.uniform1f( this.locaRotation, 0.0)
        this.locaCenter = gl.getUniformLocation( this.program1, "vCenter")
        gl.uniform4fv( this.locaCenter, vec4(0,0,0,1))

        // add some lights
        var lightloc = 
        gl.uniform4fv(gl.getUniformLocation( this.program1, "light1" ), flatten([10,-10,0,1]))
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
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        for(var i=0; i < this.shapes.length; i++) {
            var sh = this.shapes[i]
            var verts = sh.generateVerticesFlat()
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVPos)
            gl.bufferData( gl.ARRAY_BUFFER, verts.vertices, gl.STATIC_DRAW)
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVNormals)
            gl.bufferData( gl.ARRAY_BUFFER, verts.normals, gl.STATIC_DRAW)
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVColor)
            gl.bufferData( gl.ARRAY_BUFFER, verts.colors, gl.STATIC_DRAW)
            gl.uniform4fv( this.locaAxis, sh.axis)
            gl.uniform1f( this.locaRotation, sh.rotation)
            gl.uniform4fv( this.locaCenter, sh.center)
            // call render
            gl.drawArrays( gl.TRIANGLES, 0, verts.vertices.length/4 )
            //gl.drawArrays( gl.LINES, 0, verts.vertices.length )
        }
    }
}

test1 = function(){
    var tri = new shapeMaker()
    var sph = new shapeMaker({
        type:shapeTypes.sphere, 
        center:vec4(1,-1,0,0),
        axis:vec4(0,-1,0,0),
        stepsX:24,
        stepsTheta:24,
    })
    var cone = new shapeMaker({type:shapeTypes.cone, 
        color:vec4(1,0,0,1), 
        center:vec4(-1,-1,0,0),
        axis:vec4(3,7,5,0),
        rotation:45,
        stepsX:5,
    })
    var cyl = new shapeMaker({type:shapeTypes.cylinder, 
        color:vec4(0,1,0,1), 
        center:vec4(-1,1,0,0),
        axis:vec4(1,2,1,0),
        rotation:-45,
        stepsX:2,
    })
    var shell = new shapeMaker({
        type:shapeTypes.shell, 
        center:vec4(1,1,0,0),
        color:vec4(1,1,0,1), 
        axis:vec4(1,1,0,0),
        stepsX:24,
        stepsTheta:48,
    })
    glShapes.shapes.push(sph)
    glShapes.shapes.push(cone)
    glShapes.shapes.push(cyl)
    glShapes.shapes.push(shell)
    //
    glShapes.render()

    setInterval( function(){ 
        for(var i=0; i < glShapes.shapes.length; i++) {
            var sh = glShapes.shapes[i]
            sh.rotation += 5
        }
        glShapes.render()
    }, 60)
}




window.onload = function(){
    glShapes.init()
    test1()
}

