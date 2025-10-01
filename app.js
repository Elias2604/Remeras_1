// ==================== CONFIGURACIÓN DEL CANVAS ====================
const canvas = new fabric.Canvas("tshirtCanvas", {
  backgroundColor: "#e5e5e5",
  preserveObjectStacking: true,
  selection: true,
});

// Ajustar tamaño del canvas
function resizeCanvas() {
  const editor = document.querySelector(".editor");
  const rect = editor.getBoundingClientRect();
  canvas.setWidth(rect.width * 0.7);
  canvas.setHeight(rect.height * 0.8);
  canvas.renderAll();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ==================== REMERAS (FRENTE / DORSO) ====================
let tshirtImages = [
  "img/blanco.png",         // 0
  "img/remera_bordo_1.png", // 1
  "img/remera_rojo_1.png",  // 2
  "img/remera_azul_1.png",  // 3
  "img/remera_verde_1.png", // 4
];
let tshirtBackImages = [
  "img/blanco_2.png",         // 0
  "img/remera_bordo_2.png",   // 1
  "img/remera_rojo_2.png",    // 2
  "img/remera_azul_2.png",    // 3
  "img/remera_verde_2.png",   // 4
];

let currentTshirtIndex = 0;
let isFront = true;
let tshirtBase = null;

// Guardamos diseños independientes
let designs = {};

// ==================== CARGAR REMERA ====================
function loadTshirt() {
  const imagePath = isFront
    ? tshirtImages[currentTshirtIndex]
    : tshirtBackImages[currentTshirtIndex];

  fabric.Image.fromURL(imagePath, (img) => {
    if (tshirtBase) canvas.remove(tshirtBase);

    img.scaleToWidth(canvas.width * 0.8);
    img.set({
      selectable: false,
      evented: false,
      left: canvas.width / 2 - (img.width * img.scaleX) / 2,
      top: canvas.height / 2 - (img.height * img.scaleY) / 2,
    });

    tshirtBase = img;
    canvas.add(img);
    canvas.sendToBack(img);
    canvas.renderAll();
  });
}

// ==================== GUARDAR Y RESTAURAR ====================
function saveCurrentDesign() {
  const key = currentTshirtIndex + (isFront ? "" : "_back");
  designs[key] = canvas
    .getObjects()
    .filter((obj) => obj !== tshirtBase)
    .map((obj) => obj.toObject());
}

function restoreDesign(key) {
  canvas.getObjects().forEach((obj) => {
    if (obj !== tshirtBase) canvas.remove(obj);
  });

  const saved = designs[key];
  if (saved && saved.length > 0) {
    fabric.util.enlivenObjects(saved, (objs) => {
      objs.forEach((obj) => canvas.add(obj));
      canvas.renderAll();
    });
  }
}

// ==================== CARGA INICIAL ====================
loadTshirt();

// ==================== CAMBIO DE COLOR (FADE SUAVE) ====================
const colorCircles = document.querySelectorAll(".color-circle");

colorCircles.forEach((circle, index) => {
  circle.addEventListener("click", () => {
    const canvasEl = document.getElementById("tshirtCanvas");
    canvasEl.classList.add("fade-out");

    setTimeout(() => {
      saveCurrentDesign();
      currentTshirtIndex = index;
      loadTshirt();
      restoreDesign(currentTshirtIndex + (isFront ? "" : "_back"));

      canvasEl.classList.remove("fade-out");
      canvasEl.classList.add("fade-in");

      setTimeout(() => {
        canvasEl.classList.remove("fade-in");
      }, 400);
    }, 300);
  });
});

// ==================== BOTONES DE GIRO (FRENTE ↔ DORSO CON FLIP LATERAL) ====================
document.getElementById("btnPrev").addEventListener("click", flipTshirt);
document.getElementById("btnNext").addEventListener("click", flipTshirt);

function flipTshirt() {
  const canvasEl = document.getElementById("tshirtCanvas");
  canvasEl.classList.add("flip-out");

  setTimeout(() => {
    saveCurrentDesign();
    isFront = !isFront;
    loadTshirt();
    restoreDesign(currentTshirtIndex + (isFront ? "" : "_back"));

    canvasEl.classList.remove("flip-out");
    canvasEl.classList.add("flip-in");

    setTimeout(() => {
      canvasEl.classList.remove("flip-in");
    }, 400);
  }, 400);
}

// ==================== EDICIÓN ====================
document.getElementById("upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (f) => {
    fabric.Image.fromURL(f.target.result, (img) => {
      img.scale(0.3);
      img.set({
        left: canvas.width / 2 - 50,
        top: canvas.height / 2 - 50,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      saveCurrentDesign();
    });
  };
  reader.readAsDataURL(file);
  e.target.value = "";
});

document.getElementById("btnTexto").addEventListener("click", () => {
  const text = new fabric.IText("Texto personalizado", {
    left: canvas.width / 2 - 60,
    top: canvas.height / 2 - 30,
    fill: "#000",
    fontFamily: "Arial",
    fontSize: 24,
  });
  canvas.add(text);
  canvas.setActiveObject(text);
  saveCurrentDesign();
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  const active = canvas.getActiveObject();
  if (active && active !== tshirtBase) {
    canvas.remove(active);
    saveCurrentDesign();
  }
});

// ==================== TEXTO ====================
document.getElementById("textColor").addEventListener("input", (e) => {
  const active = canvas.getActiveObject();
  if (active && active.type === "i-text") {
    active.set("fill", e.target.value);
    canvas.renderAll();
    saveCurrentDesign();
  }
});

document.getElementById("textFont").addEventListener("change", (e) => {
  const active = canvas.getActiveObject();
  if (active && active.type === "i-text") {
    active.set("fontFamily", e.target.value);
    canvas.renderAll();
    saveCurrentDesign();
  }
});

document.getElementById("textSize").addEventListener("input", (e) => {
  const active = canvas.getActiveObject();
  if (active && active.type === "i-text") {
    active.set("fontSize", parseInt(e.target.value));
    canvas.renderAll();
    saveCurrentDesign();
  }
});

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  return (
    "#" +
    result
      .map((x) => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// ==================== PANEL DE COLORES EN MÓVIL ====================

// Crear el panel flotante dinámicamente
const colorPanel = document.createElement("div");
colorPanel.classList.add("color-panel-mobile");
colorPanel.innerHTML = `
  <h3>Selecciona un color</h3>
  <div class="color-options-mobile">
    <div class="color-circle" style="background:#ffffff;" title="Blanco" data-index="0"></div>
    <div class="color-circle" style="background:#800000;" title="Bordo" data-index="1"></div>
    <div class="color-circle" style="background:#ff0000;" title="Rojo" data-index="2"></div>
    <div class="color-circle" style="background:#0000ff;" title="Azul" data-index="3"></div>
    <div class="color-circle" style="background:#00ff00;" title="Verde" data-index="4"></div>
  </div>
  <button id="closeColorPanel" class="close-panel">Cerrar</button>
`;
document.body.appendChild(colorPanel);

// Mostrar/Ocultar panel desde el botón móvil
const colorBtnMobile = document.getElementById("colorBtnMobile");
const closeColorPanel = document.getElementById("closeColorPanel");

colorBtnMobile.addEventListener("click", () => {
  colorPanel.classList.add("show");
});

closeColorPanel.addEventListener("click", () => {
  colorPanel.classList.remove("show");
});

// Reutilizar la misma lógica de cambio de color con fade
const mobileCircles = colorPanel.querySelectorAll(".color-circle");
mobileCircles.forEach((circle) => {
  circle.addEventListener("click", () => {
    const index = parseInt(circle.dataset.index);
    const canvasEl = document.getElementById("tshirtCanvas");
    canvasEl.classList.add("fade-out");

    setTimeout(() => {
      saveCurrentDesign();
      currentTshirtIndex = index;
      loadTshirt();
      restoreDesign(currentTshirtIndex + (isFront ? "" : "_back"));

      canvasEl.classList.remove("fade-out");
      canvasEl.classList.add("fade-in");

      setTimeout(() => {
        canvasEl.classList.remove("fade-in");
      }, 400);
    }, 300);

    colorPanel.classList.remove("show");
  });
});
