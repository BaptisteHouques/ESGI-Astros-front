<template>
  <div v-if="star">
    <h2>{{ star.name }}</h2>
    <p>Constellation: {{ star.constellation }}</p>
    <!-- Ajout d'un paragraphe pour afficher des informations supplémentaires sur la constellation -->
    <p>Constellation Details: {{ constellationDetails }}</p>
    <p><button @click="fetchConstellation">View Constellation</button></p>
  </div>
  <div v-else>
    <p>Loading...</p>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    const star = ref(null);
    const constellationDetails = ref(""); // Stocke les informations sur la constellation

    const fetchStarDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/stars/${route.params.id}`);
        star.value = await response.json();
      } catch (error) {
        console.error('Error fetching star details:', error);
      }
    };

    // Définition de fetchConstellation pour récupérer des informations sur la constellation
    const fetchConstellation = async () => {
      try {
        if (star.value && star.value.constellation) {
          const response = await fetch(`http://localhost:3000/api/stars/${route.params.id}/constellation`);
          const data = await response.json();
          constellationDetails.value = data.constellation ? data.constellation : "No detailed info available.";
        }
      } catch (error) {
        console.error('Error fetching constellation details:', error);
        constellationDetails.value = "Failed to load constellation details.";
      }
    };

    onMounted(fetchStarDetails);

    return { star, constellationDetails, fetchConstellation };
  }
}
</script>
