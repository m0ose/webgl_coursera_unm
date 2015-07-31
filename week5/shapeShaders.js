
var shapeShaders = {

    vertex1 : `
        precision mediump float;
        attribute vec4 vPosition;
        attribute vec4 vColor;
        attribute vec4 vNormal;
        uniform vec4 vAxis;
        uniform vec4 vCenter;
        uniform float vRotation;
        uniform mat4 projection;
        uniform vec4 light1;
        varying vec4 fColor;
        varying vec4 fLight1;
        varying vec4 fNormal;
        varying vec4 fPosition;

        // quaternion multiplier
        vec4 multq(vec4 a, vec4 b)
        {
           return(vec4(a.x*b.x - dot(a.yzw, b.yzw), a.x*b.yzw+b.x*a.yzw+cross(b.yzw, a.yzw)));
        }

        // inverse quaternion
        vec4 invq(vec4 a)
        {
           return(vec4(a.x, -a.yzw)/dot(a,a));
        }

        void main() {
            float c = cos(radians(vRotation)/2.0);
            float s = sin(radians(vRotation)/2.0);
            vec4 axis = normalize(vAxis);
            vec4 r = vec4(c, s*axis);
            //vec4 p = vPosition;
            vec4 p = vec4(0.0, vPosition.xyz);  // input point quaternion
            p = multq(r, multq(p, invq(r))); // rotated point quaternion
            p = vec4( p.yzw, 1.0); // convert back to homogeneous coordinates
            // shift center
            p = p + vCenter;
            gl_Position = projection*p;
            fPosition = vec4(gl_Position);
            //color
            fColor = vColor;
            // lights
            fLight1 = projection * light1;
            // normal, must also be rotated
            vec3 norm = normalize(vNormal.xyz);
            vec4 pn = vec4(0.0, norm);  // input point quaternion
            pn = multq(r, multq(pn, invq(r))); // rotated point quaternion
            pn = vec4( pn.yzw, 1.0); // convert back to homogeneous coordinates
            fNormal = projection*pn;
        }
    `,

    fragment1 : `
        precision mediump float;
        varying vec4 fColor;
        varying vec4 fNormal;
        varying vec4 fLight1;
        varying vec4 fPosition;
        void main() {
            vec3 eye = vec3(0.0,0.0,-10.0);
            vec3 diffuseColor = vec3(0.1,0.1,0.1);
            vec3 specColor = vec3(1.0,1.0,1.0);
            vec3 normal = normalize(fNormal.xyz);
            vec3 lightDir = normalize(fLight1.xyz - eye);
            vec3 reflectDir = reflect(-fLight1.xyz, fNormal.xyz);
            vec3 viewDir = normalize(-eye.xyz);
            float lambertian = max(dot(fLight1.xyz,fNormal.xyz), 0.0);
            float specular = 0.0;
            if(lambertian > 0.0) {
               float specAngle = max(dot(reflectDir, viewDir), 0.0);
               specular = pow(specAngle, 4.0);
            }
            gl_FragColor = vec4(0.6*fColor.xyz +
                              lambertian*diffuseColor +
                              specular*specColor, 1.0);
            

            //gl_FragColor = vec4(fNormal.xyz, 1.0);//fColor;
        }
    `,

}