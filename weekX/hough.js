function glHough() {

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
        //
        // setup the sobel program
        //
        this.sobelProgram = initShadersFromStrings( gl, sobelShaders.vertex, sobelShaders.fragment )
        gl.useProgram(this.sobelProgram)
        // vertices
        this.setupVertexAttribute( this.vertices, 'vPosition', 2)
        // texture cooridinates
        this.setupVertexAttribute( this.texCoord, 'vTexCoord', 2)
        // Create an empty textures
        this.texture0 = gl.createTexture()
        gl.activeTexture( gl.TEXTURE0 )
        gl.uniform1i( gl.getUniformLocation(this.sobelProgram, "texture"), 0)
        this.configTexture(this.texture0)
        //
        //
        // setup the hough program
        //
        this.houghProgram = initShadersFromStrings( gl, houghShaders.vertex, houghShaders.fragment )
        gl.useProgram(this.houghProgram)
        // vertices
        this.setupVertexAttribute( this.vertices, 'vPosition', 2)
        // texture cooridinates
        this.setupVertexAttribute( this.texCoord, 'vTexCoord', 2)
        // Create an empty textures
        this.texture1 = gl.createTexture()
        gl.activeTexture( gl.TEXTURE1 )
        gl.uniform1i( gl.getUniformLocation(this.houghProgram, "texture"), 0)
        this.configTexture(this.texture1)
        //
        //
        // create Frame Buffer
        //     Allocate a frame buffer object
        this.framebuffer = gl.createFramebuffer()
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
        if(status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete')
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture1, 0)
        //
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    //set it up once is probably fine for this.
    //  I think this could be a very reusable function in the future
    this.setupVertexAttribute =  function( data, name, size) {
        var bufferV = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferV)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW)
        var vPosition = gl.getAttribLocation( this.sobelProgram, name )
        gl.vertexAttribPointer( vPosition, size, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( vPosition )
        return bufferV
    }

    this.changeImage = function(image) {
        this.changeViewPort(image.width, image.height)
        this.image = image
        // send to sobel program
        gl.useProgram(this.sobelProgram)
        gl.activeTexture( gl.TEXTURE1 )
        this.configTexture( this.texture1, image)
        gl.activeTexture( gl.TEXTURE0 )
        this.configTexture( this.texture0, image)
        // send to hough program
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
        //draw sobel to texture1 in frame buffer, and texture0 as input
        gl.useProgram(this.sobelProgram) 
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        gl.bindTexture(gl.TEXTURE_2D, this.texture0)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture1, 0)
        var td = gl.getUniformLocation(this.sobelProgram, 'texDimensions')
        gl.uniform2fv(td, [this.image.width, this.image.height])
        gl.drawArrays( gl.TRIANGLES, 0, 6 )
        // draw hough with texture1 as input
        gl.useProgram(this.houghProgram) 
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.bindTexture(gl.TEXTURE_2D, this.texture1)
        var td = gl.getUniformLocation(this.houghProgram, 'texDimensions')
        gl.uniform2fv(td, [this.image.width, this.image.height])
        gl.drawArrays( gl.TRIANGLES, 0, 6 )
    }

    this.configTexture = function( tex, image) {
        var td = gl.getUniformLocation(this.sobelProgram, 'texDimensions')
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        if(image) {
            gl.uniform2fv(td, [image.width, image.height])
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        }
    }

    this.init()
}


houghShaders = {

    vertex:`
        precision highp float;
        attribute vec4 vPosition;
        attribute vec2 vTexCoord;
        uniform vec2 texDimensions;
        varying vec2 texDims;
        varying vec2 fTexCoord;

        void main() {
            fTexCoord = vTexCoord;
            texDims = texDimensions;
            gl_Position = vPosition;
        }
    `,

    fragment:`
        precision highp float;
        uniform sampler2D texture;
        varying vec2 fTexCoord;
        varying vec2 texDims;

        void main() {
            vec4 tcolor = texture2D( texture, fTexCoord.xy);
            vec2 p0 = fTexCoord.xy;
            float theta = 1.0*p0.y * 3.141593;
            float r = (2.0*p0.x-1.0)*2.0;
            vec2 p1 = vec2(cos(theta)*r, sin(theta)*r);
            vec2 p1Norm = normalize(p1);
            vec2 lineSlope = vec2(-p1.y, p1.x);//perpindicular to vector to p1
            vec2 lineSlopeNorm = normalize(lineSlope);
            float parallelSum = 0.0;
            for (float i = -1.4 ; i <= 1.4 ; i+=0.001) {
                vec2 p3 = p1 + lineSlopeNorm * i;
                vec2 t3 = 2.0*texture2D( texture, p3).xy - 1.0;
                if( p3.x <= 1.0 && p3.y <= 1.0 && p3.x >= 0.0 && p3.y >= 0.0){
                    parallelSum += abs( dot(t3, p1Norm))/8192.0;
                }
            }
            gl_FragColor = vec4(parallelSum*16.0, parallelSum*8.0,parallelSum,1.0);//tcolor;
        }
    `,
}