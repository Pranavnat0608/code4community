/**
 * Seminar rosters on the club spreadsheet: one tab per club that meets during
 * Gold or Maroon seminar, with rows only for students who picked that club.
 */
import { getAdminFirestore } from "@/lib/firebase/admin";
import { applyCustomClubsFromAdminDb } from "@/lib/club-hub/customClubsServer";
import { getEffectiveMeetingDayForSlug } from "@/lib/club-hub/clubDirectorySections";
import { applyMeetingDayOverridesFromAdminDb } from "@/lib/club-hub/clubMeetingDaysServer";
import { getSortedClubOptions } from "@/lib/club-hub/broadRunClubDirectory";
import { STUDENT_MEETING_TAB } from "@/lib/club-hub/studentMeetingSheetLayout";
import { CLUB_HUB_MEETING_CHOICES, normalizeMeetingChoices } from "@/lib/club-hub/clubMeetingChoices";
import { getRosterSheetsApi } from "@/lib/club-hub/rosterSheetApi";
import {
  ROSTER_HEADER,
  ROSTER_META_TAB,
  getClubRosterSpreadsheetId,
  isClubRosterSheetSyncConfigured,
  sanitizeSheetTabTitle,
} from "@/lib/club-hub/rosterSheetConfig";

const USER_ID_COLUMN = 3;

function getSheetsApi() {
  return getRosterSheetsApi();
}

function quoteTab(title) {
  return `'${title.replace(/'/g, "''")}'`;
}

/** @param {ReturnType<typeof getRosterSheetsApi>} sheets @param {string} spreadsheetId */
async function loadSpreadsheetMeta(sheets, spreadsheetId) {
  return sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });
}

/** @param {{ title?: string | null, sheetId?: number | null }[]} sheetProps @param {string} title */
function findSheetByTitle(sheetProps, title) {
  return sheetProps.find((p) => p.title === title) ?? null;
}

/** @param {ReturnType<typeof getRosterSheetsApi>} sheets @param {string} spreadsheetId */
async function ensureMetaTab(sheets, spreadsheetId) {
  const meta = await loadSpreadsheetMeta(sheets, spreadsheetId);
  const props = meta.sheets?.map((s) => s.properties).filter(Boolean) ?? [];
  if (findSheetByTitle(props, ROSTER_META_TAB)) return props;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: ROSTER_META_TAB, hidden: true } } }],
    },
  });
  const meta2 = await loadSpreadsheetMeta(sheets, spreadsheetId);
  return meta2.sheets?.map((s) => s.properties).filter(Boolean) ?? [];
}

/** @param {ReturnType<typeof getRosterSheetsApi>} sheets @param {string} spreadsheetId */
async function readMetaRows(sheets, spreadsheetId) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${ROSTER_META_TAB}'!A2:C`,
    });
    /** @type {Map<string, { tabTitle: string, sheetId: number }>} */
    const map = new Map();
    for (const row of res.values || []) {
      const slug = row[0]?.trim();
      const tabTitle = row[1]?.trim();
      const sheetId = Number(row[2]);
      if (slug && tabTitle && Number.isFinite(sheetId)) {
        map.set(slug, { tabTitle, sheetId });
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * @param {ReturnType<typeof getRosterSheetsApi>} sheets
 * @param {string} spreadsheetId
 * @param {string} slug
 * @param {string} tabTitle
 * @param {number} sheetId
 */
async function appendMetaRow(sheets, spreadsheetId, slug, tabTitle, sheetId) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${ROSTER_META_TAB}'!A:C`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[slug, tabTitle, String(sheetId)]] },
  });
}

/** @param {string} slug @param {string} gold @param {string} maroon */
function seminarLabel(slug, gold, maroon) {
  const onGold = gold === slug;
  const onMaroon = maroon === slug;
  if (onGold && onMaroon) return "Gold & Maroon";
  if (onGold) return "Gold";
  return "Maroon";
}

/** @param {string[]} slugs */
/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string[]} userIds
 */
async function emailsForUsers(db, userIds) {
  /** @type {Map<string, string>} */
  const map = new Map();
  const ids = uniqueSlugs(userIds);
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const snaps = await db.getAll(...chunk.map((id) => db.collection("users").doc(id)));
    for (const snap of snaps) {
      map.set(snap.id, snap.data()?.email?.trim() || "");
    }
  }
  return map;
}

function uniqueSlugs(slugs) {
  return [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
}

/** Gold, Maroon, or both. General clubs do not get a roster tab. */
function clubMeetsDuringSeminar(slug) {
  const day = getEffectiveMeetingDayForSlug(slug);
  return day === "gold" || day === "maroon" || day === "both";
}

const HOME_TAB = "Home";
const HOME_SKIP_TABS = new Set([HOME_TAB, ROSTER_META_TAB, "Sheet1", STUDENT_MEETING_TAB]);

/** @param {string} name */
function slugForClubName(name) {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return getSortedClubOptions().find((club) => club.name === trimmed)?.slug || "";
}

/**
 * @param {ReturnType<typeof getRosterSheetsApi>} sheets
 * @param {string} spreadsheetId
 * @param {{ title?: string | null, sheetId?: number | null }[]} sheetProps
 * @param {string} clubSlug
 */
async function ensureClubTab(sheets, spreadsheetId, sheetProps, clubSlug) {
  const metaMap = await readMetaRows(sheets, spreadsheetId);
  const existing = metaMap.get(clubSlug);
  if (existing && sheetProps.some((p) => p.sheetId === existing.sheetId)) {
    return { tabTitle: existing.tabTitle, sheetId: existing.sheetId };
  }

  const club = getSortedClubOptions().find((option) => option.slug === clubSlug);
  let tabTitle = sanitizeSheetTabTitle(club?.name || clubSlug);
  const usedTitles = new Set(sheetProps.map((p) => p.title));
  if (usedTitles.has(tabTitle)) {
    tabTitle = sanitizeSheetTabTitle(`${tabTitle} (${clubSlug.slice(0, 20)})`).slice(0, 100);
  }

  const addRes = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tabTitle } } }] },
  });
  const newSheetId = addRes.replies?.[0]?.addSheet?.properties?.sheetId;
  if (newSheetId == null) throw new Error(`Could not create sheet tab for ${clubSlug}.`);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${quoteTab(tabTitle)}!A1:D1`,
    valueInputOption: "RAW",
    requestBody: { values: [ROSTER_HEADER] },
  });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateDimensionProperties: {
            range: { sheetId: newSheetId, dimension: "COLUMNS", startIndex: USER_ID_COLUMN, endIndex: USER_ID_COLUMN + 1 },
            properties: { hiddenByUser: true },
            fields: "hiddenByUser",
          },
        },
      ],
    },
  });

  const metaHeader = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${ROSTER_META_TAB}'!A1:C1`,
  });
  if (!metaHeader.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${ROSTER_META_TAB}'!A1:C1`,
      valueInputOption: "RAW",
      requestBody: { values: [["clubSlug", "tabTitle", "sheetId"]] },
    });
  }
  await appendMetaRow(sheets, spreadsheetId, clubSlug, tabTitle, newSheetId);
  sheetProps.push({ title: tabTitle, sheetId: newSheetId });
  return { tabTitle, sheetId: newSheetId };
}

/** @param {string[]} row */
function userIdFromRosterRow(row, headerIsLegacy) {
  const modern = row[USER_ID_COLUMN]?.trim() || "";
  if (modern) return modern;
  if (headerIsLegacy) return row[2]?.trim() || "";
  return "";
}

/**
 * @param {{
 *   userId: string,
 *   displayName: string,
 *   userEmail?: string,
 *   goldClubSlug: string,
 *   maroonClubSlug: string,
 *   previousSlugs?: string[],
 * }[]} students
 */
export async function syncSeminarRostersForStudents(students) {
  const rows = students.filter((row) => row.userId?.trim());
  if (!rows.length) return { ok: true, skipped: true };
  if (!isClubRosterSheetSyncConfigured()) return { ok: true, skipped: true };

  const db = getAdminFirestore();
  const sheets = getSheetsApi();
  const spreadsheetId = getClubRosterSpreadsheetId();
  if (!db || !sheets || !spreadsheetId) {
    return { ok: false, error: "Sheets client not configured." };
  }

  await applyCustomClubsFromAdminDb(db);
  await applyMeetingDayOverridesFromAdminDb(db);
  const emailByUser = await emailsForUsers(
    db,
    rows.filter((row) => !row.userEmail?.trim()).map((row) => row.userId.trim()),
  );

  let sheetProps = await ensureMetaTab(sheets, spreadsheetId);
  /** @type {Set<string>} */
  const affected = new Set();
  for (const row of rows) {
    for (const slug of uniqueSlugs([
      row.goldClubSlug || "",
      row.maroonClubSlug || "",
      ...(row.previousSlugs || []),
    ])) {
      affected.add(slug);
    }
  }

  /** @type {Map<string, { tabTitle: string, sheetId: number }>} */
  const tabs = new Map();
  for (const slug of affected) {
    if (!clubMeetsDuringSeminar(slug)) continue;
    const stillUsed = rows.some(
      (row) => row.goldClubSlug?.trim() === slug || row.maroonClubSlug?.trim() === slug,
    );
    const meta = await readMetaRows(sheets, spreadsheetId);
    if (!stillUsed && !meta.get(slug)) continue;
    const tab = await ensureClubTab(sheets, spreadsheetId, sheetProps, slug);
    tabs.set(slug, tab);
    sheetProps = await loadSpreadsheetMeta(sheets, spreadsheetId).then(
      (metaRes) => metaRes.sheets?.map((s) => s.properties).filter(Boolean) ?? [],
    );
  }

  for (const [slug, tab] of tabs) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${quoteTab(tab.tabTitle)}!A:D`,
    });
    const values = res.values || [];
    const headerIsLegacy = values[0]?.[2]?.trim() === "User ID";
    /** @type {Map<string, string[]>} */
    const byUser = new Map();
    for (let i = 1; i < values.length; i += 1) {
      const row = values[i] || [];
      const uid = userIdFromRosterRow(row, headerIsLegacy);
      if (!uid || byUser.has(uid)) continue;
      byUser.set(uid, headerIsLegacy ? [row[0] || "", row[1] || "", "", uid] : [row[0] || "", row[1] || "", row[2] || "", uid]);
    }

    for (const row of rows) {
      const uid = row.userId.trim();
      const gold = row.goldClubSlug?.trim() || "";
      const maroon = row.maroonClubSlug?.trim() || "";
      const onThisClub = gold === slug || maroon === slug;
      if (!onThisClub) {
        byUser.delete(uid);
        continue;
      }
      const email = row.userEmail?.trim() || emailByUser.get(uid) || "";
      byUser.set(uid, [
        row.displayName?.trim() || "Student",
        email,
        seminarLabel(slug, gold, maroon),
        uid,
      ]);
    }

    const members = [...byUser.values()].sort((a, b) =>
      String(a[0] || "").localeCompare(String(b[0] || "")),
    );
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${quoteTab(tab.tabTitle)}!A:D`,
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${quoteTab(tab.tabTitle)}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [ROSTER_HEADER, ...members] },
    });
  }

  return { ok: true, tabs: tabs.size };
}

/** @param {{ clubSlug?: string, userId?: string, displayName?: string, userEmail?: string }} member */
export async function syncClubRosterMemberJoin(member) {
  const clubSlug = member.clubSlug?.trim() || "";
  const userId = member.userId?.trim() || "";
  if (!clubSlug || !userId) return { ok: false, error: "Missing club or user." };
  const db = getAdminFirestore();
  if (!db) return { ok: true, skipped: true };
  const snap = await db.collection(CLUB_HUB_MEETING_CHOICES).doc(userId).get();
  const choices = snap.exists
    ? normalizeMeetingChoices(snap.data())
    : { goldClubSlug: "", maroonClubSlug: "" };
  const onSeminar = choices.goldClubSlug === clubSlug || choices.maroonClubSlug === clubSlug;
  if (!onSeminar) {
    return syncClubRosterMemberLeave({ clubSlug, userId });
  }
  return syncSeminarRostersForStudents([
    {
      userId,
      displayName: member.displayName || "Member",
      userEmail: member.userEmail || "",
      goldClubSlug: choices.goldClubSlug,
      maroonClubSlug: choices.maroonClubSlug,
      previousSlugs: [],
    },
  ]);
}

/** @param {{ clubSlug: string, userId: string }} args */
export async function syncClubRosterMemberLeave({ clubSlug, userId }) {
  return syncSeminarRostersForStudents([
    {
      userId,
      displayName: "Student",
      goldClubSlug: "",
      maroonClubSlug: "",
      previousSlugs: [clubSlug],
    },
  ]);
}

function claimTabTitle(name, slug, usedTitles) {
  let tabTitle = sanitizeSheetTabTitle(name || slug);
  if (usedTitles.has(tabTitle)) {
    tabTitle = sanitizeSheetTabTitle(`${tabTitle} (${slug.slice(0, 20)})`).slice(0, 100);
  }
  usedTitles.add(tabTitle);
  return tabTitle;
}

/**
 * @param {ReturnType<typeof getRosterSheetsApi>} sheets
 * @param {string} spreadsheetId
 * @param {Map<string, { tabTitle: string, sheetId: number }>} map
 */
async function replaceMetaRows(sheets, spreadsheetId, map) {
  const values = [["clubSlug", "tabTitle", "sheetId"]];
  for (const [slug, info] of map) {
    values.push([slug, info.tabTitle, String(info.sheetId)]);
  }
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${ROSTER_META_TAB}'!A:C`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${ROSTER_META_TAB}'!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

/**
 * @param {ReturnType<typeof getRosterSheetsApi>} sheets
 * @param {string} spreadsheetId
 */
async function removeGeneralClubTabs(sheets, spreadsheetId) {
  const sheetProps = (await loadSpreadsheetMeta(sheets, spreadsheetId)).sheets
    ?.map((sheet) => sheet.properties)
    .filter(Boolean) ?? [];
  const meta = await readMetaRows(sheets, spreadsheetId);
  const generalTitles = new Set(
    getSortedClubOptions()
      .filter((club) => !clubMeetsDuringSeminar(club.slug))
      .map((club) => sanitizeSheetTabTitle(club.name || club.slug)),
  );
  /** @type {Set<number>} */
  const deleteIds = new Set();
  /** @type {Set<string>} */
  const deletedSlugs = new Set();

  for (const [slug, info] of meta) {
    if (clubMeetsDuringSeminar(slug)) continue;
    if (sheetProps.some((prop) => prop.sheetId === info.sheetId)) deleteIds.add(info.sheetId);
    deletedSlugs.add(slug);
  }
  for (const prop of sheetProps) {
    if (!prop.title || prop.sheetId == null || HOME_SKIP_TABS.has(prop.title)) continue;
    if (generalTitles.has(prop.title)) deleteIds.add(prop.sheetId);
  }
  for (const slug of deletedSlugs) meta.delete(slug);

  const ids = [...deleteIds];
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: chunk.map((sheetId) => ({ deleteSheet: { sheetId } })) },
    });
  }
  if (deletedSlugs.size) await replaceMetaRows(sheets, spreadsheetId, meta);
  return ids.length;
}

/**
 * @param {ReturnType<typeof getRosterSheetsApi>} sheets
 * @param {string} spreadsheetId
 */
async function rebuildRosterHomeTab(sheets, spreadsheetId) {
  const sheetProps = (await loadSpreadsheetMeta(sheets, spreadsheetId)).sheets
    ?.map((sheet) => sheet.properties)
    .filter(Boolean) ?? [];
  let home = sheetProps.find((prop) => prop.title === HOME_TAB);
  if (home?.sheetId == null) {
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: HOME_TAB, index: 0 } } }],
      },
    });
    const sheetId = addRes.replies?.[0]?.addSheet?.properties?.sheetId;
    if (sheetId == null) throw new Error("Could not create the Home tab.");
    home = { title: HOME_TAB, sheetId };
  } else {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId: home.sheetId, index: 0 },
              fields: "index",
            },
          },
        ],
      },
    });
  }

  const links = sheetProps
    .filter((prop) => prop.title && prop.sheetId != null && !prop.hidden && !HOME_SKIP_TABS.has(prop.title))
    .map((prop) => {
      const name = String(prop.title);
      const label = name.replace(/"/g, '""');
      return [name, `=HYPERLINK("#gid=${prop.sheetId}", "${label}")`];
    })
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { sensitivity: "base" }));

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${quoteTab(HOME_TAB)}!A:B`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${quoteTab(HOME_TAB)}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [["Club", "Open roster"], ...links] },
  });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: home.sheetId,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: "gridProperties.frozenRowCount",
          },
        },
        {
          repeatCell: {
            range: { sheetId: home.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId: home.sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 2 },
          },
        },
      ],
    },
  });
  return links.length;
}

/** Create a header-only tab for every seminar club that does not have one yet. */
export async function ensureAllClubRosterTabs() {
  if (!isClubRosterSheetSyncConfigured()) {
    return { ok: false, error: "CLUB_ROSTER_SPREADSHEET_ID is not set." };
  }
  const db = getAdminFirestore();
  const sheets = getSheetsApi();
  const spreadsheetId = getClubRosterSpreadsheetId();
  if (!db || !sheets || !spreadsheetId) {
    return { ok: false, error: "Sheets client not configured." };
  }

  await applyCustomClubsFromAdminDb(db);
  await applyMeetingDayOverridesFromAdminDb(db);
  await ensureMetaTab(sheets, spreadsheetId);
  const removed = await removeGeneralClubTabs(sheets, spreadsheetId);
  const sheetProps = (await loadSpreadsheetMeta(sheets, spreadsheetId)).sheets
    ?.map((sheet) => sheet.properties)
    .filter(Boolean) ?? [];
  const meta = await readMetaRows(sheets, spreadsheetId);
  const usedTitles = new Set(sheetProps.map((prop) => prop.title).filter(Boolean));
  const seminarClubs = getSortedClubOptions().filter((club) => clubMeetsDuringSeminar(club.slug));
  /** @type {{ slug: string, tabTitle: string, sheetId?: number, adopt: boolean }[]} */
  const missing = [];

  for (const club of seminarClubs) {
    const existing = meta.get(club.slug);
    if (existing && sheetProps.some((prop) => prop.sheetId === existing.sheetId)) continue;
    const preferred = sanitizeSheetTabTitle(club.name || club.slug);
    const existingSheet = sheetProps.find((prop) => prop.title === preferred);
    if (existingSheet?.sheetId != null) {
      missing.push({
        slug: club.slug,
        tabTitle: preferred,
        sheetId: existingSheet.sheetId,
        adopt: true,
      });
      continue;
    }
    missing.push({
      slug: club.slug,
      tabTitle: claimTabTitle(club.name, club.slug, usedTitles),
      adopt: false,
    });
  }

  /** @type {{ slug: string, tabTitle: string, sheetId: number }[]} */
  const created = [];
  const toCreate = missing.filter((row) => !row.adopt);
  for (let i = 0; i < toCreate.length; i += 40) {
    const chunk = toCreate.slice(i, i + 40);
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: chunk.map((row) => ({ addSheet: { properties: { title: row.tabTitle } } })),
      },
    });
    chunk.forEach((row, index) => {
      const sheetId = addRes.replies?.[index]?.addSheet?.properties?.sheetId;
      if (sheetId == null) throw new Error(`Could not create sheet tab for ${row.slug}.`);
      created.push({ slug: row.slug, tabTitle: row.tabTitle, sheetId });
    });
  }

  if (created.length) {
    await sheets.spreadsheets.values.batchUpdate({
      requestBody: {
        valueInputOption: "RAW",
        data: created.map((row) => ({
          range: `${quoteTab(row.tabTitle)}!A1:D1`,
          values: [ROSTER_HEADER],
        })),
      },
    });
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: created.map((row) => ({
          updateDimensionProperties: {
            range: {
              sheetId: row.sheetId,
              dimension: "COLUMNS",
              startIndex: USER_ID_COLUMN,
              endIndex: USER_ID_COLUMN + 1,
            },
            properties: { hiddenByUser: true },
            fields: "hiddenByUser",
          },
        })),
      },
    });
  }

  const adopted = missing.filter((row) => row.adopt && row.sheetId != null);
  const metaRows = [
    ...created.map((row) => [row.slug, row.tabTitle, String(row.sheetId)]),
    ...adopted.map((row) => [row.slug, row.tabTitle, String(row.sheetId)]),
  ];
  if (metaRows.length) {
    const metaHeader = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${ROSTER_META_TAB}'!A1:C1`,
    });
    if (!metaHeader.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${ROSTER_META_TAB}'!A1:C1`,
        valueInputOption: "RAW",
        requestBody: { values: [["clubSlug", "tabTitle", "sheetId"]] },
      });
    }
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${ROSTER_META_TAB}'!A:C`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: metaRows },
    });
  }

  const homeLinks = await rebuildRosterHomeTab(sheets, spreadsheetId);
  return {
    ok: true,
    created: created.length,
    removed,
    clubs: seminarClubs.length,
    homeLinks,
  };
}

/** Rebuild seminar rows, and make sure every club has a tab. */
export async function bootstrapClubRosterSpreadsheet() {
  if (!isClubRosterSheetSyncConfigured()) {
    return { ok: false, error: "CLUB_ROSTER_SPREADSHEET_ID is not set." };
  }
  const db = getAdminFirestore();
  if (!db) return { ok: false, error: "Admin Firestore unavailable." };
  await applyCustomClubsFromAdminDb(db);

  const snap = await db.collection(CLUB_HUB_MEETING_CHOICES).get();
  const userIds = snap.docs.map((doc) => doc.id);
  /** @type {Map<string, { displayName: string, email: string }>} */
  const people = new Map();
  for (let i = 0; i < userIds.length; i += 100) {
    const chunk = userIds.slice(i, i + 100);
    const profiles = await db.getAll(...chunk.map((id) => db.collection("users").doc(id)));
    for (const profile of profiles) {
      const data = profile.data() || {};
      people.set(profile.id, {
        displayName: data.displayName?.trim() || "Student",
        email: data.email?.trim() || "",
      });
    }
  }

  /** @type {Map<string, { userId: string, displayName: string, userEmail: string, goldClubSlug: string, maroonClubSlug: string, previousSlugs: string[] }>} */
  const byUser = new Map();
  for (const doc of snap.docs) {
    const choices = normalizeMeetingChoices(doc.data());
    if (!choices.goldClubSlug && !choices.maroonClubSlug) continue;
    const person = people.get(doc.id);
    byUser.set(doc.id, {
      userId: doc.id,
      displayName: person?.displayName || "Student",
      userEmail: person?.email || "",
      goldClubSlug: choices.goldClubSlug,
      maroonClubSlug: choices.maroonClubSlug,
      previousSlugs: [],
    });
  }

  const result = byUser.size
    ? await syncSeminarRostersForStudents([...byUser.values()])
    : { ok: true, tabs: 0 };
  if (!result.ok) return result;
  const ensured = await ensureAllClubRosterTabs();
  if (!ensured.ok) return ensured;
  return { ok: true, tabs: ensured.clubs, clubs: byUser.size, created: ensured.created };
}

export { slugForClubName };
