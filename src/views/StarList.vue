<template>
  <div ref="container" class="star-map-container">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Chargement des étoiles...</p>
    </div>
    <div v-if="selectedStar" id="star-popup">
      <h3>{{ selectedStar.proper || 'Étoile inconnue' }}</h3>
      <p>ID: {{ selectedStar.id }}</p>
      <p>Magnitude: {{ selectedStar.mag }}</p>
      <p>Distance: {{ selectedStar.dist }} parsecs</p>
      <p>Type spectral: {{ selectedStar.spect || 'Non spécifié' }}</p>
    </div>
  </div>
  <div>
    <button id="popup-button" @click="closePopup">Fermer</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const container = ref(null);
const stars = ref([]);
const loading = ref(true);
const selectedStar = ref(null);

let scene, camera, renderer, controls, starField, raycaster, mouse;

const fetchStars = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/stars');
    stars.value = await response.json();
    initThreeJS();
  } catch (error) {
    console.error('There was an error fetching the stars:', error);
  } finally {
    loading.value = false;
  }
};

const initThreeJS = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
  container.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Création des étoiles
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.02,
    sizeAttenuation: true
  });

  const starsVertices = [];
  const starsColors = [];

  stars.value.forEach((star, index) => {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    starsVertices.push(x, y, z);

    // Couleur basée sur la température (type spectral)
    const color = getStarColor(star.spect);
    starsColors.push(color.r, color.g, color.b);
  });

  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));

  starsMaterial.vertexColors = true;

  starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);

  camera.position.z = 5;

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  animate();

  // Ajout de l'événement de clic
  container.value.addEventListener('click', onStarClick);
};

const getStarColor = (spectralType) => {
  // Vérification si le type spectral est défini
  if (!spectralType || typeof spectralType !== 'string') {
    return new THREE.Color(0xffffff); // Couleur par défaut si le type spectral n'est pas défini
  }

  // Logique pour déterminer la couleur de l'étoile basée sur son type spectral
  if (spectralType.startsWith('O')) return new THREE.Color(0x9bb0ff);
  if (spectralType.startsWith('B')) return new THREE.Color(0xaabfff);
  if (spectralType.startsWith('A')) return new THREE.Color(0xcad7ff);
  if (spectralType.startsWith('F')) return new THREE.Color(0xfbf8ff);
  if (spectralType.startsWith('G')) return new THREE.Color(0xfff4e8);
  if (spectralType.startsWith('K')) return new THREE.Color(0xffddb4);
  if (spectralType.startsWith('M')) return new THREE.Color(0xffbd6f);
  return new THREE.Color(0xffffff); // Couleur par défaut si le type ne correspond à aucun connu
};

const onStarClick = (event) => {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(starField);

  if (intersects.length > 0) {
    const index = intersects[0].index;
    selectedStar.value = stars.value[index];
  }
};

const closePopup = () => {
  selectedStar.value = null;
};

const handleResize = () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

onMounted(() => {
  fetchStars();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (container.value) {
    container.value.removeEventListener('click', onStarClick);
  }
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
});
</script>

<style scoped>
.star-map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 1.2rem;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

#star-popup {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

#popup-button {
  position: absolute;
  bottom: 0;
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

</style>