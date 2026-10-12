import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { mail, password } = body;

  if (!mail || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email et mot de passe requis' });
  }

  try {
    console.log("--- TENTATIVE DE LOGIN ---");
    console.log("Email reçu depuis Insomnia :", mail);
    console.log("Mot de passe reçu :", password);

    const [rows] = await pool.query('SELECT * FROM users WHERE user_mail = ?', [mail]);
    
    if (rows.length === 0) {
      console.log("ÉCHEC : Aucun utilisateur trouvé en BDD pour cet email.");
      // On change temporairement le message pour savoir que c'est l'email qui bloque
      throw createError({ statusCode: 401, statusMessage: 'Email introuvable' }); 
    }

    const user = rows[0];
    console.log("SUCCÈS : Utilisateur trouvé en BDD :", user.user_pseudo);
    console.log("Hash en BDD :", user.user_password_hash);

    const isPasswordValid = await bcrypt.compare(password, user.user_password_hash);
    
    if (!isPasswordValid) {
      console.log("ÉCHEC : Le bcrypt.compare a retourné false.");
      // On change temporairement le message pour savoir que c'est le mot de passe qui bloque
      throw createError({ statusCode: 401, statusMessage: 'Mot de passe incorrect' });
    }

    console.log("SUCCÈS : Mot de passe valide !");
    return {
      success: true,
      user: {
        id: user.ID_user,
        pseudo: user.user_pseudo,
        role: user.user_role,
        score: user.user_score
      }
    };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error("Erreur SQL ou Serveur :", error);
    throw createError({ statusCode: 500, statusMessage: 'Erreur serveur' });
  }
});