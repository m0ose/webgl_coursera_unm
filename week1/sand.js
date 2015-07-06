
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


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
// Create two empty textures

    texture1 = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_SHORT_5_5_5_1, null);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    
    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_SHORT_5_5_5_1, null);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );

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


//______________________________________________    
    gl.viewport(0, 0, 1024, 1024);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT );
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    gl.useProgram(program2);
        
    gl.activeTexture(gl.TEXTURE0);
    
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    
    // send data to GPU for normal render
        
    buffer2 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER,   flatten(vertices), gl.STATIC_DRAW);
    
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
    
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 ); 
    gl.viewport(0, 0, 1024, 1024);
    
    
    render();
    
}


function render() {

   // render to texture

    gl.useProgram(program1);
   
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);
    
    if(flag) {
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, 0);

    }
    else {
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0);
    }
    
    gl.useProgram(program2);
    gl.drawArrays( gl.TRIANGLES, 0, 6 );
    gl.bindFramebuffer( gl.FRAMEBUFFER, null); 

    if(flag) gl.bindTexture(gl.TEXTURE_2D, texture2);
    else gl.bindTexture(gl.TEXTURE_2D, texture1);
            
    gl.clear( gl.COLOR_BUFFER_BIT );      
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    flag = !flag
    
    requestAnimFrame(render);

}
