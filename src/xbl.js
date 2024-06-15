const { Authflow, Titles } = require("prismarine-auth");
const { v4: uuidv4 } = require("uuid");

const { getCacheFactory } = require("./util.js");
const { userModel } = require("./db.js");

const content_restrictions = "eyJ2ZXJzaW9uIjoyLCJkYXRhIjp7Imdlb2dyYXBoaWNSZWdpb24iOiJVUyIsIm1heEFnZVJhdGluZyI6MjU1LCJwcmVmZXJyZWRBZ2VSYXRpbmciOjI1NSwicmVzdHJpY3RQcm9tb3Rpb25hbENvbnRlbnQiOmZhbHNlfX0";

async function getXboxAuthToken(accountID, relyingParty) {
  const dbUser = await userModel.findOne({ id: accountID }, { id: 1, linkData: 1 });

  let flow = new Authflow(undefined, getCacheFactory(dbUser), {
    flow: "sisu",
    authTitle: Titles.MinecraftAndroid,
    deviceType: "Android",
  },
    (data) => {
      dbUser.didLink = false;
      dbUser.linkData = {};
      dbUser.save();
    },
  );

  let xboxToken = await flow.getXboxToken(relyingParty);

  return `XBL3.0 x=${xboxToken.userHash};${xboxToken.XSTSToken}`;
}

async function getXUID(accountID) {
  const dbUser = await userModel.findOne({ id: accountID }, { id: 1, linkData: 1 });

  let flow = new Authflow(undefined, getCacheFactory(dbUser), {
    flow: "sisu",
    authTitle: Titles.MinecraftPlaystation,
    deviceType: "Android",
  },
    (data) => {
      dbUser.didLink = false;
      dbUser.linkData = {};
      dbUser.save();
    },
  );

  let xboxToken = await flow.getXboxToken();

  return xboxToken.userXUID
}

async function gamertagToXuid(accountID, gamertag) {
  const authToken = await getXboxAuthToken(accountID);

  if (authToken.errorMsg) return authToken;

  const response = await fetch(`https://profile.xboxlive.com/users/gt(${gamertag})/profile/settings`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "Accept-Language": "en-US,en",
      "Authorization": authToken,
      "Content-Type": "application/json; charset=utf-8",
      "User-Agent": "XboxServicesAPI/2021.10.20220301.4 c",
      "x-xbl-contract-version": 2,
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "profile.xboxlive.com",
      "Connection": "Keep-Alive",
      "Cache-Control": "no-cache"
    }
  });

  if (response.status === 404) return null;
  if (response.status !== 200) return { errorMsg: `${response.status} ${response.statusText} ${await response.text()}` };

  const profile = await response.json();

  return profile.profileUsers[0].id;
}

async function getXboxUserData(accountID, xuid) {
  if (!xuid) return;

  const authToken = await getXboxAuthToken(accountID);

  if (authToken.errorMsg) return authToken;

  const response = await fetch(`https://peoplehub.xboxlive.com/users/me/people/xuids(${xuid})/decoration/detail,preferredColor,presenceDetail`, {
    method: "GET",
    headers: {
      "x-xbl-contract-version": 4,
      "Accept-Encoding": "gzip, deflate",
      "Signature": "",
      "Accept": "application/json",
      "User-Agent": "WindowsGameBar/5.823.1271.0",
      "Accept-Language": "en-US",
      "Authorization": authToken,
      "Host": "peoplehub.xboxlive.com",
      "Connection": "Keep-Alive"
    }
  });

  if (response.status === 400) return null;
  if (response.status !== 200) console.log({ errorMsg: `${response.status} ${response.statusText} ${await response.text()}` });

  const user = (await response.json()).people[0];

  user.hexXuid = `000${parseInt(xuid, 10).toString(16).toUpperCase()}`;

  return user;
}

async function getXboxUserDataBulk(accountID, xuids = []) {
  if (xuids.length === 0) return [];

  const authToken = await getXboxAuthToken(accountID);

  if (authToken.errorMsg) return authToken;

  const body = JSON.stringify({ xuids: xuids });

  const response = await fetch("https://peoplehub.xboxlive.com/users/me/people/batch/decoration/detail,presenceDetail", {
    method: "POST",
    headers: {
      "x-xbl-contract-version": 4,
      "Accept-Encoding": "gzip, deflate",
      "Signature": "",
      "Accept": "application/json",
      "User-Agent": "WindowsGameBar/5.823.1271.0",
      "Accept-Language": "en-US",
      "Authorization": authToken,
      "Host": "peoplehub.xboxlive.com",
      "Connection": "Keep-Alive"
    },
    body
  });

  if (response.status !== 200) return { errorMsg: `${response.status} ${response.statusText} ${await response.text()}` };

  const users = (await response.json()).people;

  return users;
}

async function getClubData(accountID, clubID) {
  if (!clubID) return;

  const authToken = await getXboxAuthToken(accountID);

  if (authToken.errorMsg) return authToken;

  const response = await fetch(`https://clubhub.xboxlive.com/clubs/Ids(${clubID})/decoration/clubPresence`, {
    method: "GET",
    headers: {
      "x-xbl-contract-version": 4,
      "Accept-Encoding": "gzip; q=1.0, deflate; q=0.5, identity; q=0.1",
      "x-xbl-contentrestrictions": content_restrictions,
      "Cache-Control": "no-store, must-revalidate, no-cache",
      "Accept": "application/json",
      "X-XblCorrelationId": uuidv4(),
      "PRAGMA": "no-cache",
      "Accept-Language": "en-US, en",
      "Authorization": authToken,
      "Host": "clubhub.xboxlive.com",
      "Connection": "Keep-Alive"
    }
  });

  if (response.status !== 200 && response.status !== 403) {
    return {
      code: `Unable to get club data.\nError: ${response.status} ${response.statusText}`,
      description: ""
    };
  }

  const clubData = await response.json();

  if (clubData.code) return clubData;

  return clubData.clubs[0];
}

module.exports = {
  getXboxAuthToken,
  getXboxUserData,
  getXboxUserDataBulk,
  gamertagToXuid,
  getClubData,
  getXUID
}