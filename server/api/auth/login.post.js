import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { mail, password } = body || {};

  if (!mail || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email et mot de passe requis' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT ID_user, user_pseudo, user_role, user_score, user_password_hash
       FROM users
       WHERE user_mail = ?`,
      [mail]
    );

    if (rows.length === 0) {
      throw createError({ statusCode: 401, statusMessage: 'Identifiants incorrects' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.user_password_hash);

    if (!isPasswordValid) {
      throw createError({ statusCode: 401, statusMessage: 'Identifiants incorrects' });
    }

    const token = await createSession(user.ID_user);

    return {
      success: true,
      token,
      user: toPublicUser(user)
    };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('Erreur SQL ou Serveur :', error);
    throw createError({ statusCode: 500, statusMessage: 'Erreur serveur' });
  }
});
