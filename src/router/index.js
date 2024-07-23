import { createRouter, createWebHistory } from 'vue-router'
import StarList from "@/views/StarList.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'StarList',
      component: StarList
    },
  ]
})

export default router
