const Mail = require("./models/Mail");

async function addMailToUser(tgId, mail) {
  if (!tgId) throw new Error("tgId is required for mail");

  tgId = tgId.toString();

  if (!/^[0-9]{6,}$/.test(tgId)) {
    throw new Error("Invalid tgId format: " + tgId);
  }

  await Mail.create({
    tgId,
    from: mail.from || "system",
    subject: mail.subject,
    body: mail.body
  });
}

module.exports = { addMailToUser };
