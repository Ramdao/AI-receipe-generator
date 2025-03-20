import { BrowserMultiFormatReader } from '@zxing/browser';

const videoElement = document.getElementById('video');
const outputElement = document.getElementById('output');
const recipeElement = document.getElementById('recipe');
const switchButton = document.getElementById('switchCamera'); // Button to switch cameras
const codeReader = new BrowserMultiFormatReader();

let videoDevices = [];
let currentDeviceIndex = 0; // Keep track of current camera

// Function to start scanning with the selected camera
async function startScanner(deviceId = null) {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length === 0) {
            console.error("No video input devices found.");
            return;
        }

        // Use the selected camera (or default to first one)
        const selectedDeviceId = deviceId || videoDevices[currentDeviceIndex].deviceId;

        codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, async (result, err) => {
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

// Function to switch camera
function switchCamera() {
    if (videoDevices.length < 2) {
        console.warn("No alternative camera found.");
        return;
    }

    // Toggle between available cameras
    currentDeviceIndex = (currentDeviceIndex + 1) % videoDevices.length;
    console.log(`Switching to camera: ${videoDevices[currentDeviceIndex].label}`);

    // Restart scanner with the new camera
    startScanner(videoDevices[currentDeviceIndex].deviceId);
}

// Attach event to switch camera button
switchButton.addEventListener("click", switchCamera);

// Start scanner when page loads
window.onload = () => startScanner();
