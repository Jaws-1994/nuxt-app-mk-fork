export default defineEventHandler(async (event) => {
  try {
    const user = await getSessionUser(event);

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Non authentifié' });
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('Erreur SQL ou Serveur :', error);
    throw createError({ statusCode: 500, statusMessage: 'Erreur serveur' });
  }
});
