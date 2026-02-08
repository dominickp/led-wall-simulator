/**
 * Shader definitions for LED wall rendering
 */

export const vertexShader = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    void main() {
        // flip Y to correct upside-down video in WEBGL mode
        vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
        vec4 positionVec4 = vec4(aPosition, 1.0);
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
        gl_Position = positionVec4;
    }
`;

export const fragmentShader = `
    precision highp float;
    varying vec2 vTexCoord;
    uniform sampler2D tex0;
    uniform vec2 resolution;
    uniform vec2 ledCount; // cols, rows
    uniform float pitch;    // size of the "dot"
    uniform float bloom;    // bloom intensity (0-1)

    void main() {
        // 1. Create the grid coordinates (support non-square grids)
        vec2 grid = fract(vTexCoord * ledCount);
        vec2 cell = floor(vTexCoord * ledCount) / ledCount;

        // 2. Sample the video with anti-aliasing (4 sub-samples to reduce Moiré)
        vec4 col = vec4(0.0);
        
        // Sample 4 points within the LED cell and average to smooth aliasing
        for (int i = 0; i < 2; i++) {
            for (int j = 0; j < 2; j++) {
                vec2 offset = (vec2(float(i), float(j)) + 0.25) / (2.0 * ledCount);
                col += texture2D(tex0, cell + offset);
            }
        }
        col /= 4.0;

        // 3. Create the square LED shape
        vec2 d = abs(grid - 0.5);
        float edge = pitch * 0.5;
        float softness = 0.03;
        vec2 mask2d = smoothstep(edge + softness, edge - softness, d);
        float ledMask = mask2d.x * mask2d.y;

        // 4. Add glow based on LED brightness
        float brightness = (col.r + col.g + col.b) / 3.0;
        float distFromCenter = max(d.x, d.y);
        
        // Use squared bloom for more dramatic effect at upper end of slider
        float bloomIntensity = bloom * bloom;
        
        // Glow extends from the LED edge outward, fading with distance
        float glowRange = (0.5 - edge) * bloomIntensity * 2.0;
        float glowMask = smoothstep(edge + glowRange, edge, distFromCenter) * brightness * bloomIntensity * 2.0;

        // Add glow on top of LED for brightness effect
        float finalMask = ledMask + glowMask;

        gl_FragColor = col * finalMask;
    }
`;
