precision mediump float;

uniform sampler2D uMainSampler;
uniform float uIntensity;
uniform vec3 uColor;

varying vec2 outTexCoord;

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    vec3 glowColor = uColor * uIntensity;
    gl_FragColor = vec4(color.rgb + glowColor, color.a);
} 