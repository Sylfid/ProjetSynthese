#version 410
#define M_PI 3.14159265358979323846

uniform mat4 mat_inverse;
uniform mat4 persp_inverse;
uniform sampler2D envMap;
uniform vec3 center;
uniform float radius;

uniform bool transparent;
uniform float shininess;
uniform float eta;

in vec4 position;

out vec4 fragColor;


vec4 getColorFromEnvironment(in vec3 direction)
{
  float theta = 1 + (acos(dot(normalize(direction), vec3(0, 1, 0))) / M_PI);
  float phi = 0.5 + (atan(direction.x, direction.z) / (2*M_PI));
  return texture2D(envMap, vec2(phi, theta));
}



bool raySphereIntersect(in vec3 start, in vec3 direction, in bool boule, out vec3 newPoint) {
    float det = pow(2*dot(direction,start-center),2) - 4*( pow(length(start-center),2) -pow(radius,2) );
    if(det>0){
        float racine;
        if(boule) {
          racine = ( -2* dot(direction,start-center) + sqrt(det) )/2;
        } else {
            if(racine < 0.){
                return false;
            }
            racine = ( -2* dot(direction,start-center) - sqrt(det) )/2;
        }
        newPoint = start + racine * normalize(direction);
        return true;
    }
    return false;
}

float fresnelCoef(in vec3 lightVector, in vec3 normal, in float etaU) {
    float costheta = abs(dot(lightVector, normal));       //si bien normalise
    float ci = sqrt( pow((etaU), 2) - (1- pow(costheta, 2)));

    float fs = pow( abs( (costheta  - ci) / (costheta  + ci) ),2);
    float fp = pow( abs( (pow((etaU),2)*costheta  - ci) / (pow((etaU),2)*costheta  + ci)) ,2);
    float f = (fs + fp)/2.;

    return f;
}

void main(void)
{
    // Step 1: I need pixel coordinates. Division aby w?
    vec4 worldPos = position;
    worldPos.z = 1; // near clipping plane
    worldPos = persp_inverse * worldPos;
    worldPos /= worldPos.w;
    worldPos.w = 0;
    worldPos = normalize(worldPos);
    // Step 2: ray direction:
    vec3 u = normalize((mat_inverse * worldPos).xyz);
    vec3 eye = (mat_inverse * vec4(0, 0, 0, 1)).xyz;

    // TODO
    vec3 intersection;
    bool hasIntersect = raySphereIntersect(eye, u, false, intersection);
    vec4 resultColor;
    if(hasIntersect) {
        vec3 vertNormal = normalize(intersection - center);
        vec3 refractedRay = normalize(refract(u, vertNormal, 1./eta));
        vec3 reflectedRay = normalize(reflect(u, vertNormal));
        float coeff1 = fresnelCoef(u, vertNormal, eta);//les deux bien normalizés
        vec3 intersection2;
        vec4 temp;
        hasIntersect = raySphereIntersect(intersection, refractedRay, true, intersection2);
        if(transparent == true){
            if(hasIntersect) {
                vertNormal = normalize(center - intersection2);
                vec3 refractedRay2 = normalize(refract(normalize(refractedRay), vertNormal, eta));
                vec3 reflectedRay2 = normalize(reflect(normalize(refractedRay), vertNormal));
                float coeff2 = fresnelCoef(normalize(refractedRay), vertNormal, 1./eta);
                temp = coeff2 * getColorFromEnvironment(reflectedRay2) + (1-coeff2) * getColorFromEnvironment(refractedRay2);
                resultColor = coeff1 * getColorFromEnvironment(reflectedRay) + (1-coeff1) * temp;
                //resultColor = vec4(0,0,0,1);
                vec3 intersection3;
                hasIntersect = raySphereIntersect(intersection2, refractedRay, true, intersection3);
                if(hasIntersect) {
                    vertNormal = normalize(center - intersection3);
                    vec3 refractedRay3 = normalize(refract(normalize(refractedRay2), vertNormal, 1./eta));
                    vec3 reflectedRay3 = normalize(reflect(normalize(refractedRay2), vertNormal));
                    float coeff3 = fresnelCoef(normalize(refractedRay2), vertNormal, eta);
                    temp = coeff3 * getColorFromEnvironment(reflectedRay3) + (1-coeff3) * getColorFromEnvironment(refractedRay3);
                    temp = coeff2 * getColorFromEnvironment(reflectedRay2) + (1-coeff2) * temp;
                    resultColor = coeff1 * getColorFromEnvironment(reflectedRay) + (1-coeff1) * temp;
                    vec3 intersection4;
                    hasIntersect = raySphereIntersect(intersection3, refractedRay, true, intersection4);
                    if(hasIntersect) {
                        vertNormal = normalize(center - intersection4);
                        vec3 refractedRay4 = normalize(refract(normalize(refractedRay3), vertNormal, eta));
                        vec3 reflectedRay4 = normalize(reflect(normalize(refractedRay3), vertNormal));
                        float coeff4 = fresnelCoef(normalize(refractedRay3), vertNormal, 1./eta);
                        temp = coeff4 * getColorFromEnvironment(reflectedRay4) + (1-coeff3) * getColorFromEnvironment(refractedRay4);
                        temp = coeff3 * getColorFromEnvironment(reflectedRay3) + (1-coeff3) * temp;
                        temp = coeff2 * getColorFromEnvironment(reflectedRay2) + (1-coeff2) * temp;
                        if(coeff1 == 0){
                          resultColor = getColorFromEnvironment(u);
                        }else{
                          resultColor = coeff1 * getColorFromEnvironment(reflectedRay) + (1-coeff1) * temp;
                        }
                    }
                }
            }
        }
        else{
            resultColor = getColorFromEnvironment(reflectedRay)*coeff1;
        }

    } else {
        resultColor = getColorFromEnvironment(u);
    }
    fragColor = resultColor;
}
