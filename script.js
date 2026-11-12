
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

const filterSelect = document.getElementById("filterSelect");
const stripButton = document.getElementById("stripButton");

let cameraStream = null;
let photoCount = 0;
let currentFilter = "none";

const filterStyles = {
  none: "none",
  grayscale: "grayscale(100%)",
  vintage: "sepia(65%) contrast(1.1) brightness(.9)",
  horror: "sepia(30%) saturate(1.7) hue-rotate(315deg) contrast(1.2)"
};

// INTRO SCREEN
function enterBooth() {
  introScreen.classList.add("hidden");
  boothScreen.classList.remove("hidden");
}

startButton.addEventListener("click", enterBooth);

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    !introScreen.classList.contains("hidden")
  ) {
    enterBooth();
  }
});

// RETURN TO INTRO
backButton.addEventListener("click", () => {
  stopCamera();
  boothScreen.classList.add("hidden");
  introScreen.classList.remove("hidden");
});

// CAMERA
async function startCamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera requires HTTPS or localhost.");
    }

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    camera.srcObject = cameraStream;
    camera.style.display = "block";
    cameraMessage.style.display = "none";

    camera.style.filter = filterStyles[currentFilter];

    await camera.play();

    captureButton.disabled = false;
    cameraButton.textContent = "STOP CAMERA";

    statusMessage.textContent = "Camera connected. Ready for capture.";

  } catch (error) {
    cameraStream = null;

    statusMessage.textContent =
      "Camera unavailable. Please check browser permissions or upload a photo.";

    console.error(error);
  }
}

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

cameraButton.addEventListener("click", () => {
  if (cameraStream) {
    stopCamera();
    statusMessage.textContent = "Camera disconnected.";
  } else {
    startCamera();
  }
});

// CAPTURE PHOTO
captureButton.addEventListener("click", () => {
  if (!cameraStream || !camera.videoWidth) {
    statusMessage.textContent = "Please wait for the camera to load.";
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;

  const context = canvas.getContext("2d");

  context.filter = filterStyles[currentFilter];
  context.drawImage(camera, 0, 0);

  const photo = canvas.toDataURL("image/png");

  addPhoto(photo);
});

// UPLOAD PHOTO
uploadInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    statusMessage.textContent = "Please select an image.";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    addPhoto(reader.result);
  };

  reader.readAsDataURL(file);
  uploadInput.value = "";
});

// ADD PHOTO TO GALLERY
function addPhoto(photo) {
  photoCount++;

  const card = document.createElement("div");
  card.className = "photo-card";

  const image = document.createElement("img");
  image.src = photo;
  image.alt = "Survivor photo " + photoCount;
  image.style.filter = filterStyles[currentFilter];

  const caption = document.createElement("p");
  caption.textContent =
    "SURVIVOR FILE // " + String(photoCount).padStart(3, "0");

  const downloadButton = document.createElement("button");
  downloadButton.textContent = "DOWNLOAD PHOTO";

  downloadButton.addEventListener("click", () => {
    downloadImage(photo, "survivor-photo-" + photoCount + ".png");
  });

  card.appendChild(image);
  card.appendChild(caption);
  card.appendChild(downloadButton);

  photoGallery.prepend(card);

  statusMessage.textContent =
    "Photo successfully added to your survivor archive.";
}

// DOWNLOAD INDIVIDUAL IMAGE
function downloadImage(data, filename) {
  const link = document.createElement("a");
  link.href = data;
  link.download = filename;
  link.click();
}

// FILTERS
filterSelect.addEventListener("change", () => {
  currentFilter = filterSelect.value;

  camera.style.filter = filterStyles[currentFilter];

  document.querySelectorAll(".photo-card img").forEach(image => {
    image.style.filter = filterStyles[currentFilter];
  });

  statusMessage.textContent =
    "Filter selected: " + currentFilter.toUpperCase();
});

// DOWNLOAD PHOTO STRIP
stripButton.addEventListener("click", async () => {
  const images = Array.from(
    photoGallery.querySelectorAll(".photo-card img")
  );

  if (images.length === 0) {
    statusMessage.textContent = "Take or upload photos first!";
    return;
  }

  const canvas = document.createElement("canvas");

  const width = 600;
  const imageHeight = 450;
  const padding = 30;
  const captionHeight = 80;

  canvas.width = width;
  canvas.height =
    padding * 2 +
    images.length * (imageHeight + padding) +
    captionHeight;

  const context = canvas.getContext("2d");

  context.fillStyle = "#e4dfd3";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    if (!image.complete) {
      await new Promise(resolve => {
        image.onload = resolve;
        image.onerror = resolve;
      });
    }

    const y = padding + i * (imageHeight + padding);

    context.save();
    context.filter = filterStyles[currentFilter];

    context.drawImage(
      image,
      padding,
      y,
      width - padding * 2,
      imageHeight
    );

    context.restore();
  }

  context.fillStyle = "#17191d";
  context.font = "20px monospace";
  context.textAlign = "center";

  context.fillText(
    "RACCOON CITY // SURVIVOR ARCHIVE",
    width / 2,
    canvas.height - 35
  );

  const link = document.createElement("a");
  link.download = "raccoon-city-photo-strip.png";
  link.href = canvas.toDataURL("image/png");
  link.click();

  statusMessage.textContent =
    "Your photo strip has been downloaded!";
});
