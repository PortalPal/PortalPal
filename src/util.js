"use strict";

const { userModel } = require("./db.js");
const axios = require('axios');
const cheerio = require('cheerio');

function getCacheFactory(dbUser) {
  if (!dbUser.linkData) dbUser.linkData = {};

  class CacheFactory {
    async getCached() {
      return dbUser.linkData;
    }
    async setCached(value) {
      dbUser.linkData = value || {};

      try {
        await dbUser.save();
      } catch {
        dbUser = await userModel.findOne({ id: dbUser.id });
        
        dbUser.linkData = value || {};

        await dbUser.save();
      }
    }
    async setCachedPartial(value) {
      dbUser.linkData = {
        ...dbUser.linkData,
        ...value
      };

      try {
        await dbUser.save();
      } catch {
        dbUser = await userModel.findOne({ id: dbUser.id });

        dbUser.linkData = {
          ...dbUser.linkData,
          ...value
        };

        await dbUser.save();
      }
    }
  }
  return function () { return new CacheFactory(); };
}

function generateRandomString(length, characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-") {
	if (!length) return;

	const charArray = Array.from(characters);

	let result = "";

	for (let i = 0; i < length; i++) {
		result += charArray[Math.floor(Math.random() * charArray.length)];
	}

	return result;
}

async function getProtocolVersion() {
  const response = await axios.get(`https://itunes.apple.com/lookup?bundleId=com.mojang.minecraftpe&time=${Date.now()}`);
  const versionData = response.data;

  const version = versionData.results[0].version;

  const response2 = await axios.get(`https://minecraft.wiki/w/Bedrock_Edition_${version}`);
  const $ = cheerio.load(response2.data);
  const text = $('p').text();
  const protocolVersion = text.match(/\b\d{3}\b/g)[0];

  return protocolVersion;
}

async function getGameVersion() {
  const response = await axios.get(`https://itunes.apple.com/lookup?bundleId=com.mojang.minecraftpe&time=${Date.now()}`);
  const versionData = response.data;

  const version = versionData.results[0].version;

  return version;
}

async function getHash() {
  const response = await axios.get("https://raw.githubusercontent.com/Bedrock-OSS/BDS-Versions/main/versions.json");
  const version = response.data.windows.stable;

  const bds = await axios.get(`https://raw.githubusercontent.com/Bedrock-OSS/BDS-Versions/main/windows/${version}.json`);
  const data = bds.data;

  return data.commit_hash;
}

module.exports = {
  getCacheFactory,
  getProtocolVersion,
  getGameVersion,
  getHash,
  generateRandomString
}