import { BrowserMultiFormatReader } from '@zxing/browser';

// Select HTML elements
const videoElement = document.getElementById('video');
const outputElement = document.getElementById('output');
const recipeElement = document.getElementById('recipe');
const codeReader = new BrowserMultiFormatReader();

// Function to start the QR scanner
async function startScanner() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length > 0) {
            const deviceId = videoDevices[0].deviceId;
            codeReader.decodeFromVideoDevice(deviceId, videoElement, async (result, err) => {
                if (result) {
                    const foodItem = result.text;
                    outputElement.textContent = `Scanned: ${foodItem}`;
                    console.log("QR Code Scanned:", foodItem);
                    
                    // Fetch and display recipe
                    const recipe = await generateRecipe(foodItem);
                    recipeElement.innerHTML = `<h2>Recipe for ${foodItem}</h2><p>${recipe}</p>`;
                }
            });
        } else {
            console.error("No video input devices found.");
        }
    } catch (error) {
        console.error("Error accessing camera:", error);
    }
}

// Function to fetch a recipe from the backend
async function generateRecipe(title) {
    try {
        const response = await fetch('https://ai-receipe-generator.onrender.com/generate-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });

        const data = await response.json();
        return data.recipe || "Recipe not found.";
    } catch (error) {
        console.error("Error fetching recipe:", error);
        return "Failed to fetch recipe.";
    }
}

// Start scanner when page loads
window.onload = startScanner;
