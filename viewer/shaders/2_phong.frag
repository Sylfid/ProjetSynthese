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

    float ci = sqrt( pow(eta, 2) - (1- pow(costheta, 2)));

    float fs = pow( abs( (costheta  - ci) / (costheta  + ci) ),2);
    float fp = pow( abs( (pow(eta,2)*costheta  - ci) / (pow(eta,2)*costheta  + ci)) ,2);
    float f = (fs + fp)/2;
    if (f>1.){
      f = 1.;}
    return f;
}

float NormalDistrib(float costhetaH, float alpha){
    if(costhetaH >=0 && costhetaH < PI/2 ){
     float frac1 = 1 / (pow(costhetaH, 4) * PI);
     float tanThetaSquare = (1 - pow(costhetaH, 2))/pow(costhetaH, 2);
     float frac2 = alpha*alpha/ pow((alpha*alpha + pow(tanThetaSquare, 2)), 2);
     return frac1 * frac2;
    }
    else{
    return 0;
    }
}

float GGXDistrib(float cosTheta, float alpha){
     float tanThetaSquare = (1 - pow(cosTheta, 2))/pow(cosTheta, 2);
     return 2/( 1 + sqrt(1 + tanThetaSquare * pow(alpha, 2)));
}



void main( void )
{
    // au cas ou

    //normalize(vertNormal);
    //normalize(eyeVector);
    //normalize(lightVector);
     // This is the place where there's work to be done

     float ka = 0.1;
     float kd = 0.5;
     vec4 vNull;

     //Ambient lighting ca
     vec4 ca = ka * vertColor * lightIntensity;

     //Diffuse lighting cd
     vec4 cd = kd * vertColor * max(dot(normalize(vertNormal), normalize(lightVector)), 0) * lightIntensity;

     //Specular lighting cs

     float costheta = dot(-normalize(lightVector), normalize(vertNormal));       //si bien normalise
     vec4 h = normalize(vertNormal + lightVector); //vector H
     float f = fresnel(costheta);
     float theta = acos(costheta);
     float cosalphaplustheta = dot(normalize(eyeVector), normalize(vertNormal));
     float alphaplustheta = acos(cosalphaplustheta);
     float alpha = alphaplustheta - theta;
     float tanthetacarre = (1-pow(costheta,2))/pow(costheta,2);

     vec4 cs ;  //initialization

     if(blinnPhong){
        cs =  f*vertColor * pow(max(dot( normalize(vertNormal), h), 0), shininess) * lightIntensity;
    }
     else{

        float costhetaH = dot(normalize(vertNormal),h);
        float costhetaI = dot(normalize(vertNormal), -normalize(lightVector));
        float costhetaO = dot(normalize(vertNormal), normalize(eyeVector));
        float g1_i = GGXDistrib(costhetaI, alpha);
        float g1_o = GGXDistrib(costhetaO, alpha);
        float Do_h = NormalDistrib(costhetaH, alpha);
        cs = vertColor * lightIntensity * f * g1_o *g1_i * Do_h /4 / costhetaI / costhetaO;
     }




     //fragColor = vertColor;
     fragColor = cs;//ca + cd + cs;

}
