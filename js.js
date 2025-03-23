import { BrowserMultiFormatReader } from '@zxing/browser';

// Select HTML elements
const videoElement = document.getElementById('video');
const outputElement = document.getElementById('output');
const recipeElement = document.getElementById('recipe');
const switchCameraButton = document.getElementById('switchCamera');
const codeReader = new BrowserMultiFormatReader();

// Store the currently active video device
let currentDeviceId = null;
let activeStream = null;

// Function to start the QR scanner with a specific camera device
async function startScanner(deviceId) {
    try {
        // Stop any previously active video stream
        if (activeStream) {
            const tracks = activeStream.getTracks();
            tracks.forEach(track => track.stop());
        }

        // Set up the new camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
        });

        activeStream = stream;
        videoElement.srcObject = stream;

        // Start the QR code scanning
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

// Function to switch between cameras
async function switchCamera() {
    try {
        // Get all video input devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length > 1) {
            // Find the next camera device
            const nextDevice = videoDevices.find(device => device.deviceId !== currentDeviceId);
            currentDeviceId = nextDevice ? nextDevice.deviceId : videoDevices[0].deviceId;

            // Start scanner with the selected camera
            startScanner(currentDeviceId);
        } else {
            console.log("No additional cameras found.");
        }
    } catch (error) {
        console.error("Error switching camera:", error);
    }
}

// Event listener for the "Switch Camera" button
switchCameraButton.addEventListener('click', switchCamera);

// Start scanner when page loads with the first available camera
window.onload = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length > 0) {
            currentDeviceId = videoDevices[0].deviceId;
            startScanner(currentDeviceId);
        } else {
            console.error("No video input devices found.");
        }
    } catch (error) {
        console.error("Error accessing camera:", error);
    }
};
