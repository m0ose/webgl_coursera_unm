// The shaders
//   program1 draws the particles
//   program2 blurs and finally applies the colormap 
//
//

var particleScreenShaders = {

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
    //
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
        uniform vec2 dimensions;
        uniform int applyColorMap;

        float fade(float low, float high, float value){
            float mid = (low+high)*0.5;
            float range = (high-low)*0.5;
            float x = 1.0 - clamp(abs(mid-value)/range, 0.0, 1.0);
            return smoothstep(0.0, 1.0, x);
        }

        vec4 doColorMap( vec4 intensity) {
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            vec3 red = vec3(1.0, 0.0, 0.0);
            vec3 white = vec3(0.7, 0.7, 0.7);
            vec3 color = (
                // color type 0
                intensity.r*fade(0.0, 0.25, intensity.r)*blue +
                intensity.r*fade(0.0, 0.5, intensity.r)*cyan +
                intensity.r*fade(0.25, 0.75, intensity.r)*green +
                intensity.r*fade(0.5, 1.0, intensity.r)*yellow +
                intensity.r*smoothstep(0.75, 1.0, intensity.r)*red + 
                                //color type 2
                smoothstep(0.0, 0.5, intensity.g)*white + 
                                //color type 1
                smoothstep(0.0, 0.7, intensity.b)*cyan + 
                smoothstep(0.25, 1.0, min(0.9,intensity.b))*green 
            );
            float opacity = intensity.r + min(0.7, intensity.g) + intensity.b;
            vec4 colorOut = vec4(color, sqrt(opacity) );
            return colorOut;
        }

        void main() {
            //blur
            vec4 frg = texture2D( texture, vec2(fTexCoord) ) * weight[0];
            for (int i=1; i<3; i++) {
                vec2 off2 = vec2( 0.0, offset[i]/dimensions[1]);
                frg += texture2D( texture, vec2(fTexCoord) + off2) * weight[i]/2.0;
                frg += texture2D( texture, vec2(fTexCoord) - off2) * weight[i]/2.0;
            }
            for (int i=1; i<3; i++) {
                vec2 off2 = vec2( offset[i]/dimensions[0] , 0.0);
                frg += texture2D( texture, vec2(fTexCoord) + off2) * weight[i]/2.0;
                frg += texture2D( texture, vec2(fTexCoord) - off2) * weight[i]/2.0;
            }
            vec4 col = vec4(frg.xyz,1.0);
            if( applyColorMap == 0) {
                col = doColorMap(frg);
            }
            gl_FragColor = col;
        }
    `,
}