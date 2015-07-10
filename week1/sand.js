
var gl;

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

var projectionMatrix = [
    vec4(3,0,0,0),
    vec4(0,3,0,0),
    vec4(0,0,1,0),
    vec4(0,0,0,1)
    ]

var program2, program_display
var framebuffer // ??? not sure what this is ???
var texture1, texture2 // the simulation state is saved on these textures, which are flip flopped. Meaning render to 1 using 2 as input then render to 2 with 1 as input....
var widthHeight = 1024 // width and height of the texture for rendering to texture.
var iterattionCount = 0 // number of 
var speedMult = 1 // this is how many times to loop through iterate function before drawing to screen. 


//  make texture that uses nearest neighbor sampling
//
function configTexture( tex) {
    gl.activeTexture( gl.TEXTURE0 )
    gl.bindTexture( gl.TEXTURE_2D, tex )
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, widthHeight, widthHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)//gl.UNSIGNED_SHORT_5_5_5_1, null)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT )
}

function init() {
    //setup webgl
    var canvas = document.getElementById( "gl-canvas" )
    gl = WebGLUtils.setupWebGL( canvas )
    if ( !gl ) { throw( "WebGL isn't available" ) }
    // setup view
    gl.viewport(0, 0, widthHeight, widthHeight)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT )
// Create two empty textures
    texture1 = gl.createTexture()
    gl.activeTexture( gl.TEXTURE0 )
    configTexture( texture1)
    texture2 = gl.createTexture()
    gl.activeTexture( gl.TEXTURE1 )
    configTexture( texture2)
// Allocate a frame buffer object
   framebuffer = gl.createFramebuffer()
   gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
   framebuffer.width = widthHeight
   framebuffer.height = widthHeight
// Attach color buffer
   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0)
// check for completeness
   var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
   if(status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete')
    //  Load shaders and initialize attribute buffers
    program2 = initShaders( gl, "vertex-shader2", "fragment-shader2" )
    program_display = initShaders( gl, "vertex-shader-display", "fragment-shader-display" )
    // setup program 2
    //    This is used for the calcualtions and is never really shown
    gl.useProgram(program2)
    var buffer2 = gl.createBuffer()
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer2)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW)
    //   program 2 triangles
    var vPosition = gl.getAttribLocation( program2, "vPosition" )
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 )
    gl.enableVertexAttribArray( vPosition )
    //  program2 texture
    var buffer3 = gl.createBuffer()
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer3)
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW)
    var vTexCoord = gl.getAttribLocation( program2, "vTexCoord") 
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 )
    gl.enableVertexAttribArray( vTexCoord )
    //   send texture
    gl.uniform1i( gl.getUniformLocation(program2, "texture"), 0)
    // width and height of texture
    var textureWidthPlace = gl.getUniformLocation(program2, "texWidth")
    gl.uniform1f(textureWidthPlace, widthHeight)
    //
    //setup program_display, which is just for display
    //   
    gl.useProgram(program_display)
    var buffer31 = gl.createBuffer()
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer31)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW)
    //  prog 3 triangles
    var vPosition = gl.getAttribLocation( program2, "vPosition" )
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 )
    gl.enableVertexAttribArray( vPosition )
    //  prog 3 textures
    var buffer32 = gl.createBuffer()
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer32)
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW)
    var vTexCoord = gl.getAttribLocation( program2, "vTexCoord") 
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 )
    gl.enableVertexAttribArray( vTexCoord )
    gl.uniform1i( gl.getUniformLocation(program_display, "texture"), 0)
    //  Where to put new sand grains
    //
    placePos = gl.getUniformLocation(program2, "placementLoc")
    //projection matrix
    projectionPlace = gl.getUniformLocation(program_display, "vProjection")
    // shift center of viewport to to center of canvas
    projectionMatrix[3][0] = projectionMatrix[3][1] = (canvas.width - widthHeight)/(widthHeight)
    // start render loop
    renderLoop();
}

function iterate() {
    // loop
    iterattionCount++
    gl.useProgram(program2)
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer)
    // choose random place to drop sand
    var range = 0.0001
    var xy = [Math.random()*range + 0.5 - range/2, Math.random()*range + 0.5-range/2]
    /*if(iterattionCount > 20000 ) { 
        xy = [0.0,0.0]
        console.log('not placing')
    }
    */
    gl.uniform2fv(placePos, flatten(xy))
    // draw to texture 2 using texture 1 as input
    gl.bindTexture(gl.TEXTURE_2D, texture1)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, 0)
    gl.drawArrays( gl.TRIANGLES, 0, 6 )
    // draw to texture 1 using texture 2 as input
    gl.bindTexture(gl.TEXTURE_2D, texture2)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0)
    gl.drawArrays( gl.TRIANGLES, 0, 6 )
}
// draw to screen
function render() {
    gl.useProgram(program_display)
    gl.uniformMatrix4fv( projectionPlace, false, flatten(projectionMatrix) )
    gl.bindFramebuffer( gl.FRAMEBUFFER, null)
    gl.clear( gl.COLOR_BUFFER_BIT )
    gl.drawArrays(gl.TRIANGLES, 0, 6)
}

renderCount = 0
function renderLoop() {
    for(var i=0; i<speedMult; i++){
        iterate()
    }
    render()

    if( renderCount % 100 == 0){
        console.log('grains dropped', iterattionCount, '  speed multiplier:', speedMult, ' zoom:', projectionMatrix[0][0])
    }
    renderCount ++
    requestAnimFrame(renderLoop);
}

//
// call init. starts render
window.onload = init

