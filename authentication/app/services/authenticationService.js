/**
 * Le fichier contenant les traitements liés à l'authentification.
 * @author GAURE Warren
 * @version 4.2
*/

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const os = require('os');
const osUtils = require('os-utils');
const fs = require('fs')
const User = require('../models/userModel');
const connection = require('../db/mySQLConnector');

const logsPath = __dirname.replace('app/services', 'connectionLogs.txt');

/**
 * Fonction permettant de créér un client ou un livreur dans la base de données.
 * @param {String} email - L'email du client / livreur.
 * @param {String} password - Le mot de passe du client / livreur.
 * @param {String} userType - Le type de l'utilisateur ("CLIENT" ou "LIVREUR").
 * @param {String} firstName - Le prénom du client / livreur .
 * @param {String} lastName - Le nom du client / livreur.
 * @param {String} address - L'addresse du client / livreur.
 * @param {String} phoneNumber - Le numéro de téléphone du client / livreur.
 * @param {String} refreshToken - Le token de rafraîchissement du client / livreur.
 * @returns {object} Le client / livreur en question, ou false si rien n'a été créé.
*/
const createClientOrDeliverer = async (email, password, userType, firstName, lastName, address, phoneNumber, refreshToken) => {
    try {

        
        // Generate a random referral code
        const referralCode = (Math.random() + 1).toString(36).substring(2);

        // Construct the SQL query
        const sql = "INSERT INTO users (firstName, lastName, email, password, phoneNumber, userType, address, referralCode, isSuspended, refreshToken) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const values = [firstName, lastName, email, password, phoneNumber, userType, address, referralCode, false, refreshToken];

        // Execute the query
        await new Promise((resolve, reject) => {
            connection.query(sql, values, (error, results) => {
                if (error) {
                    reject(new Error("Error while trying to create a client/deliverer in the database: " + error.message));
                } else {
                    resolve(results);
                }
            });
        });
        // Return the created user object
        return {
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            userType,
            address,
            referralCode,
            isSuspended: false
        };
    } catch (error) {
        throw new Error(`Error while trying to create a ${userType}`);
    }
};


/**
 * Fonction permettant de créer un restaurateur dans la base de données.
 * @param {String} email - L'email du restaurateur.
 * @param {String} password - Le mot de passe du restaurateur.
 * @param {String} userType - Le type de l'utilisateur ("RESTAURATEUR").
 * @param {String} phoneNumber - Le numéro de téléphone du restaurateur.
 * @param {String} refreshToken - Le token de rafraîchissement du restaurateur.
 * @returns {object} Le restaurateur en question, ou false si rien n'a été créé.
*/
const createRestaurateur = async (email, password, userType, phoneNumber, refreshToken) => {
    try {

        // Construct the SQL query
        const sql = "INSERT INTO users (email, password, phoneNumber, userType, isSuspended, refreshToken) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [email, password, phoneNumber, userType, false, refreshToken];

        // Execute the query
        await new Promise((resolve, reject) => {
            connection.query(sql, values, (error, results) => {
                if (error) {
                    reject(new Error("Error while trying to create a restaurateur in the database: " + error.message));
                } else {
                    resolve(results);
                }
            });
        });

        // Return the created user object
        return {
            email,
            password,
            phoneNumber,
            userType,
            isSuspended: true,
        };
    } catch (error) {
        throw new Error(`Error while trying to create a restaurateur`);
    }
};


/**
 * Fonction permettant de créer un développeur tiers dans la base de données.
 * @param {String} email - L'email du développeur.
 * @param {String} password - Le mot de passe du développeur.
 * @param {String} userType - Le type de l'utilisateur ("DEVELOPPEUR TIERS").
 * @param {String} phoneNumber - Le numéro de téléphone du développeur.
 * @param {String} refreshToken - Le token de rafraîchissement du développeur.
 * @returns {object} Le développeur en question, ou false si rien n'a été créé.
 */
// TODO : Modifier la méthode pour générer la clé de sécurité et l'ajouter
const createDeveloper = async (email, password, userType, phoneNumber, refreshToken) => {
    try {
        const apiKey = generateApiKey();
        // Construct the SQL query
        const sql = "INSERT INTO users (email, password, phoneNumber, userType, isSuspended, refreshToken, apiKey) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const values = [email, password, phoneNumber, userType, false, refreshToken, apiKey];

        // Execute the query
        await new Promise((resolve, reject) => {
            connection.query(sql, values, (error, results) => {
                if (error) {
                    reject(new Error("Error while trying to create a developer in the database: " + error.message));
                } else {
                    resolve(results);
                }
            });
        });
        userID = await findUserIDByEmail(email).userID;
        console.log("user ", userID);
        // Return the created user object
        return {
            email,
            password,
            phoneNumber,
            userType,
            refreshToken,
            apiKey,
            userID
        };
    } catch (error) {
        throw new Error(`Error while trying to create a developer`);
    }
};


/**
 * Fonction permettant de récupérer un utilsateur depuis la base de données grâce à son email.
 * @param {string} email - L'addresse email de l'utilisateur à récupérer.
 * @returns {object} L'utilisateur en question, ou false si rien n'a été trouvé.
*/
const findUserByEmail = async (email) => {
    try {
        // Construct the SQL query
        const sql = `SELECT * FROM users WHERE email = ?`;
        const values = [email];

        // Execute the query
        const [user] = await new Promise((resolve, reject) => {
            connection.query(sql, values, (error, results) => {
                if (error) {
                    reject(new Error("Error while trying to find user by email: " + error.message));
                } else {
                    resolve(results);
                }
            });
        });

        return user;
    } catch (error) {
        throw new Error("Error while trying to find user by email : " + error.message);
    }
};

/**
 * Fonction permettant de récupérer un utilsateur depuis la base de données grâce à son email.
 * @param {string} email - L'addresse email de l'utilisateur à récupérer.
 * @returns {object} L'utilisateur en question, ou false si rien n'a été trouvé.
*/
const findUserIDByEmail = async (email) => {
    try {
        // Construct the SQL query
        const sql = `SELECT userID FROM users WHERE email = ?`;
        const values = [email];

        // Execute the query
        const [user] = await new Promise((resolve, reject) => {
            connection.query(sql, values, (error, results) => {
                if (error) {
                    reject(new Error("Error while trying to find user by email: " + error.message));
                } else {
                    resolve(results);
                }
            });
        });
        console.log("1", userID);
        return userID;
    } catch (error) {
        throw new Error("Error while trying to find user by email : " + error.message);
    }
};


/**
 * Fonction permettant de crypter le mot de passe entré par l'utilisateur.
 * @param {String} password - Le mot de passe à crypter.
 * @returns {String} Le mot de passe crypté.
*/
const encryptPassword = async(password) => {
    const newPassword = await bcrypt.hash(password + process.env.PEPPER_STRING, 10);

    return newPassword;
}

/**
 * Fonction permettant de vérifier si le mot de passe de l'utilisateur est correct.
 * @param {String} password - Le mot de passe de l'utilisateur dans la base de données.
 * @param {String} passwordToVerify - Le mot de passe à vérifier.
 * @returns {boolean} True si le mot de passe est correct, sinon une erreur est lancée.
*/
const comparePassword = async (password, passwordToVerify) => {
    const isPasswordCorrect = await bcrypt.compare(passwordToVerify + process.env.PEPPER_STRING, password);

    if (!isPasswordCorrect) {
        throw new Error("Invalid password");
    }

    return isPasswordCorrect;
};

/**
 * Fonction permettant de générer un JSON Web Token d'accès destiné à l'utilisateur.
 * @param {Number} userID - L'ID de l'utilisateur.
 * @param {String} userType - Le type de l'utilisateur (client, livreur, restaurateur, etc...).
 * @returns {token} Le JSON Web Token d'accès.
*/
const generateAccessToken = (userID, userType) => {
    const token = jwt.sign({ id : userID, type : userType }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    
    return token;
};

/**
 * Fonction permettant de générer un JSON Web Token de rafraîchissement destiné à l'utilisateur.
 * @param {String} email - L'email de l'utilisateur.
 * @returns {token} Le JSON Web Token de rafraîchissement.
 */
const generateRefreshToken = (email) => {
    const token = jwt.sign({ email: email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    return token;
};

/**
 * Fonction permettant de décoder le token de rafraîchissement pour récupérer l'email.
 * @param {String} refreshToken - Le token de rafraîchissement à décoder.
 * @returns {String} L'email contenu dans le token de rafraîchissement.
 */
const decodeRefreshToken = (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        return decoded.email;
    }
    catch (error) {
        throw new Error("Error while decoding refresh token : " + error.message);
    }
};

/**
 * Fonction permettant de vérifier le token de rafraîchissement de l'utilisateur.
 * @param {String} refreshToken - Le token de rafraîchissement à vérifier.
 * @returns {String} Le token de rafraîchissement de l'utilisateur.
*/
const verifyRefreshToken = (refreshToken) => {
    return new Promise((resolve, reject) => {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) {
                reject("Invalid refresh token");
            }
            else if (!decoded || !decoded.exp || decoded.exp < Date.now() / 1000){
                reject("Expired refresh token");
            }
            else {
                resolve(decoded);
            }
        });
    });
};

/**
 * Fonction permettant de mettre à jour le token de rafraîchissement de l'utilisateur.
 * @param {String} email - L'email de l'utilisateur.
 * @param {String} refreshToken - Le nouveau token de rafraîchissement.
*/
const updateRefreshToken = async (email, refreshToken) => {
    try {
        await User.updateOne({ email }, { refreshToken });
    }
    catch (error) {
        throw new Error("Error while trying to update refresh token : " + error.message);
    }
};

/**
 * Fonction permettant de récupérer les métriques de performance de l'application, à savoir :
 * - CPU usage (usage du CPU)
 * - Total memory (mémoire totale)
 * - Free memory (mémoire inutilisée)
 * - Used memory (mémoire utilisée)
 * - Elapsed time (temps de réponse)
 * @returns {object} Un objet contenant les métriques de performance de l'application.
*/
const getPerformanceMetrics = async () => {
    const startTime = Date.now();

    const cpuUsage = await getCpuUsage();
    
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    return {
        cpuUsage: `${cpuUsage}%`,
        totalMemory: `${(totalMemory / (1024 * 1024)).toFixed(2)} Mo`,
        freeMemory: `${(freeMemory / (1024 * 1024)).toFixed(2)} Mo`,
        usedMemory: `${(usedMemory / (1024 * 1024)).toFixed(2)} Mo`,
        elapsedTime: `${elapsedTime} ms`
    }
};

/**
 * Fonction permettant de retourner le taux d'utilisation du CPU.
 * @returns Le taux d'utilisation du CPU.
*/
function getCpuUsage() {
    return new Promise((resolve) => {
        osUtils.cpuUsage((usage) => {
            resolve((usage * 100).toFixed(2));
        });
    });
};

/**
 * Fonction permettant d'écrire les logs dans un fichier.
 * @param {Number} useCase - Le cas d'utilisation à logger.
 * Cas possibles :
 * - 1 : Connexion réussie
 * - 2 : Connexion échouée (email incorrect)
 * - 3 : Connexion échouée (mot de passe incorrect)
 * - 4 : Connexion echouée (compte suspendu)
 * - 5 : Première connexion
 * - 6 : Connexion après rafraîchissement du token
 * - 7 : Déconnexion
 * @param {Number} id - L'id de l'utilisateur.
 * @param {String} type - Le type de l'utilisateur.
*/
const writeLogs = async (useCase, id, type) => {
    const currentDate = new Date();
    const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
    const localDate = new Date(currentDate.getTime() - timezoneOffset);
    localDate.setHours(localDate.getHours() + 2);
    let logMessage = `[${localDate.toLocaleString('fr-FR')}] `;

    switch (useCase) {
        case 1: {
            logMessage = logMessage + `User n°${id} (${type}) logged in\n`;
            break;
        }
        case 2: {
            logMessage = logMessage + `User tried to log in with incorrect email\n`;
            break;
        }
        case 3: {
            logMessage = logMessage + `User n°${id} (${type}) tried to log in with incorrect password\n`;
            break;
        }
        case 4: {
            logMessage = logMessage + `User n°${id} (${type}) tried to log in while being suspended\n`;
            break;
        }
        case 5: {
            logMessage = logMessage + `User n°${id} (${type}) logged in for the first time\n`;
            break;
        }
        case 6: {
            logMessage = logMessage + `User n°${id} (${type}) logged in after refreshing their token\n`;
            break;
        }
        case 7: {
            logMessage = logMessage + `User n°${id} (${type}) logged out\n`;
            break;
        }
        default: {
            break;
        }
    }

    fs.appendFile(logsPath, logMessage, { flag: 'a+' }, (error) => {
        if (error) {
            console.error("Error while writing logs : ", error);
        }
    });
}

/**
 * Fonction permettant de récupérer le contenu du fichier de logs de connexion.
 * @returns {String} Le contenu du fichier de logs.
*/
const getLogs = () => {
    const logsContent = fs.readFileSync(logsPath, 'utf8');
    return logsContent.split('\n');
}

/**
 * Fonction permettant de générer une clé d'API aléatoire.
 * @returns {string} La clé d'API générée.
 */
function generateApiKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let apiKey = '';
    for (let i = 0; i < 38; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        apiKey += characters.charAt(randomIndex);
    }
    return apiKey;
}

module.exports = {
    createClientOrDeliverer,
    createRestaurateur,
    createDeveloper,
    findUserByEmail,
    findUserIDByEmail,
    encryptPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    decodeRefreshToken,
    verifyRefreshToken,
    updateRefreshToken,
    getPerformanceMetrics,
    writeLogs,
    getLogs
};