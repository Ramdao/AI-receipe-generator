import { BrowserMultiFormatReader } from '@zxing/browser';

// Select HTML elements
const videoElement = document.getElementById('video');
const outputElement = document.getElementById('output');
const recipeElement = document.getElementById('recipe');
const switchButton = document.getElementById('switchCamera');
const codeReader = new BrowserMultiFormatReader();

let videoDevices = [];
let currentDeviceIndex = 0;

// Function to start scanning with the selected camera
async function startScanner(deviceId = null) {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length === 0) {
            console.error("No video input devices found.");
            return;
        }

        const selectedDeviceId = deviceId || videoDevices[currentDeviceIndex].deviceId;

        codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, async (result, err) => {
            if (result) {
                const foodItem = result.text;
                outputElement.textContent = `Scanned: ${foodItem}`;
                console.log("QR Code Scanned:", foodItem);

                // Save the last scanned item to sessionStorage
                sessionStorage.setItem("lastScanned", foodItem);

                // Fetch and display new recipe
                fetchAndDisplayRecipe(foodItem);
            }
        });
    } catch (error) {
        console.error("Error accessing camera:", error);
    }
}

// Function to fetch a recipe from the backend
async function fetchAndDisplayRecipe(title) {
    try {
        const response = await fetch('https://ai-receipe-generator.onrender.com/generate-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });

        const data = await response.json();
        displayRecipe(title, data.recipe || "Recipe not found.");
    } catch (error) {
        console.error("Error fetching recipe:", error);
        displayRecipe(title, "Failed to fetch recipe.");
    }
}

// Function to format and display the recipe
function displayRecipe(foodItem, recipeText) {
    // Extract the title (first line)
    const lines = recipeText.trim().split("\n");
    const title = lines[0].trim();  

    // Extract ingredients and instructions using regex
    const ingredientsMatch = recipeText.match(/Ingredients:\s*([\s\S]*?)Instructions:/);
    const instructionsMatch = recipeText.match(/Instructions:\s*([\s\S]*)/);

    const ingredients = ingredientsMatch ? ingredientsMatch[1].trim().split("\n- ").slice(1) : [];
    const instructions = instructionsMatch ? instructionsMatch[1].trim().split(/\d+\.\s/).slice(1) : [];

    // Format and display the recipe
    recipeElement.innerHTML = `
        <h2>Generating Recipe for: ${foodItem}</h2>
        <h3>Ingredients:</h3>
        <ul>${ingredients.map(ing => `<li>${ing}</li>`).join("")}</ul>
        <h3>Instructions:</h3>
        <ol>${instructions.map(step => `<li>${step}</li>`).join("")}</ol>
        <button id="refreshRecipe">Get New Recipe</button>
    `;

    // Add event listener to refresh button
    document.getElementById("refreshRecipe").addEventListener("click", () => fetchAndDisplayRecipe(foodItem));
}

// Function to switch camera
function switchCamera() {
    if (videoDevices.length < 2) {
        console.warn("No alternative camera found.");
        return;
    }

    currentDeviceIndex = (currentDeviceIndex + 1) % videoDevices.length;
    console.log(`Switching to camera: ${videoDevices[currentDeviceIndex].label}`);

    startScanner(videoDevices[currentDeviceIndex].deviceId);
}

// Attach event to switch camera button
switchButton.addEventListener("click", switchCamera);

// Load last scanned food item on page refresh
window.onload = () => {
    startScanner();
    const lastScanned = sessionStorage.getItem("lastScanned");
    if (lastScanned) {
        fetchAndDisplayRecipe(lastScanned);
    }
};
