/*
Cody Smith 2015

For Ed Angel's webgl class on coursera. 

*/

var gl;

var particleScreen = {

    vertices : [], // vec3, where the 3rd part is the width of the particle in pixels
    typeDensity : [], // type: there are 3 types. Density: is basiacaly opacity at the center. 
    blurLoops: 4,
    // shaders are in another file
    program1Vertex: particleScreenShaders.program1Vertex,
    program1Fragment: particleScreenShaders.program1Fragment,
    program2Vertex: particleScreenShaders.program2Vertex,
    program2Fragment: particleScreenShaders.program2Fragment,
    // this will be used in init phase
    frameBuffer: undefined,
    texture1: undefined,
    texture2: undefined,
    program1:undefined,
    canvas:undefined,
    projMatrix:mat4(),//start with identity

    init: function(canvas) {
        console.log('init called')
        // Get canvas
        var can = canvas || document.getElementById("gl-canvas")
        this.canvas = canvas
        gl = WebGLUtils.setupWebGL( can )
        if ( !gl ) { 
            throw( "WebGL isn't available" ) 
        }
        //  Configure WebGL
        gl.viewport( 0, 0, can.width, can.height )
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA)
        //
        // setup texture
        this.texture1 = gl.createTexture()
        gl.activeTexture( gl.TEXTURE0 )
        this.configTexture( this.texture1, can.width, can.height)
        this.texture2 = gl.createTexture()
        gl.activeTexture( gl.TEXTURE1 )
        this.configTexture( this.texture2, can.width, can.height)
        // Allocate a frame buffer object
        this.framebuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        this.framebuffer.width = can.width
        this.framebuffer.height = can.height
        // Attach color buffer. needed fo fram buffer to be complete
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture1, 0)
        // check for completeness
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
        if(status != gl.FRAMEBUFFER_COMPLETE){
            throw('Frame Buffer Not Complete')
        }
        // setup blure shader
        this.setupBlurProgram(can)
        this.setupParticleProgram(can)
        // draw some triangles
        this.renderLoop()
    },

    setupParticleProgram: function(canvas) {
        // Load shaders
        this.program1 = initShadersFromStrings( gl, this.program1Vertex, this.program1Fragment );
        gl.useProgram( this.program1 );
        // vertices
        var positionLocation = gl.getAttribLocation(this.program1, "vPosition")
        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW)
        // type and density
        var TDLocation = gl.getAttribLocation(this.program1, "vTypeDens")
        this.TDBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.TDBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.typeDensity), gl.STATIC_DRAW)
        // model view projection matrix or MVP
        gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "projection" ), false, flatten(this.projMatrix))
        // add some points
        this.makeRandomVertices()
        this.updateVertices( )
    },

    setupBlurProgram: function(canvas) {
        var texCoord = [
            vec2(0, 0),
            vec2(0, 1),
            vec2(1, 1),
            vec2(1, 1),
            vec2(1, 0),
            vec2(0, 0)
        ];
        var vertices = [
            vec2( -1, -1 ),
            vec2(  -1,  1 ),
            vec2(  1, 1 ),
            vec2( 1, 1 ),
            vec2(  1,  -1 ),
            vec2(  -1, -1 )
        ];
        // Load shaders
        this.program2 = initShadersFromStrings( gl, this.program2Vertex, this.program2Fragment )
        gl.useProgram( this.program2 )
        // vertices
        var vPosition = gl.getAttribLocation( this.program2, "vPosition" )
        this.bufferVpos = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferVpos)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW)
        // tex coords
        this.bufferTexCoord = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferTexCoord)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW)
        var vTexCoord = gl.getAttribLocation( this.program2, "vTexCoord") 
        //
        // some uniforms
        var offset = gl.getUniformLocation( this.program2, "offset" )
        gl.uniform4fv( offset, [0.0, 1.3846153846, 3.2307692308, 0.0] )
        var weight = gl.getUniformLocation( this.program2, "weight" )
        gl.uniform4fv( weight, [0.2270270270, 0.3162162162, 0.0702702703, 0.0] )
        var dims = gl.getUniformLocation( this.program2, "dimensions" )
        gl.uniform2fv(dims, [canvas.width/2, canvas.height/2] )
        this.applyColorMapLoc = gl.getUniformLocation( this.program2, "applyColorMap" )
        gl.uniform1i(this.applyColorMapLoc, 1)
        gl.uniform1f(gl.getUniformLocation( this.program2, "flipY" ), 0);
        // ?
        gl.uniform1i( gl.getUniformLocation( this.program2, "texture"), 0)
    },

    // This code is very easy to repeat so it was put into a function
    activateProgram1: function() {
        gl.useProgram( this.program1)
        var positionLocation = gl.getAttribLocation(this.program1, "vPosition")
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(positionLocation)
        //
        var TDLocation = gl.getAttribLocation(this.program1, "vTypeDens")
        gl.bindBuffer(gl.ARRAY_BUFFER, this.TDBuffer)
        gl.vertexAttribPointer(TDLocation, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(TDLocation)
    },

    activateProgram2: function() {
        gl.useProgram( this.program2)
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferVpos)
        gl.vertexAttribPointer( gl.getAttribLocation( this.program2, "vPosition" ), 2, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( gl.getAttribLocation( this.program2, "vPosition" ) )
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferTexCoord)
        var vTexCoord = gl.getAttribLocation( this.program2, "vTexCoord") 
        gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( vTexCoord )
    },

    render:function() {
        var tex = this.renderParticles()
        this.renderColorMap(tex)
    },

    renderParticles: function(){
        //
        // render program1. put particles up
        //
        gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture1, 0)
        this.activateProgram1()
        // draw to texture
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 )
        gl.clear( gl.COLOR_BUFFER_BIT )
        // set projection
        gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "projection" ), false, flatten(this.projMatrix))
        //
        gl.drawArrays( gl.POINTS, 0, this.vertices.length )
        //
        // render program2. blur
        //
        this.activateProgram2()
        gl.uniform1f(gl.getUniformLocation( this.program2, "flipY" ), 0);
        gl.uniform1i(this.applyColorMapLoc, 1) //tell it to just blur
        var tex1 = this.texture1
        var tex2 = this.texture2
        for(var i=0; i<this.blurLoops; i++) {
            gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex2, 0)
            gl.bindTexture(gl.TEXTURE_2D, tex1)
            //draw
            gl.clear( gl.COLOR_BUFFER_BIT )
            gl.drawArrays( gl.TRIANGLES, 0, 6)
            // swap texture
            var tex3 = tex1
            tex1 = tex2
            tex2 = tex3
        }
        return tex1
    },

    renderColorMap: function(tex1) {
        //
        // render program2. but this time apply colormap
        //
        gl.bindFramebuffer( gl.FRAMEBUFFER, null)
        gl.bindTexture(gl.TEXTURE_2D, tex1)
        //
        this.activateProgram2()
        gl.uniform1f(gl.getUniformLocation( this.program2, "flipY" ), 1);
        gl.uniform1i(this.applyColorMapLoc, 0) //tell it to render with color map
        //
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 )
        gl.clear( gl.COLOR_BUFFER_BIT )
        gl.drawArrays( gl.TRIANGLES, 0, 6)
    },

    //  make texture that uses nearest neighbor sampling
    //
    configTexture: function( tex, width, height) {
        gl.activeTexture( gl.TEXTURE0 )
        gl.bindTexture( gl.TEXTURE_2D, tex )
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR )
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR )
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
    },

    makeRandomVertices: function() {
        for(var i=0; i<5000; i++) {
            var x = 2*Math.random()-1
            var y = 2*Math.random()-1
            var size =  Math.random()*40
            var type  = Math.floor(Math.random()*3)
            var density = Math.random() 
            this.addPoint(x, y, size, density, type)
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

    canvasResized: function() {
        var dims = gl.getUniformLocation( this.program2, "dimensions" )
        gl.uniform2fv(dims, [this.canvas.width/2, this.canvas.height/2] )
    },

    resetPoints: function() {
        this.vertices = []
    },

    addPoint: function(x, y, size, density, type) {
        this.vertices.push(vec3(x,y,size))
        this.typeDensity.push(vec2(type, density))
    },

    sampleHeight : function(x,y,wid, hei){
        if(!wid){wid = 1}
        if(!hei){hei = 1}
        gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture1, 0)
        this.activateProgram1()
        var ab = new ArrayBuffer(wid*hei*4)
        var faFull = new Uint8Array(ab);
        gl.readPixels(x,y,wid,hei, gl.RGBA, gl.UNSIGNED_BYTE, faFull);
        return faFull;
    },

    sampleColorImg: function(x, y, wid, hei) {
        this.render()
        var ab = new ArrayBuffer(wid*hei*4)
        var faFull = new Uint8Array(ab);
        gl.readPixels(x,y,wid,hei, gl.RGBA, gl.UNSIGNED_BYTE, faFull);
        return faFull;
    },

    iterations:0,
    iterate: function() {
        this.moveVertices()
        this.updateVertices()
    },

    renderLoop: function() {
        this.iterate()
        this.render()
        if( this.iterations<4000){
            requestAnimationFrame( this.renderLoop.bind(this))
        }
        this.iterations++
    }
}

window.onload = function(){
    particleScreen.init()
}