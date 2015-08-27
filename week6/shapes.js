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
    DRAW_SURFACES:true,
    //DRAW_WIREFRAME:true,
    shapeCount:0,
    lightDir:[12,-12,6,1],
    renderCount: 0,
    _animating:false,

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
        gl.lineWidth(1)
        this.projMatrix = mat4()
        // zoom out
        this.projMatrix[0][0] = this.projMatrix[1][1] = this.projMatrix[2][2] = 0.1
        //
        this.makeLights()
        //
        this.setupProgram()
    },

    setupProgram: function() {
        // Load shaders
        this.program1 = initShadersFromStrings( gl, this.vertex1prog, this.frag1prog )
        gl.useProgram( this.program1 )
        // Attributes
        //this.bufferVPos = this.setupAttribute(4,"vPosition")
        //this.bufferVNormals = this.setupAttribute(4,"vNormal")
        //this.bufferVColor = this.setupAttribute(4,"vColor")
        // model view projection matrix or MVP
        gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "projection" ), false, flatten(this.projMatrix))
        this.locaAxis = gl.getUniformLocation( this.program1, "vAxis")
        gl.uniform4fv( this.locaAxis, vec4(1,0,0,0))
        this.locaRotation = gl.getUniformLocation( this.program1, "vRotation")
        gl.uniform1f( this.locaRotation, 0.0)
        this.locaCenter = gl.getUniformLocation( this.program1, "vCenter")
        gl.uniform4fv( this.locaCenter, vec4(0,0,0,1))
        this.locaWireFrame = gl.getUniformLocation( this.program1, "wireFrame")
        gl.uniform1f( this.locaWireFrame, 0) //not wireframe
        this.locaScale = gl.getUniformLocation( this.program1, "scale")
        // add some lights
        gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "vLightPosition" ), false, lighting.getFlatArray())
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
        return {buffer:buff, location:loc0}
    },

    bindAndEnableAttribute: function(attr, length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer)
        gl.vertexAttribPointer(attr.location, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(attr.location)
    },

    startAnimation : function() {
        this._animating = true
        this.render()
    },

    renderOnce: function() {
        requestAnimationFrame(this.__render.bind(this))
    },

    render: function() {
        // this keeps events from piling up as much
        if( !this._animating){
            this.renderOnce()
        } else {
            this.moveLights()
            this.__render()
            requestAnimationFrame(this.render.bind(this))
        }
    },

    __render: function() {
        this.renderCount++
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        for(var i=0; i < this.shapes.length; i++) {
            var sh = this.shapes[i]
            // cache the buffers. hopefully this will speed things up
            if(!sh._cachedBuffers) {
                sh._cachedBuffers = true
                sh.bufferVPos = this.setupAttribute(4,"vPosition")
                sh.bufferVNormals = this.setupAttribute(4,"vNormal")
                sh.bufferVColor = this.setupAttribute(4,"vColor")
                var verts = sh.generateVerticesFlat()
                sh.vertLength = verts.vertices.length/4 
                gl.bindBuffer(gl.ARRAY_BUFFER, sh.bufferVPos.buffer)
                gl.bufferData( gl.ARRAY_BUFFER, verts.vertices, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ARRAY_BUFFER, sh.bufferVNormals.buffer)
                gl.bufferData( gl.ARRAY_BUFFER, verts.normals, gl.STATIC_DRAW)
                gl.bindBuffer(gl.ARRAY_BUFFER, sh.bufferVColor.buffer)
                gl.bufferData( gl.ARRAY_BUFFER, verts.colors, gl.STATIC_DRAW)
            } else {
                this.bindAndEnableAttribute(sh.bufferVPos)
                this.bindAndEnableAttribute(sh.bufferVNormals)
                this.bindAndEnableAttribute(sh.bufferVColor)
            }
            
            gl.uniform4fv( this.locaAxis, sh.axis)
            gl.uniform1f( this.locaRotation, sh.rotation)
            gl.uniform4fv( this.locaCenter, sh.center)
            gl.uniform4fv( this.locaScale, sh.scale)
            gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "vLightPosition" ), false, lighting.getFlatArray())
            // draw surface
            if( this.DRAW_SURFACES) {
                gl.uniform1f( this.locaWireFrame, 0)
                gl.drawArrays( gl.TRIANGLES, 0, sh.vertLength )
            }
            // draw wireframe
            if( (sh.wireFrame ) == true) {
                gl.uniform1f( this.locaWireFrame, 1)
                gl.drawArrays( gl.LINES, 0, sh.vertLength )
            }
        }
    },

    addShape : function( type, options) {
        var result 
        this.shapeCount += 1; //this is for stupid polymer. Im done trying to learn this stupid framework. waste of time.
        var sc = this.shapeCount
        for(var i=0; i<this.shapes.length; i++){
            this.shapes[i].selected = false
        }
        var params = {}
        if( type == 'sphere') {
            params = {
                type:shapeTypes.sphere, 
                stepsX:36,
                stepsTheta:24,
                name:'sphere_' + sc
            }
        } else if( type == 'cylinder') {
            params = {type:shapeTypes.cylinder, 
                color:vec4(0.1,0.1,0.1,1), 
                stepsX:2,
                name:'cylinder_' + sc,
            }
        } else if( type == 'cone') {
            params = {type:shapeTypes.cone, 
                color:vec4(1,0,0,1), 
                stepsX:5,
                name:'cone_' + sc,
            }
        } else if( type == 'leaf') {
            params = {
                type:shapeTypes.cannabis, 
                color:vec4(0,1,0,1), 
                stepsX:5,
                axis:vec4(0,1,1,0),
                rotation:90,
                stepsTheta:200,
                name:'leaf_' + sc,
            }
        } else if( type == 'shell') {
            params = {
                type:shapeTypes.shell, 
                stepsX:24,
                stepsTheta:60,
                name:'shell_' + sc,
            }
        } else if( type == 'light') {
            params = {
                type:shapeTypes.sphere, 
                isLight:true,
                name:'Light_' + sc,
                scale:vec4(0.4,0.4,0.4,0),
            }
        }else {
            throw('shape name not recognised')
        }
        for(var x in options) {
            params[x] = options[x]
        }
        var result = new shapeMaker(params)
        this.shapes.push(result)
        this.render()
        //
        return result
    },

    makeLights : function() {
        lighting.makeLight({ center:[10,0,-6,1], color:[1,0,0,1] })
        lighting.makeLight({ center:[0,-10,-6,1], color:[0,1,0,1] })
        lighting.makeLight({ center:[-10,0,-6,1], color:[0,0,1,1] })
        lighting.makeLight({ center:[0,10,-6,1], color:[1,1,1,0.6] })
    },

    moveLights :  function() {
        var k = 1/400
        var r = 10
        for(var li of lighting.lights) {
            // there was a problem when animating
            for(var lc=0; lc<li.center.length; lc++){
                li.center[lc] = Number(li.center[lc])
            }
            //move lights in a figure 8
            li.center[0] += -k*r*Math.sin(this.renderCount*k)
            li.center[1] += 2*k*r*Math.cos(2*this.renderCount*k)
        }
    },
}







