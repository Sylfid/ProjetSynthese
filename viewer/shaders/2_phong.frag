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

float fresnelComplex(in vec3 lightVector, in vec3 normal, in float etaU, in float etaImU) {
    float costheta = abs(dot(lightVector, normal));  //si bien normalise
    float sintheta2 = 1 -costheta*costheta;
    float rCi = pow(etaU*etaU -etaImU*etaImU -sintheta2 + 2*etaU*etaImU, 0.25);//ciraison
    float argCi = 0.5*atan(2*etaU*etaImU, etaU*etaU -etaImU*etaImU -sintheta2);//ciarg
    float fs = (pow(costheta- (rCi*cos(argCi)),2) + pow(rCi* sin(argCi), 2))/(pow(costheta + (rCi*cos(argCi)),2) + pow(rCi * sin(argCi), 2));
    float fp = (pow(etaU*etaU*costheta - rCi*cos(argCi),2) + pow(etaU*etaU*costheta- rCi * sin(argCi),2)) / (pow(etaU*etaU*costheta + rCi*cos(argCi),2) + pow(etaU*etaU*costheta  + rCi * sin(argCi),2));
    float f = (fs + fp)/2.;

    return 0.;
}


float fresnel(in vec3 lightVector, in vec3 normal, in float etaU) {
    float costheta = abs(dot(lightVector, normal));       //si bien normalise
    float ci = sqrt( etaU*etaU - (1- costheta*costheta));

    float fs = (costheta  - ci) / (costheta + ci);
    fs = fs * fs;
    float fp = (etaU*etaU*costheta - ci) / (etaU*etaU*costheta + ci);
    fp = fp*fp;
    float f = (fs + fp)/2.;
    if(f>1.){
        return 1.;
    }
    return f;
}

float NormalDistrib(float costhetaH, float alpha){
    if(costhetaH >0 && costhetaH <= 1 ){
        float costhetaH2 = costhetaH * costhetaH;
        float frac1 = 1 / (costhetaH2 * costhetaH2 * PI);// 1/(cos**4*PI)
        float tanThetaSquare = (1 - costhetaH2) / costhetaH2; // sin**2/cos**2
        float frac2 = alpha  / (alpha*alpha + tanThetaSquare);
        frac2 = frac2 * frac2;
        //return frac1 * frac2;
        return alpha*alpha/(PI*costhetaH2*costhetaH2*(alpha*alpha+tanThetaSquare)*(alpha*alpha+tanThetaSquare));

    }
    else{

      return 0;
    }
}

float GGXDistrib(float cosTheta, float alpha){

     float tanThetaSquare = (1 - cosTheta * cosTheta)/(cosTheta * cosTheta);
     return 2/( 1 + sqrt(1 + tanThetaSquare * alpha * alpha));
}



void main( void )
{
     // This is the place where there's work to be done

     float ka = 0.7;
     float kd = 0.8;
     vec4 vNull;

     vec4 vertNormalNormalise = normalize(vertNormal);
     vec4 lightVectorNormalise = normalize(lightVector);
     vec4 eyeVectorNormalise = normalize(eyeVector);

     //Ambient lighting ca
     vec4 ca = ka * vertColor * lightIntensity;

     //Diffuse lighting cd
     vec4 cd = kd * vertColor * max(dot(vertNormalNormalise, lightVectorNormalise), 0) * lightIntensity;

     //Specular lighting cs


     vec4 h = normalize(eyeVectorNormalise + lightVectorNormalise); //vector H
     float costhetaD = dot(h, lightVectorNormalise);

     float f;
     if(etaIm>0.01){
       f = fresnelComplex(vec3(lightVectorNormalise), vec3(h), eta, etaIm);
     }
     else{
       f = fresnel(vec3(lightVectorNormalise), vec3(h), eta);
     }


     vec4 cs ;  //initialization

     if(blinnPhong){
        cs =  f * vertColor * pow(max(dot( vertNormalNormalise, h), 0), shininess) * lightIntensity;
    }
     else{
        float new_alpha = (200 - shininess)/200;
        float costhetaH = abs(dot(vertNormalNormalise,h));
        float costhetaI = abs(dot(vertNormalNormalise, lightVectorNormalise));
        float costhetaO = abs(dot(vertNormalNormalise, eyeVectorNormalise));
        float g1_i = GGXDistrib(costhetaI, new_alpha);
        float g1_o = GGXDistrib(costhetaO, new_alpha);
        float Do_h = NormalDistrib(costhetaH, new_alpha);
        cs =  f *vertColor  *Do_h *g1_o*g1_i  /(4 * costhetaI * costhetaO)* lightIntensity;

     }

     fragColor = cs + ca + cd ;

}
