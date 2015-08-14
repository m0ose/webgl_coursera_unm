
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
        uniform float wireFrame;
        uniform vec4 light1;
        uniform vec4 scale;
        varying vec4 fColor;
        varying vec4 fLight1;
        varying vec4 fNormal;
        varying vec4 fPosition;
        varying float fWireFrame;
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

        vec4 rotateQuat(vec3 p, vec4 q1) {
            vec4 p1 = vec4(0.0, p);  // input point quaternion
            p1 = multq(q1, multq(p1, invq(q1))); // rotated point quaternion
            p1 = vec4( p1.yzw, 1.0); // convert back to homogeneous coordinates
            return p1;
        }

        vec4 rotateOnY(vec3 p, float angleDegrees) {
            mat3 m;
            float angle = radians(angleDegrees);
            float c = cos(angle);
            float s = sin(angle);
            m[0] = vec3(c,0.0,-s);
            m[1] = vec3(0.0,1.0,0.0);
            m[2] = vec3(s,0.0,c);
            return vec4(m*p,1.0);
        }

        void main() {
            // scale
            vec3 p1 = vPosition.xyz * scale.xyz;
            // rotation
            vec4 p1r = rotateOnY(p1, vRotation);
            vec4 p = rotateQuat(p1r.xyz,vAxis);
            // shift center
            p = p + vCenter;
            gl_Position = projection*p;
            fPosition = vec4(gl_Position);
            //color
            fColor = vColor;
            fWireFrame = wireFrame;
            // lights
            fLight1 = projection * light1;
            // normal, must also be rotated
            vec3 norm = normalize(vNormal.xyz);
            vec4 nr = rotateOnY(norm, vRotation);
            vec4 pn = rotateQuat(normalize(nr.xyz), vAxis);
            fNormal = projection*pn;
        }
    `,

    fragment1 : `
        precision mediump float;
        varying vec4 fColor;
        varying vec4 fNormal;
        varying vec4 fLight1;
        varying vec4 fPosition;
        varying float fWireFrame;
        void main() {
            vec3 eye = vec3(-10.0,10.0,-10.0);
            vec3 diffuseColor = vec3(1.0,1.0,1.0);
            vec3 specColor = vec3(1.0,1.0,1.0);
            // diffuse
            vec3 lightDir = normalize(fLight1.xyz-eye);
            float diffuse = 0.3*max(dot(normalize(lightDir), normalize(fNormal.xyz)), 0.0);
            // specular
            vec3 I = fLight1.xyz - fPosition.xyz;
            vec3 N = normalize(fNormal.xyz);
            vec3 r = I - 2.0 * dot(N,I) * N;
            vec3 viewDir = normalize(eye.xyz-fPosition.xyz);
            float specAngle = max(dot(r,viewDir), 0.0);
            float specular = 0.12*pow(specAngle, 4.0);
            //
            vec3 fColor2 = fColor.xyz;
            if( fWireFrame > 0.0) {
                fColor2.xyz = vec3(0.0,1.0,0.0);
            }
            gl_FragColor = vec4(0.3*fColor2.xyz +
                              diffuse*diffuseColor +
                              specular*specColor, 1.0);
            

            //gl_FragColor = vec4(fNormal.xyz, 1.0);//fColor;
        }
    `,

}