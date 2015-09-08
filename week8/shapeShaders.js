
var shapeShaders = {

    vertex1 : `
        precision highp float;
        attribute vec4 vPosition;
        attribute vec4 vColor;
        attribute vec4 vNormal;
        attribute vec4 vTexCoord;
        uniform vec4 vAxis;
        uniform vec4 vCenter;
        uniform float vRotation;
        uniform mat4 projection;
        uniform float wireFrame;
        uniform vec4 scale;
        varying vec4 fColor;
        varying vec4 fNormal;
        varying vec4 fPosition;
        varying float fWireFrame;
        varying vec4 fTexCoord;
        //lights
        const int cNumLight = 5;  
        uniform mat4 vLightPosition[cNumLight]; 
        varying vec4 fLightPos[cNumLight];
        varying vec4 fLightColor[cNumLight];

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
            fPosition.z = fPosition.z;
            //color
            fColor = vColor;
            fWireFrame = wireFrame;
            // lights
            for (int i=0; i < cNumLight; i++) {  
                fLightPos[i] = projection * vLightPosition[i][0]; 
                fLightColor[i] = vLightPosition[i][1];
            }
            // normal, must also be rotated
            vec3 norm = normalize(vNormal.xyz/scale.xyz);
            vec4 nr = rotateOnY(norm, vRotation);
            vec4 pn = rotateQuat(normalize(nr.xyz), vAxis);
            fNormal = projection*pn;
            // texture
            fTexCoord = vTexCoord;
        }
    `,

    fragment1 : `
        precision highp float;
        uniform int useTexture;
        uniform sampler2D texture;
        varying vec4 fColor;
        varying vec4 fNormal;
        varying vec4 fPosition;
        varying float fWireFrame;
        varying vec4 fTexCoord;
        varying vec4 fLightPos[5];
        varying vec4 fLightColor[5];

        void main() {
            vec4 fColor2 = fColor;
            // wireframe
            vec3 wireColor = vec3(0.0,0.0,0.0);
            if( fWireFrame > 0.0) {
                wireColor = vec3(0.0,0.8,0.0);
            }
            // texture
            if( useTexture == 1) {
                fColor2 = vec4(texture2D( texture, fTexCoord.xy ).xyz, 1.0);
            }
            // ambient color
            vec3 ambient = fColor2.xyz * 0.4;
            gl_FragColor = vec4(wireColor + ambient, 1.0); 
            //
            // loop throught the lights
            for(int i=0; i<5; i++) {
                vec4 light = fLightPos[i];
                vec3 lightColor = fLightColor[i].xyz;
                float strength = fLightColor[i].a;
                // parameters
                vec3 eye = vec3(0.0,0.0,-4.0);
                vec3 lightDir = normalize(light.xyz-fPosition.xyz);
                vec3 viewDir = normalize(eye.xyz-fPosition.xyz);
                float distance = length(lightDir);
                // diffuse
                float diffuse = 1.0*max(dot(normalize(lightDir), normalize(-fNormal.xyz)), 0.0);
                diffuse = diffuse/(distance*distance);
                // specular
                //vec3 I = light.xyz - fPosition.xyz;
                vec3 N = normalize(fNormal.xyz);
                vec3 r = 2.0 * dot(lightDir,N) * N - lightDir;
                float specAngle = max(dot(r,viewDir), 0.0);
                float specular = 0.4*pow(specAngle, 22.0);
                specular = specular/(distance*distance);
                // colors
                vec3 fColor3 = min( vec3(1.0,1.0,1.0), fColor2.xyz + vec3(0.3,0.3,0.3)); // add some reflection to the colors that arent exactly the same
                vec3 diffuseColor = fColor3.xyz*lightColor*strength; //vec3(1.0,1.0,1.0);
                vec3 specColor = fColor3.xyz*lightColor*strength; //vec3(0.5,0.5,0.5);
                //
                vec3 lightContrib = vec3(diffuse*diffuseColor + specular*specColor);
                gl_FragColor += vec4( lightContrib, 1.0);
                //gl_FragColor = vec4(N,1.0);
            }
        }
    `,

}