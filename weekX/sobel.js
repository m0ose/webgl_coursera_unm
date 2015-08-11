
function glSobel() {

    this.texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 1),
        vec2(1, 0),
        vec2(0, 0)
    ];

    this.vertices = [
        vec2( -1, -1 ),
        vec2(  -1,  1 ),
        vec2(  1, 1 ),
        vec2( 1, 1 ),
        vec2(  1,  -1 ),
        vec2(  -1, -1 )
    ];

    this.init = function() {
        //setup webgl
        this.canvas = document.getElementById( "gl-canvas" )
        gl = WebGLUtils.setupWebGL( this.canvas )
        if ( !gl ) { throw( "WebGL isn't available" ) }
        // setup view
        this.changeViewPort(this.canvas.width, this.canvas.height)
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        // Create an empty textures
        this.texture1 = gl.createTexture()
        gl.activeTexture( gl.TEXTURE0 )
        //
        this.programSobel = initShadersFromStrings( gl, sobelShaders.vertex, sobelShaders.fragment )
        // vertices
        gl.useProgram(this.programSobel)
        this.bufferV = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferV)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW)
        var vPosition = gl.getAttribLocation( this.programSobel, "vPosition" )
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( vPosition )
        // texture cooridinates
        this.bufferTC = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferTC)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texCoord), gl.STATIC_DRAW)
        var vTexCoord = gl.getAttribLocation( this.programSobel, "vTexCoord") 
        gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( vTexCoord )
        //
        gl.uniform1i( gl.getUniformLocation(this.programSobel, "texture"), 0)
    }

    this.changeImage = function(image) {
        this.changeViewPort(image.width, image.height)
        this.configTexture( this.texture1, image)
        this.image = image
    }

    this.changeViewPort = function(wid, hei){
        if( wid !== this.width || hei !== this.height) {
            this.width = wid
            this.height = hei
            this.canvas.width = wid
            this.canvas.height = hei
            gl.viewport(0, 0, wid, hei)
            console.log("viewport dimensions changed to ", wid, hei)
        }
    }

    this.render = function() {
        gl.bindFramebuffer( gl.FRAMEBUFFER, null)
        gl.clear( gl.COLOR_BUFFER_BIT )
        gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    this.configTexture = function( tex, image) {
        var td = gl.getUniformLocation(this.programSobel, 'texDimensions')
        gl.uniform2fv(td, [image.width, image.height])
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    this.init()
}



