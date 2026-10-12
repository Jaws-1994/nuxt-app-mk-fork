import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { pseudo, mail, password } = body;

  if (!pseudo || !mail || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Données manquantes' });
  }

  try {
    // Hachage du mot de passe avec 12 tours, comme dans ton fichier SQL
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      'INSERT INTO users (user_pseudo, user_mail, user_password_hash) VALUES (?, ?, ?)',
      [pseudo, mail, hashedPassword]
    );

    return {
      success: true,
      message: 'Utilisateur créé avec succès',
      userId: result.insertId
    };
  } catch (error) {
    // Code ER_DUP_ENTRY pour les doublons (pseudo ou email déjà utilisé)
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, statusMessage: 'Pseudo ou Email déjà utilisé' });
    }
    throw createError({ statusCode: 500, statusMessage: 'Erreur serveur' });
  }
});