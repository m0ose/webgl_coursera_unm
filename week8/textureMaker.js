function typeOf (obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

var textureMaker = {
    textureCount:-1,
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

    configureTexture: function( gl, image) {
        if( image.toLowerCase() == "checkerboard"){
            this.textureCount++
            return this.configureTextureCheckerBoard(gl, this.makeCheckerBoard(64))
        } else{
            this.textureCount++
            return this.configureTextureImgURL(gl, image)
        } 
    },

    //
    // configure texture for squares
    //
    configureTextureCheckerBoard: function(gl, image) {
        console.log('making checker board')
        var texture = gl.createTexture();
        var textureLocation = gl.TEXTURE0 + this.textureCount
        gl.activeTexture( textureLocation);
        gl.bindTexture( gl.TEXTURE_2D, texture );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image)
        gl.generateMipmap( gl.TEXTURE_2D );
        return {texture:texture, activeLocation:textureLocation}
    },

    //
    // if image is url
    //
    configureTextureImgURL: function(gl, url) {
        console.log('configure texture from url')
        // Create a texture.
        var textureLocation = gl.TEXTURE0 + this.textureCount
        gl.activeTexture( textureLocation);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
        var ext = gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") || gl.getExtension("MOZ_EXT_texture_filter_anisotropic")
        if(ext) {
            console.log('using anisotropic filter')
            gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 4)
        }
        // Asynchronously load an image
        var image = new Image();
        image.onload = function() {
            console.log('image loaded', url)
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        image.src = url;
        return {texture:texture, activeLocation:textureLocation}
    },

}