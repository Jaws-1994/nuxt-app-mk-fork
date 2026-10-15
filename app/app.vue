<script setup>
  import Loading from "./components/TheLoading.vue"
</script>

<template>
  <h1>CMS</h1>
  <Loading></Loading>
</template>

<style>
  body{

  background: linear-gradient(to top, #6FBAAE, #6EB8AC, #5E9E94 );
  
  /* 2. Empêche absolument le dégradé de se répéter en lignes */
  background-repeat: no-repeat;
  
  /* 3. Force le dégradé à couvrir 100% de la hauteur et largeur */
  background-size: cover;
  background-attachment: fixed; /* Utile si c'est pour le fond d'une page entière */
 }
</style>