
const startButton = document.getElementById("startButton");
const backButton = document.getElementById("backButton");
const introScreen = document.querySelector(".intro-screen");
const boothScreen = document.getElementById("boothScreen");

const camera = document.getElementById("camera");
const cameraButton = document.getElementById("cameraButton");
const captureButton = document.getElementById("captureButton");
const uploadInput = document.getElementById("uploadInput");

const cameraMessage = document.getElementById("cameraMessage");
const statusMessage = document.getElementById("statusMessage");
const photoGallery = document.getElementById("photoGallery");

let cameraStream = null;
let photoCount = 0;

// Enter the photobooth
function enterBooth() {
  introScreen.classList.add("hidden");
  boothScreen.classList.remove("hidden");
}

startButton.addEventListener("click", enterBooth);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !boothScreen.classList.contains("hidden")) {
    return;
  }

  if (event.key === "Enter" && !introScreen.classList.contains("hidden")) {
    enterBooth();
  }
});

// Return to the intro
backButton.addEventListener("click", () => {
  stopCamera();
  boothScreen.classList.add("hidden");
  introScreen.classList.remove("hidden");
});

// Start the camera
async function startCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera access requires HTTPS or localhost.");
    }

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: false
    });

    camera.srcObject = cameraStream;
    camera.style.display = "block";
    cameraMessage.style.display = "none";

    captureButton.disabled = false;
    cameraButton.textContent = "STOP CAMERA";

    statusMessage.textContent = "Camera connected. Ready for capture.";
  } catch (error) {
    statusMessage.textContent =
      "Camera unavailable. Check browser permissions or upload a photo instead.";

    console.error(error);
  }
}

// Stop the camera
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  camera.srcObject = null;
  camera.style.display = "none";
  cameraMessage.style.display = "block";

  captureButton.disabled = true;
  cameraButton.textContent = "START CAMERA";
}

// Camera button
cameraButton.addEventListener("click", () => {
  if (cameraStream) {
    stopCamera();
    statusMessage.textContent = "Camera disconnected.";
  } else {
    startCamera();
  }
});

// Capture a photo
captureButton.addEventListener("click", () => {
  if (!cameraStream || !camera.videoWidth) {
    statusMessage.textContent = "Please wait for your camera to load.";
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;

  const context = canvas.getContext("2d");
  context.drawImage(camera, 0, 0);

  const photo = canvas.toDataURL("image/png");
  addPhoto(photo);
});

// Upload a photo
uploadInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    statusMessage.textContent = "Please select an image file.";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    addPhoto(reader.result);
  };

  reader.readAsDataURL(file);
  uploadInput.value = "";
});

// Add photo to gallery
function addPhoto(photo) {
  photoCount++;

  const card = document.createElement("div");
  card.className = "photo-card";

  const image = document.createElement("img");
  image.src = photo;
  image.alt = "Survivor photo " + photoCount;

  const caption = document.createElement("p");
  caption.textContent = "SURVIVOR FILE // " +
    String(photoCount).padStart(3, "0");

  const downloadButton = document.createElement("button");
  downloadButton.textContent = "DOWNLOAD PHOTO";

  downloadButton.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = photo;
    link.download = "survivor-photo-" + photoCount + ".png";
    link.click();
  });

  card.appendChild(image);
  card.appendChild(caption);
  card.appendChild(downloadButton);

  photoGallery.prepend(card);

  statusMessage.textContent =
    "Photo successfully saved to your survivor archive.";
}
