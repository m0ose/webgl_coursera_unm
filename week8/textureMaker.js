var textureMaker = {
    //
    // This code was taken exactly as is from Ed Angel's Week7 example called textureCubev2.html from his website. 
    //   todo: find correct URL
    // 
    makeCheckerBoard: function( texSize) {
        texSize = texSize || 64;
        // Create a checkerboard pattern using floats    
        var image1 = new Array()
            for (var i =0; i<texSize; i++)  image1[i] = new Array();
            for (var i =0; i<texSize; i++) 
                for ( var j = 0; j < texSize; j++) 
                   image1[i][j] = new Float32Array(4);
            for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
                var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
                image1[i][j] = [c, c, c, 1];
            }
        // Convert floats to ubytes for texture
        var image2 = new Uint8Array(4*texSize*texSize);
            for ( var i = 0; i < texSize; i++ ) 
                for ( var j = 0; j < texSize; j++ ) 
                   for(var k =0; k<4; k++) 
                        image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];
        image2.width = texSize
        image2.height = texSize
        return image2
    },

    configureTexture: function(gl, image) {
        var texture = gl.createTexture();
        gl.activeTexture( gl.TEXTURE0 );
        gl.bindTexture( gl.TEXTURE_2D, texture );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, 
            gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap( gl.TEXTURE_2D );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
            gl.NEAREST_MIPMAP_LINEAR );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
        return texture
    },

}