
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

var pointsArray = [];

var flag = true;

var program1, program2;
var framebuffer; 
var texture1, texture2;
var buffer1, buffer2, buffer3;

function createTexture() {
    var textureTmp = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, textureTmp );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_SHORT_5_5_5_1, null);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT );
    return textureTmp
}

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
// Create two empty textures
    texture1 = createTexture()
    texture2 = createTexture()
// Allocate a frame buffer object

   framebuffer = gl.createFramebuffer();
   gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
   framebuffer.width = 1024;
   framebuffer.height = 1024;


// Attach color buffer

   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0);

// check for completeness

   var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
   if(status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete');

    //
    //  Load shaders and initialize attribute buffers
    //
    program2 = initShaders( gl, "vertex-shader2", "fragment-shader2" );
    program3 = initShaders( gl, "vertex-shader3", "fragment-shader3" );


//______________________________________________    
    gl.viewport(0, 0, 1024, 1024);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT );
        
    gl.useProgram(program2);
    
    // send data to GPU for normal render
        
    buffer2 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program2, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    buffer3 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer3);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);
    
    var vTexCoord = gl.getAttribLocation( program2, "vTexCoord"); 
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
    
    gl.uniform1i( gl.getUniformLocation(program2, "texture"), 0);
    
    //setup program3
    gl.useProgram(program3);
    buffer31 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer31);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program2, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    buffer32 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer32);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);
    
    var vTexCoord = gl.getAttribLocation( program2, "vTexCoord"); 
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
    
    gl.uniform1i( gl.getUniformLocation(program3, "texture"), 0);

    placePos = gl.getUniformLocation(program2, "placementLoc")

    render();
    
}
iterations = 0
function render() {
    gl.useProgram(program2);
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);
    // choose random place to drop sand
    var range = 0.001
    var xy = [Math.random()*range + 0.5 - range/2, Math.random()*range + 0.5-range/2];
    if(iterations > 2 ) { 
        xy = [0.0,0.0]
        console.log('not placing')
    }
    gl.uniform2fv(placePos, flatten(xy))
    // draw to texture 2 using texture 1 as input
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, 0)
    gl.useProgram(program2);
    gl.drawArrays( gl.TRIANGLES, 0, 6 );
    // draw to texture 1 using texture 2 as input
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0)
    gl.useProgram(program2);
    gl.drawArrays( gl.TRIANGLES, 0, 6 );
    // draw to screen
    gl.useProgram(program3);
    gl.bindFramebuffer( gl.FRAMEBUFFER, null); 
    gl.clear( gl.COLOR_BUFFER_BIT );      
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // loop
    iterations++
    requestAnimFrame(render);
}

