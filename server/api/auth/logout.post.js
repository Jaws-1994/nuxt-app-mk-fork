export default defineEventHandler(async (event) => {
  try {
    await destroySession(event);

    return {
      success: true,
      message: 'Déconnexion réussie'
    };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('Erreur SQL ou Serveur :', error);
    throw createError({ statusCode: 500, statusMessage: 'Erreur serveur' });
  }
});
