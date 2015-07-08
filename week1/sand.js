
var canvas;
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


var program1, program2
var framebuffer 
var texture1, texture2
var WidthHeight = 256

function configTexture( tex) {
    gl.activeTexture( gl.TEXTURE0 )
    gl.bindTexture( gl.TEXTURE_2D, tex )
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, WidthHeight, WidthHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)//gl.UNSIGNED_SHORT_5_5_5_1, null)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT )
}

window.onload = function init() {
    //setup webgl
    canvas = document.getElementById( "gl-canvas" )
    gl = WebGLUtils.setupWebGL( canvas )
    if ( !gl ) { throw( "WebGL isn't available" ) }
    //  
    gl.viewport(0, 0, WidthHeight, WidthHeight)
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
   framebuffer.width = WidthHeight
   framebuffer.height = WidthHeight
// Attach color buffer
   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0)
// check for completeness
   var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
   if(status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete')
    //  Load shaders and initialize attribute buffers
    //
    program2 = initShaders( gl, "vertex-shader2", "fragment-shader2" )
    program3 = initShaders( gl, "vertex-shader3", "fragment-shader3" )
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
    //
    //setup program3, which is just for display
    //   
    gl.useProgram(program3)
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
    gl.uniform1i( gl.getUniformLocation(program3, "texture"), 0)
    //  Where to put new sand grains
    //
    placePos = gl.getUniformLocation(program2, "placementLoc")

    renderLoop();
}

iterations = 0
function render() {
    gl.useProgram(program2)
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer)
    // choose random place to drop sand
    var range = 0.0001
    var xy = [Math.random()*range + 0.5 - range/2, Math.random()*range + 0.5-range/2]
    //console.log(xy)
    /*if(iterations > 20000 ) { 
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
    // draw to screen
    gl.useProgram(program3)
    gl.bindFramebuffer( gl.FRAMEBUFFER, null)
    gl.clear( gl.COLOR_BUFFER_BIT )
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    // loop
    iterations++
}

function renderLoop() {
    for(var i=0; i<101; i++){
        render()
    }
    requestAnimFrame(renderLoop);
}
