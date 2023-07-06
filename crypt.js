require("dotenv").config();
const crypto = require("crypto");

// Encryption function
function encryptData(data) {
  const cipher = crypto.createCipheriv(
    process.env.CIPHER_ALGO,
    Buffer.from(process.env.CIPHER_KEY, "hex"),
    process.env.CIPHER_IV
  );
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Decryption function
function decryptData(encryptedData) {
  const decipher = crypto.createDecipheriv(
    process.env.CIPHER_ALGO,
    Buffer.from(process.env.CIPHER_KEY, "hex"),
    process.env.CIPHER_IV
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = {
  encryptData,
  decryptData,
};
