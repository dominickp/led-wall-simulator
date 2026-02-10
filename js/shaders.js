/**
 * Shader definitions for LED wall rendering
 * Shaders are loaded from external .glsl files for proper syntax highlighting
 */

let vertexShader = null;
let fragmentShader = null;

/**
 * Load shader files from disk
 * @returns {Promise<{vertexShader: string, fragmentShader: string}>}
 */
export async function loadShaders() {
    if (vertexShader && fragmentShader) {
        return { vertexShader, fragmentShader };
    }

    try {
        const [vShader, fShader] = await Promise.all([
            fetch('./shaders/vertexShader.glsl').then(r => r.text()),
            fetch('./shaders/fragmentShader.glsl').then(r => r.text())
        ]);
        
        vertexShader = vShader;
        fragmentShader = fShader;
        
        return { vertexShader, fragmentShader };
    } catch (error) {
        console.error('Failed to load shaders:', error);
        throw error;
    }
}
