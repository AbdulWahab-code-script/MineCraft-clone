// ====== Three.js Setup ======
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10,20,10);
scene.add(light);

// ====== World ======
const worldSize = 16;
let blocks = [];
let blockMeshes = [];

for(let x=0;x<worldSize;x++){
  blocks[x]=[]; blockMeshes[x]=[];
  for(let y=0;y<worldSize;y++){
    blocks[x][y]=[]; blockMeshes[x][y]=[];
    for(let z=0;z<worldSize;z++){
      if(y===0){
        blocks[x][y][z]=1;
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(),
          new THREE.MeshStandardMaterial({color:0x8B4513})
        );
        cube.position.set(x,y,z);
        scene.add(cube);
        blockMeshes[x][y][z]=cube;
      } else {
        blocks[x][y][z]=0;
        blockMeshes[x][y][z]=null;
      }
    }
  }
}

// ====== Player ======
let player = {x:8, y:2, z:8, yaw:0, pitch:0, speed:0.1, yVelocity:0};
camera.position.set(player.x, player.y, player.z);

let keys={};
document.addEventListener("keydown", e=>keys[e.key.toLowerCase()]=true);
document.addEventListener("keyup", e=>keys[e.key.toLowerCase()]=false);

// Pointer lock for mouse look
document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
document.body.onclick = ()=>document.body.requestPointerLock();
document.addEventListener("mousemove", e=>{
  if(document.pointerLockElement===document.body){
    player.yaw -= e.movementX*0.002;
    player.pitch -= e.movementY*0.002;
    if(player.pitch>Math.PI/2) player.pitch=Math.PI/2;
    if(player.pitch<-Math.PI/2) player.pitch=-Math.PI/2;
  }
});

// ====== Hotbar ======
let hotbar = Array(9).fill().map(()=>({id:1, count:10}));
let selectedIndex=0;
const hotbarDiv=document.getElementById("hotbar");

function renderHotbar(){
  hotbarDiv.innerHTML="";
  for(let i=0;i<9;i++){
    const s=document.createElement("div");
    s.className="slot"+(i===selectedIndex?" selected":"");
    const slot = hotbar[i];
    s.textContent = slot.count>0 ? slot.count : '';
    s.onclick = ()=>{ selectedIndex=i; renderHotbar(); }
    hotbarDiv.appendChild(s);
  }
}
renderHotbar();

// ====== Movement ======
function updatePlayer(){
  let dx=0,dz=0;
  if(keys["w"]){ dx+=Math.sin(player.yaw)*player.speed; dz+=Math.cos(player.yaw)*player.speed; }
  if(keys["s"]){ dx-=Math.sin(player.yaw)*player.speed; dz-=Math.cos(player.yaw)*player.speed; }
  if(keys["a"]){ dx+=Math.sin(player.yaw-Math.PI/2)*player.speed; dz+=Math.cos(player.yaw-Math.PI/2)*player.speed; }
  if(keys["d"]){ dx+=Math.sin(player.yaw+Math.PI/2)*player.speed; dz+=Math.cos(player.yaw+Math.PI/2)*player.speed; }
  player.x+=dx; player.z+=dz;

  // Gravity
  player.yVelocity -= 0.01;
  player.y += player.yVelocity;
  if(player.y<1){ player.y=1; player.yVelocity=0; }

  // Jump
  if(keys[" "]) player.yVelocity=0.2;

  camera.position.set(player.x, player.y, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
}

// ====== Raycast ======
function raycast(){
  const dir = new THREE.Vector3(0,0,-1);
  dir.applyEuler(camera.rotation);
  const raycaster = new THREE.Raycaster(camera.position, dir, 0, 5);
  const intersects = [];
  for(let x=0;x<worldSize;x++)
    for(let y=0;y<worldSize;y++)
      for(let z=0;z<worldSize;z++)
        if(blockMeshes[x][y][z]) intersects.push(blockMeshes[x][y][z]);
  const hits = raycaster.intersectObjects(intersects);
  return hits.length>0?hits[0].object:null;
}

// ====== Mouse Clicks ======
document.addEventListener("mousedown", e=>{
  const block = raycast();
  if(!block) return;
  const pos = block.position;
  if(e.button===0){ // left click = break
    scene.remove(block);
    const brokenBlockId = blocks[pos.x][pos.y][pos.z];

    let slot = hotbar[selectedIndex];
    if(slot.id===0 || slot.id===brokenBlockId){
      slot.id = brokenBlockId;
      slot.count = Math.min(slot.count+1,40);
    } else {
      slot.id = brokenBlockId;
      slot.count = 1;
    }
    renderHotbar();

    blocks[pos.x][pos.y][pos.z]=0;
    blockMeshes[pos.x][pos.y][pos.z]=null;
  }

  if(e.button===2){ // right click = place
    let nx = pos.x, ny = pos.y+1, nz = pos.z;
    if(ny>=worldSize || blockMeshes[nx][ny][nz]) return;
    const slot = hotbar[selectedIndex];
    if(slot.count<=0) return;

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshStandardMaterial({color:0x8B4513})
    );
    cube.position.set(nx,ny,nz);
    scene.add(cube);
    blocks[nx][ny][nz] = slot.id;
    blockMeshes[nx][ny][nz] = cube;

    slot.count--;
    if(slot.count===0) slot.id=0;
    renderHotbar();
  }
});
document.addEventListener("contextmenu", e=>e.preventDefault());

// ====== Game Loop ======
function animate(){
  requestAnimationFrame(animate);
  updatePlayer();
  renderer.render(scene, camera);
}
animate();
