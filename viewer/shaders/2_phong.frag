#version 410
#define PI 3.1415926538
//#include <algorithm>    // std::max


uniform float lightIntensity;
uniform bool blinnPhong;
uniform float shininess;
uniform float eta;
uniform float etaIm;
uniform sampler2D shadowMap;

in vec4 eyeVector;
in vec4 lightVector;
in vec4 vertColor;
in vec4 vertNormal;
in vec4 lightSpace;

out vec4 fragColor;

float fresnel(float costheta){

    float ci = pow( pow(eta, 2) - (1- pow(costheta, 2)), 1/2);

    float fs = pow( abs( (costheta  - ci) / (costheta  + ci) ),2);
    float fp = pow( abs( (pow(eta,2)*costheta  - ci) / (pow(eta,2)*costheta  + ci)) ,2);
    float f = (fs + fp)/2;
    return f;
}

float NormalDistrib(float costhetaH, float alpha){
    if(costhetaH >=0){
     float frac1 = 1 / (pow(costhetaH, 4) * PI);
     float tanThetaSquare = (1 - pow(costhetaH, 2))/pow(costhetaH, 2);
     float frac2 = pow(alpha/100, 2)/ pow((pow(alpha/100, 2) + pow(tanThetaSquare, 2)), 2);
     return frac1 * frac2;
    }
    else{
    return 0;
    }
}

float GGXDistrib(float cosTheta, float alpha){
     float tanThetaSquare = (1 - pow(cosTheta, 2))/pow(cosTheta, 2);
     return 2/( 1 + sqrt(1 + tanThetaSquare * pow(alpha/100, 2)));
}



void main( void )
{
    // au cas ou
    normalize(vertNormal);
    normalize(eyeVector);
    normalize(lightVector);
     // This is the place where there's work to be done

     float ka = 0.1;
     float kd = 0.5;
     vec4 vNull;

     //Ambient lighting
     vec4 ca = ka * vertColor * lightIntensity;

     //Diffuse lighting
     vec4 cd = kd * vertColor * max(dot(vertNormal, lightVector), 0) * lightIntensity;

     //Specular lighting

     float costheta = dot(lightVector, vertNormal);       //si bien normalise
     vec4 h = normalize(vertNormal + lightVector); //vector H

     float f = fresnel(costheta);


     float theta = acos(costheta);
     float cosalphaplustheta = dot(eyeVector, vertNormal);
     float alphaplustheta = acos(cosalphaplustheta);
     float alpha = alphaplustheta - theta;
     float tanthetacarre = (1-pow(costheta,2))/pow(costheta,2);
     float g1 = 2 / ( 1 + pow(1 +pow(alpha,2)*tanthetacarre ,1/2) );

     vec4 cs ;  //initialization

     if(blinnPhong){
        cs = f * vertColor * pow(max(dot(vertNormal, h), 0), shininess) * lightIntensity;
    }
     else{

        float costhetaH = dot(vertNormal,h);
        float costhetaI = dot(vertNormal,lightVector);
        float costhetaO = dot(vertNormal,eyeVector);
        cs = vertColor * lightIntensity * fresnel(costheta) * NormalDistrib(costhetaH, alpha) * GGXDistrib(costhetaI, alpha) * GGXDistrib(costhetaO, alpha) /4 / costhetaI / costhetaO;
     }




     //fragColor = vertColor;
     fragColor = ca + cd + cs;

}
