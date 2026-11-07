// Shared logic: the draw, rule checks, and link encoding.
(function () {
  "use strict";

  // ---- People & rules ------------------------------------------------

  function flattenPeople(config) {
    const people = [];
    config.groups.forEach((g) => {
      g.members.forEach((m) => {
        people.push({ name: m.name.trim(), role: m.role, groupId: g.id, groupName: g.name });
      });
    });
    return people;
  }

  function validateConfig(config) {
    const errors = [];
    const seen = new Set();
    flattenPeople(config).forEach((p) => {
      const key = p.name.toLowerCase();
      if (!p.name) errors.push(`Someone in ${p.groupName} has no name.`);
      else if (seen.has(key)) errors.push(`The name "${p.name}" is used twice — names must be unique.`);
      seen.add(key);
    });
    return errors;
  }

  // Returns a reason string if giver may NOT draw receiver, otherwise null.
  function blockedReason(giver, receiver, rules) {
    if (giver.name === receiver.name) return "self";
    const sameFamily = giver.groupId === receiver.groupId;
    if (!sameFamily) return null;
    if (giver.role === "child" && receiver.role === "parent") return "child drew own parent";
    if (giver.role === "parent" && receiver.role === "parent") return "parent drew spouse";
    if (rules.noParentDrawsOwnChild && giver.role === "parent" && receiver.role === "child")
      return "parent drew own child";
    if (rules.noSiblings && giver.role === "child" && receiver.role === "child")
      return "siblings drew each other";
    return null;
  }

  // Checks a full set of assignments: [{giver, receiver}] using person objects.
  function checkAssignments(people, pairs, rules) {
    const problems = [];
    const givers = new Set(), receivers = new Set();
    const byGiver = new Map();
    pairs.forEach(({ giver, receiver }) => {
      givers.add(giver.name);
      receivers.add(receiver.name);
      byGiver.set(giver.name, receiver.name);
      const r = blockedReason(giver, receiver, rules);
      if (r) problems.push(`${giver.name} → ${receiver.name}: ${r}`);
    });
    if (givers.size !== people.length) problems.push("Not everyone is giving a gift.");
    if (receivers.size !== people.length) problems.push("Not everyone is receiving a gift.");
    if (rules.noMutualPairs) {
      pairs.forEach(({ giver, receiver }) => {
        if (byGiver.get(receiver.name) === giver.name && giver.name < receiver.name)
          problems.push(`${giver.name} and ${receiver.name} drew each other`);
      });
    }
    return problems;
  }

  // ---- The draw ------------------------------------------------------

  function secureRandomInt(max) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % max;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Everyone gives exactly one gift and receives exactly one gift.
  // Uses "shuffle until valid", which makes every valid outcome equally likely.
  // If the rules are very strict, that gets slow, so we fall back to a
  // randomized search that still gives a valid (but not perfectly even) draw.
  function draw(config, maxTries = 50000) {
    const people = flattenPeople(config);
    const rules = config.rules || {};
    for (let t = 0; t < maxTries; t++) {
      const receivers = shuffle(people);
      const pairs = people.map((giver, i) => ({ giver, receiver: receivers[i] }));
      if (checkAssignments(people, pairs, rules).length === 0) return { people, pairs };
    }
    const pairs = searchDraw(people, rules);
    if (pairs) return { people, pairs };
    throw new Error(
      "Couldn't find a draw that follows all the rules. Try turning off one of the optional rules in config.js."
    );
  }

  // Randomized backtracking: most-restricted givers first, receivers in random order.
  function searchDraw(people, rules) {
    const allowed = new Map(people.map((g) => [g.name,
      people.filter((r) => !blockedReason(g, r, rules))]));
    const givers = shuffle(people).sort((a, b) => allowed.get(a.name).length - allowed.get(b.name).length);
    const taken = new Set();
    const assigned = new Map();
    let steps = 0;
    function go(i) {
      if (++steps > 2e6) return false;
      if (i === givers.length) return true;
      const g = givers[i];
      for (const r of shuffle(allowed.get(g.name))) {
        if (taken.has(r.name)) continue;
        if (rules.noMutualPairs && assigned.get(r.name) === g.name) continue;
        taken.add(r.name); assigned.set(g.name, r.name);
        if (go(i + 1)) return true;
        taken.delete(r.name); assigned.delete(g.name);
      }
      return false;
    }
    if (!go(0)) return null;
    const byName = new Map(people.map((p) => [p.name, p]));
    return people.map((g) => ({ giver: g, receiver: byName.get(assigned.get(g.name)) }));
  }

  // ---- Links ----------------------------------------------------------
  // Each family's picks are stored *inside* their link (after the #), lightly
  // scrambled so they can't be read just by glancing at the URL.
  // This keeps honest people honest; it is not real encryption.

  const KEY = "ho-ho-ho-no-peeking";

  function toBase64Url(bytes) {
    let s = "";
    bytes.forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function fromBase64Url(str) {
    const s = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(s, (c) => c.charCodeAt(0));
  }
  // A random 4-byte "salt" at the front makes every link look totally different.
  function scramble(bytes, salt) {
    const k = new TextEncoder().encode(KEY);
    return bytes.map((b, i) => b ^ k[i % k.length] ^ salt[i % salt.length] ^ (i * 31) % 256);
  }

  function encodePayload(obj) {
    const salt = crypto.getRandomValues(new Uint8Array(4));
    const body = scramble(new TextEncoder().encode(JSON.stringify(obj)), salt);
    const out = new Uint8Array(salt.length + body.length);
    out.set(salt); out.set(body, salt.length);
    return toBase64Url(out);
  }
  function decodePayload(token) {
    const all = fromBase64Url(token);
    const salt = all.slice(0, 4);
    return JSON.parse(new TextDecoder().decode(scramble(all.slice(4), salt)));
  }

  function makeDrawCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 5; i++) s += chars[secureRandomInt(chars.length)];
    return s;
  }

  // Build one payload per family/group.
  function buildGroupPayloads(config, result, drawCode) {
    return config.groups.map((g) => ({
      groupId: g.id,
      groupName: g.name,
      payload: {
        v: 1,
        t: config.title,
        y: config.year,
        b: config.budget || "",
        d: config.exchangeDate || "",
        c: drawCode,
        g: g.name,
        a: result.pairs
          .filter((p) => p.giver.groupId === g.id)
          .map((p) => [p.giver.name, p.giver.role, p.receiver.name]),
      },
    }));
  }

  window.GiftExchange = {
    flattenPeople, validateConfig, blockedReason, checkAssignments,
    draw, encodePayload, decodePayload, makeDrawCode, buildGroupPayloads,
  };
})();
