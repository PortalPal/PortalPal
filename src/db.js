"use strict";

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: String,
  blacklisted: Boolean,
  verified: Boolean,
  premium: Boolean,
  staff: Boolean,
  didLink: Boolean,
  linkData: Object
});

const realmSchema = new mongoose.Schema({
  id: String,
  isScrapping: Boolean,
  didScrappedXUIDs: Boolean
});

const accountSchema = new mongoose.Schema({
  xuid: String,
  // if user opted out
  hidden: Boolean
});

const user = mongoose.model("User", userSchema);
const realm = mongoose.model("Realm", realmSchema);
const account = mongoose.model("Account", accountSchema);

mongoose.set("strictQuery", true);

mongoose.connect(process.env.DEV_DB_URL)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

function createUserDefaults(data) {
  if (!data.id) throw TypeError("Missing User ID");

  return new user({
    // _id should only be used for backups
    _id: data._id,
    id: data.id,
    blacklisted: data.blacklisted ?? false,
    premium: data.premium ?? false,
    staff: data.staff ?? false,
    didLink: data.didLink ?? false,
    linkData: data.linkData ?? {}
  });
}

function createRealmDefaults(data) {
  if (!data.id) return TypeError("Missing Realm ID");

  return new realm({
    _id: data._id,
    id: data.id,
    isScrapping: data.isScrapping ?? false,
    didScrappedXUIDs: data.didScrappedXUIDs ?? false
  });
}

function createAccountDefaults(data) {
  if (!data.xuid) return TypeError("Missing XUID");

  return new account({
    _id: data._id,
    xuid: data.xuid,
    hidden: data.hidden ?? false
  });
}

module.exports = {
  userModel: user,
  accountsModel: account,
  realmModel: realm,
  createUserDefaults: createUserDefaults,
  createRealmDefaults: createRealmDefaults,
  createAccountDefaults: createAccountDefaults
};