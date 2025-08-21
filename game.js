// === Basic Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("gameCanvas"),
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Lighting ===
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// === Controls ===
const controls = new THREE.PointerLockControls(camera, document.body);
document.body.addEventListener("click", () => controls.lock());

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let canJump = false;

// === Keyboard Input ===
const keys = {};
document.addEventListener("keydown", (e) => (keys[e.code] = true));
document.addEventListener("keyup", (e) => (keys[e.code] = false));

// === Load Textures ===
const loader = new THREE.TextureLoader();
const blockTextures = {
  grass: loader.load("textures/grass.png"),
  dirt: loader.load("textures/dirt.png"),
  stone: loader.load("textures/stone.png"),
};

// === Create Block Function ===
function createBlock(type, x, y, z) {
  const material = new THREE.MeshLambertMaterial({ map: blockTextures[type] });
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(x, y, z);
  cube.userData.type = type;
  scene.add(cube);
  return cube;
}

// === Generate Flat World ===
const worldSize = 20;
for (let x = -worldSize; x < worldSize; x++) {
  for (let z = -worldSize; z < worldSize; z++) {
    createBlock("grass", x, 0, z);
    createBlock("dirt", x, -1, z);
    createBlock("stone", x, -2, z);
  }
}

// === Raycasting (for placing/breaking) ===
const raycaster = new THREE.Raycaster();
document.addEventListener("mousedown", (event) => {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    const block = intersects[0].object;
    if (event.button === 0) {
      // left click: break
      scene.remove(block);
    } else if (event.button === 2) {
      // right click: place
      const pos = intersects[0].face.normal.clone().add(block.position);
      createBlock("stone", pos.x, pos.y, pos.z);
    }
  }
});
document.addEventListener("contextmenu", (e) => e.preventDefault()); // prevent right-click menu

// === Movement & Physics ===
const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * delta; // gravity

  direction.z = Number(keys["KeyW"]) - Number(keys["KeyS"]);
  direction.x = Number(keys["KeyD"]) - Number(keys["KeyA"]);
  direction.normalize();

  if (keys["Space"] && canJump) {
    velocity.y = 5;
    canJump = false;
  }

  if (controls.isLocked) {
    velocity.z -= direction.z * 50.0 * delta;
    velocity.x -= direction.x * 50.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    camera.position.y += velocity.y * delta;

    if (camera.position.y < 2) {
      velocity.y = 0;
      camera.position.y = 2;
      canJump = true;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

