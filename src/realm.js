const { getXboxAuthToken, getXUID } = require("./xbl.js");

const verData = require("../ext/data.json");

const { createAccountDefaults, accountsModel, realmModel, createRealmDefaults } = require("./db.js");

async function getRealms(accountID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch("https://pocket.realms.minecraft.net/worlds", {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response.status !== 200 && response.status !== 403) {
    console.log(
      `Error: ${response.status} ${response.statusText} ${await response.text()}`,
    );
  }

  const { servers } = await response.json();

  await Promise.all(
    servers.map(async (realm) => {
      let realmDB = await realmModel.findOne({ id: realm.id });

      if (!realmDB || !realmDB.didScrappedXUIDs) {
        realmDB = realmDB || createRealmDefaults({ id: realm.id });

        await realmDB.save();

        if (!realmDB.didScrappedXUIDs && !realmDB.isScrapping) getMembers(accountID, realm.id);
      }
    })
  );

  return servers;
}

async function getActivePlayers(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/activities/live/players`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response.status !== 200 && response.status !== 403) {
    console.log(
      `Error: ${response.status} ${response.statusText} ${await response.text()}`,
    );
  }

  const data = await response.json();

  let server;

  await Promise.all(
    data.servers.map(async (realm) => {
      if (realm.id === Number(realmID)) server = realm;
    })
  );

  return server;
}

async function getOwnedRealms(accountID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  const xuid = await getXUID(accountID)

  if (!authToken) return "N/A";

  const response = await fetch("https://pocket.realms.minecraft.net/worlds", {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response.status !== 200 && response.status !== 403) {
    console.log(
      `Error: ${response.status} ${response.statusText} ${await response.text()}`,
    );
  }

  const { servers } = await response.json();

  const ownedRealms = servers.filter((realm) => realm.ownerUUID === xuid);

  await Promise.all(
    servers.map(async (realm) => {
      let realmDB = await realmModel.findOne({ id: realm.id });

      if (!realmDB || !realmDB.didScrappedXUIDs) {
        realmDB = realmDB || createRealmDefaults({ id: realm.id });

        await realmDB.save();

        if (!realmDB.didScrappedXUIDs && !realmDB.isScrapping) getMembers(accountID, realm.id);
      }
    })
  );

  return ownedRealms;
}

async function inviteUser(accountID, realmID, xuids, type) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const invites = {};

  for (const xuid of xuids) {
    invites[xuid] = type;
  }

  const body = JSON.stringify({ invites });

  const response = await fetch(`https://pocket.realms.minecraft.net/invites/${realmID}/invite/update`, {
    method: "PUT",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "content-length": body.length,
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
    body
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  return response.status;
}

async function setRealmInfo(accountID, realmID, realmName = "", motd = "") {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const body = JSON.stringify({ name: realmName, description: motd });

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/`, {
    method: "POST",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
    body
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 204) {
    return { status: response.status, text: response.statusText };
  }

  return response.status;
}

async function banPlayer(accountID, realmID, xuid) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/blocklist/${xuid}`, {
    method: "POST",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  return response.status;
}

async function unbanPlayer(accountID, realmID, xuid) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/blocklist/${xuid}`, {
    method: "DELETE",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  return response.status;
}

async function getRealmCode(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/links/v1?worldId=${realmID}`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  const data = await response.json();

  return data[0];
}

async function getStorySettings(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/stories/settings`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  const data = await response.json();

  return data;
}

async function getPlaytime(accountID, realmID, xuid) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://frontend.realms.minecraft-services.net/api/v1.0/worlds/${realmID}/stories/playeractivity`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "frontend.realms.minecraft-services.net",
      "Connection": "Keep-Alive"
    },
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  const data = await response.json();

  let dates = [];

  dates = Object.keys(data.result.activity[xuid]).map(key => data.result.activity[xuid][key]);

  return dates;
}

async function postStorySettings(accountID, realmID, notifications, autostories, coordinates, timeline, /* inGameChatMessages, */ opt) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (typeof opt === "boolean" && !opt) opt = "OPT_IN";
  if (typeof opt === "boolean" && opt) opt = "OPT_OUT";

  if (!authToken) return "N/A";

  const body = JSON.stringify({
    notifications, // Badge Notifications
    autostories, // Realm Events
    coordinates, // Realm Event Coordinates
    timeline, // Timeline
    // inGameChatMessages, // In Game Chat Messages (Unused)
    playerOptIn: opt, // OPT_IN OR OPT_OUT
    realmOptIn: opt // OPT_IN OR OPT_OUT
  })

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/stories/settings`, {
    method: "POST",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "content-length": body.length,
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
    body
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200 && response?.status !== 204) {
    return { status: response.status, text: response.statusText };
  }

  return response.status;
}

async function resetRealmCode(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const body = JSON.stringify({ type: "INFINITE", worldId: realmID });

  const response = await fetch(`https://pocket.realms.minecraft.net/links/v1`, {
    method: "POST",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "content-length": body.length,
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
    body
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  const data = await response.json();

  return data;
}

async function changeUserPermission(accountID, realmID, xuid, permission) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/")

  if (!authToken) return "N/A";

  const body = JSON.stringify({ permission, xuid });

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/userPermission`, {
    method: "PUT",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "content-length": body.length,
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    },
    body
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 204) {
    return { status: response.status, text: response.statusText };
  }

  return response.status;
}

async function getBlacklist(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/blocklist`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    }
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  const data = await response.json();

  return data;
}

async function closeRealm(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/close`, {
    method: "PUT",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "content-length": 0,
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    }
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  const data = await response.json();

  return data;
}

async function openRealm(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/open`, {
    method: "PUT",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "content-length": 0,
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    }
  }).catch((error) => {
    if (error) {
      console.log("Failed to send request.");
    }
  });

  if (response?.status !== 200) {
    return { status: response.status, text: response.statusText };
  }

  const data = await response.json();

  return data;
}

async function resetPendingInvites(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    }
  });

  if (response.status !== 200 && response.status !== 403) {
    console.log(
      `Error: ${response.status} ${response.statusText} ${await response.text()}`,
    );
    return;
  }

  const realm = await response.json();

  const pendingInvites = realm.players.filter(player => !player.accepted).map(player => player.uuid);

  if (pendingInvites.length > 0) await inviteUser(accountID, realmID, pendingInvites, "REMOVE");
}

async function getRealmInfo(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    }
  });

  if (response.status !== 200 && response.status !== 403) {
    console.log(
      `Error: ${response.status} ${response.statusText} ${await response.text()}`,
    );
    return;
  }

  let realm = await response.json();

  const pendingInvites = realm.players.filter(player => !player.accepted).map(player => player.uuid);
  const members = realm.players.filter(player => player.accepted).map(player => player.uuid);

  realm.pendingInvites = pendingInvites;
  realm.members = members;

  return realm
}

async function getRealmIP(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}/join`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    }
  });

  if (response.status !== 200 && response.status !== 403 && response.status !== 503) {
    console.log(
      `Error: ${response.status} ${response.statusText} ${await response.text()}`,
    );
    return;
  }

  if (response.status === 503) return "offline";

  let data = await response.json();

  return data
}

async function getMembers(accountID, realmID) {
  const authToken = await getXboxAuthToken(accountID, "https://pocket.realms.minecraft.net/");

  if (!authToken) return "N/A";

  const response = await fetch(`https://pocket.realms.minecraft.net/worlds/${realmID}`, {
    method: "GET",
    headers: {
      "Accept": "*/*",
      "authorization": authToken,
      "charset": "utf-8",
      "client-ref": verData.hash,
      "client-version": verData.version,
      "x-clientplatform": "Android",
      "x-networkprotocolversion": verData.protocol,
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      "Host": "pocket.realms.minecraft.net",
      "Connection": "Keep-Alive"
    }
  }).catch(() => { });

  if (response.status !== 200 && response.status !== 403) {
    console.log(
      `Error: ${response.status} ${response.statusText} ${await response.text()}`,
    );
  }

  const realm = await response.json();

  console.log(`Getting ${realm.players.length} from ${realm.name} (${realm.id})`);

  let realmDB = await realmModel.findOne({ id: realm.id });

  realmDB.isScrapping = true;

  await realmDB.save();

  for (let i = 0; i < realm.players.length; i++) {
    const player = realm.players[i];

    let playerAccount = await accountsModel.findOne({ xuid: player.uuid }).lean();

    if (playerAccount?.xuid === player.uuid) continue;

    if (!playerAccount || typeof playerAccount === "null") playerAccount = createAccountDefaults({ xuid: player.uuid });

    await playerAccount.save();

    if (realm.players.length == i + 1) {
      realmDB.isScrapping = false;
      break;
    }
  }

  realmDB.didScrappedXUIDs = true;

  await realmDB.save();

  console.log(`Scrapped all XUIDs from ${realm.name} (${realm.id})`);
}

module.exports = {
  getRealms,
  getOwnedRealms,
  getActivePlayers,
  getRealmIP,
  getRealmInfo,
  setRealmInfo,
  getRealmCode,
  closeRealm,
  openRealm,
  resetRealmCode,
  getBlacklist,
  banPlayer,
  unbanPlayer,
  inviteUser,
  resetPendingInvites,
  changeUserPermission,
  getStorySettings,
  postStorySettings,
  getPlaytime
};