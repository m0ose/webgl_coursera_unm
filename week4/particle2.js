/*
Cody Smith 2015

For Ed Angel's webgl class on coursera. 

*/

var gl;

var particleScreen = {

    program1:undefined,
    initialVertices : [], // vec3, where the 3rd part is the width of the particle in pixels
    initialTypeDensity : [], // type: there are 3 types. Density: is basiacaly opacity at the center. 
    frameBuffer: undefined,
    texture: undefined,
    //  
    // Render particles as fuzzy opaque points
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
    //
    //  blur shader
    program2Vertex: `
        attribute vec4 vPosition;
        attribute vec2 vTexCoord;
        varying vec2 fTexCoord;
        uniform sampler2D texture;
        void main() {
            gl_Position = vPosition;
            gl_PointSize = 50.0;
            fTexCoord = vTexCoord;
        }
    `,
    program2Fragment : `
        precision mediump float;
        uniform sampler2D texture;
        varying vec2 fTexCoord;
        uniform vec4 offset;
        uniform vec4 weight;
        void main() {
            vec4 frg = texture2D( texture, vec2(gl_FragCoord)/1024.0 ) * weight[0];
            for (int i=1; i<3; i++) {
                frg += texture2D( texture, ( vec2(gl_FragCoord)+vec2(0.0, offset[i]) )/1024.0 ) * weight[i];
                frg += texture2D( texture, ( vec2(gl_FragCoord)-vec2(0.0, offset[i]) )/1024.0 ) * weight[i];
            }
            gl_FragColor = vec4(frg.xyz,1.0);
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
        //
        // setup texture
        this.texture = gl.createTexture()
        gl.activeTexture( gl.TEXTURE0 )
        this.configTexture( this.texture, can.width, can.height)
        // Allocate a frame buffer object
        this.framebuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        this.framebuffer.width = can.width
        this.framebuffer.height = can.height
        // Attach color buffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0)
        // check for completeness
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
        if(status != gl.FRAMEBUFFER_COMPLETE){
            console.error('Frame Buffer Not Complete' )
            //throw('Frame Buffer Not Complete')
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
        // make initial vertices
        this.vertices = this.initialVertices
        this.typeDensity = this.initialTypeDensity
        // vertices
        var positionLocation = gl.getAttribLocation(this.program1, "vPosition")
        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW)
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(positionLocation)
        // type and density
        var TDLocation = gl.getAttribLocation(this.program1, "vTypeDens")
        this.TDBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.TDBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.typeDensity), gl.STATIC_DRAW)
        gl.vertexAttribPointer(TDLocation, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(TDLocation)
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
        this.buffer21 = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer21)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW)
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( vPosition )
        // tex coords
        this.buffer32 = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer32)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW)
        var vTexCoord = gl.getAttribLocation( this.program2, "vTexCoord") 
        gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( vTexCoord )
        var offset = gl.getUniformLocation( this.program2, "offset" )
        gl.uniform4fv( offset, [0.0, 1.3846153846, 3.2307692308, 0.0] )
        var weight = gl.getUniformLocation( this.program2, "weight" )
        gl.uniform4fv( weight, [0.2270270270, 0.3162162162, 0.0702702703, 0.0] )

        // ?
        gl.uniform1i( gl.getUniformLocation( this.program2, "texture"), 0)
    },

    render: function(){
        //
        // render program1
        //
        // 
        gl.useProgram( this.program1)
        gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0)
        var positionLocation = gl.getAttribLocation(this.program1, "vPosition")
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(positionLocation)
        //
        var TDLocation = gl.getAttribLocation(this.program1, "vTypeDens")
        gl.bindBuffer(gl.ARRAY_BUFFER, this.TDBuffer)
        gl.vertexAttribPointer(TDLocation, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(TDLocation)
        // draw to texture
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT )
        gl.drawArrays( gl.POINTS, 0, this.vertices.length )
        //
        // render program2
        //
        gl.bindFramebuffer( gl.FRAMEBUFFER, null)
        gl.useProgram( this.program2)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        //
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer21)
        gl.vertexAttribPointer( gl.getAttribLocation( this.program2, "vPosition" ), 2, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( gl.getAttribLocation( this.program2, "vPosition" ) )
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer32)
        var vTexCoord = gl.getAttribLocation( this.program2, "vTexCoord") 
        gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( vTexCoord )
        //
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT )
        gl.drawArrays( gl.TRIANGLES, 0, 6)
        
    },

    //  make texture that uses nearest neighbor sampling
    //
    configTexture: function( tex, width, height) {
        gl.activeTexture( gl.TEXTURE0 )
        gl.bindTexture( gl.TEXTURE_2D, tex )
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR )
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR )
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
    },

    makeRandomVertices: function() {
        this.vertices = [];
        this.typeDensity = []
        for(var i=0; i<2001; i++) {
            this.vertices.push(vec3(2*Math.random()-1, 2*Math.random()-1, Math.random()*100))
            this.typeDensity.push(vec2(Math.floor(Math.random()*3),  Math.random() ))
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

    iterations:0,
    iterate: function() {
        this.moveVertices()
        this.updateVertices()
    },

    renderLoop: function() {
        this.iterate()
        this.render()
        if( this.iterations<400){
            requestAnimationFrame( this.renderLoop.bind(this))
        }
        this.iterations++
    }
}

var gpartscreen
window.onload = function(){
    particleScreen.init()
}