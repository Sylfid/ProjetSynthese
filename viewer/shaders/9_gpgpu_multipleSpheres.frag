#version 410
#define M_PI 3.14159265358979323846

uniform mat4 mat_inverse;
uniform mat4 persp_inverse;
uniform float lightIntensity;
uniform vec3 lightPosition;

uniform bool transparent;
uniform float shininess;
uniform float eta;

in vec4 eyeVector;
in vec4 lightVector;
in vec4 vertNormal;
in vec4 vertColor;
in vec4 position;
out vec4 fragColor;

const vec3 centers[3] = vec3[](vec3(0,-1000,0), vec3(0,5,0), vec3(1,3,0));
const float radiuses[3] = float[](1000, 0.7, 0.9);

bool raySphereIntersect(in vec3 start, in vec3 direction, in vec3 center, in float radius, out vec3 newPoint) {
    float det = pow(2*dot(direction,start-center),2) - 4*(pow(length(start-center),2) -pow(radius,2));
    if(det>0){
        float racine = (-2*dot(direction,start-center) - sqrt(det))/2;
        newPoint = start + racine * normalize(direction);
        if(direction.x == 0 || (newPoint - start).x / direction.x >= 0
          || direction.y == 0 || (newPoint - start).y / direction.y >= 0
          || direction.z == 0 || (newPoint - start).z / direction.z >= 0
        ) {
          return true;
        }
    }
    return false;
}

bool intersections(in vec3 start, in vec3 direction, out vec3 newPoint, out int indice) {
    bool test = false;
    vec3 temp;
    for(int i=0; i<centers.length(); i++) {
        if(raySphereIntersect(start, direction, centers[i], radiuses[i], temp)) {
            if(test) {
                if(length(start-temp) < length(start-newPoint)) {
                    newPoint = temp;
                    indice = i;
                }
            } else {
                newPoint = temp;
                indice = i;
            }
            test = true;
        }
    }
    return test;
}
float fresnelCoef(in vec3 lightVector, in vec3 normal) {
    float nu = eta;
    float costheta = abs(dot(lightVector, normal));       //si bien normalise
    float ci = sqrt( pow(nu, 2) - (1- pow(costheta, 2)));

    float fs = pow( abs( (costheta  - ci) / (costheta  + ci) ),2);
    float fp = pow( abs( (pow(nu,2)*costheta  - ci) / (pow(nu,2)*costheta  + ci)) ,2);
    float f = (fs + fp)/2.;

    return f;
}

vec4 specularLighting(in vec3 lightVector, in vec3 normal, in vec3 u) { //normalizés en entrée
    float costheta = abs(dot(lightVector, normal)); //bien normalisés
    vec3 h = normalize(normal + lightVector); //vector H
    float f = fresnelCoef(lightVector, normal);//bien normalisés
    float theta = acos(costheta);
    float cosalphaplustheta = dot(u, normal);
    float alphaplustheta = acos(cosalphaplustheta);
    float alpha = alphaplustheta - theta;
    float tanthetacarre = (1-pow(costheta,2))/pow(costheta,2);
    float g1 = 2 / ( 1 + pow(1 +pow(alpha,2)*tanthetacarre ,1/2) );
    vec4 cs = f * vertColor * pow(max(dot(normal, h), 0), shininess) * lightIntensity;
    return cs;
}

void main(void)
{
    vec4 resultColor;
    float ka = 0.7, kd = 0.5;

    // Step 1: I need pixel coordinates. Division by w?
    vec4 worldPos = position;
    worldPos.z = 1; // near clipping plane
    worldPos = persp_inverse * worldPos;
    worldPos /= worldPos.w;
    worldPos.w = 0;
    worldPos = normalize(worldPos);

    // Step 2: ray direction:
    vec3 u = normalize((mat_inverse * worldPos).xyz);
    vec3 eye = (mat_inverse * vec4(0, 0, 0, 1)).xyz;

    vec3 intersection, depart; int indice; int compteur = 0; vec3 poubelle1; int poubelle2;
    vec4 ambiant, diffuse, specular, total;
    vec4 couleurs[10]; float coeffs[10];
    //Ambient lighting
    bool hasIntersect = intersections(eye, u, intersection, indice);
    while(hasIntersect && compteur < 10) {
        vec3 normal = normalize(centers[indice] - intersection);
        if(compteur == 0) {
            coeffs[compteur] = 1;
        } else {
            coeffs[compteur] = fresnelCoef(u, normal); //les 2 normalisés
        }
        ambiant = ka * vertColor * lightIntensity;
        if(intersections(intersection, normalize(lightPosition-intersection), poubelle1, poubelle2)) {
            couleurs[compteur] = ambiant;
        } else {
            diffuse = kd * vertColor * max(dot(normal, normalize(intersection-lightPosition)), 0) * lightIntensity;
            specular = specularLighting(normalize(intersection-lightPosition), normal, u); //les 3 normalisé
            couleurs[compteur] = ambiant + diffuse + specular;
        }
        vec3 reflectedRay = normalize(reflect(u, normal));
        compteur = compteur + 1;
        u = reflectedRay;
        depart = intersection;
        hasIntersect = intersections(depart, u, intersection, indice);
    }
    if(compteur == 0) { // on a rien intersecté
        resultColor = vec4(0.2,0.6,0.7,1); //couleur du fond
    } else {
        resultColor = vec4(0,0,0,1);
        for(int i=compteur-1; i>=0; i--) {
            resultColor = (resultColor + couleurs[i]) * coeffs[i];
        }
    }
    fragColor = resultColor;
}
