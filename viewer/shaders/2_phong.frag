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

    float eta2 = eta*eta;
    float ci = sqrt( eta2 - (1- costheta*costheta));

    float fs = (costheta  - ci) / (costheta  + ci);
    fs = fs*fs;

    float fp = (eta2*costheta - ci) / (eta2*costheta + ci);
    fp = fp*fp;

    float f = (fs + fp)/2;

    if (f>1.){
      f = 1.;}

    return f;
}

float NormalDistrib(float costhetaH, float alpha, ){



    if(costhetaH >=0 && costhetaH < 1 ){


        float costhetaH2 = costhetaH * costhetaH;
        float frac1 = 1 / (costhetaH2 * costhetaH2 * PI);
        float tanThetaSquare = (1 - costhetaH2) / costhetaH2;


        float frac2 = alpha  / (alpha*alpha + tanThetaSquare);
        frac2 = frac2 * frac2;

        return frac1 * frac2;

    }
    else{

      return 0;
    }
}

float GGXDistrib(float cosTheta, float alpha){
    //if(cosTheta< 0.00001){
      //return 0;
    //}
     float tanThetaSquare = (1 - cosTheta * cosTheta)/(cosTheta * cosTheta);
     return 2/( 1 + sqrt(1 + tanThetaSquare * alpha * alpha));
}



void main( void )
{
     // This is the place where there's work to be done

     float ka = 0.1;
     float kd = 0.5;
     vec4 vNull;

     //Ambient lighting ca
     vec4 ca = ka * vertColor * lightIntensity;

     //Diffuse lighting cd
     vec4 cd = kd * vertColor * max(dot(normalize(vertNormal), normalize(lightVector)), 0) * lightIntensity;

     //Specular lighting cs


     //float costheta = dot(normalize(lightVector), normalize(vertNormal));       //si bien normalise
     vec4 h = normalize(normalize(eyeVector) + normalize(lightVector)); //vector H
     float costhetaD = dot(normalize(lightVector), h);
     
     float f = fresnel(costhetaD);


     vec4 cs ;  //initialization

     if(blinnPhong){
        cs =  vertColor * pow(max(dot( normalize(vertNormal), h), 0), shininess) * lightIntensity;
    }
     else{
        float new_alpha = (200 - shininess)/200;
        float costhetaH = dot(normalize(vertNormal),h);
        float costhetaI = dot(normalize(vertNormal), normalize(lightVector));

        float costhetaO = dot(normalize(vertNormal), normalize(eyeVector));
        float g1_i = GGXDistrib(costhetaI, new_alpha);
        float g1_o = GGXDistrib(costhetaO, new_alpha);
        float Do_h = NormalDistrib(costhetaH, new_alpha);
        cs =  f *vertColor* lightIntensity  *Do_h *g1_o*g1_i  /(4 * costhetaI * costhetaO);

     }




     //fragColor = vertColor;
     fragColor = cs +ca + cd ;//+ cs;

}
