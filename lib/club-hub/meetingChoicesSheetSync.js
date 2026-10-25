import { getAdminFirestore } from "@/lib/firebase/admin";
import { getClubBySlug } from "@/lib/club-hub/broadRunClubDirectory";
import { applyCustomClubsFromAdminDb } from "@/lib/club-hub/customClubsServer";
import { CLUB_HUB_MEETING_CHOICES, normalizeMeetingChoices } from "@/lib/club-hub/clubMeetingChoices";
import { clearSeminarSignupAfterClubLeaveAdmin } from "@/lib/club-hub/meetingChoicesAdmin";
import { listSpecialSheetEvents } from "@/lib/club-hub/specialSheetEventsServer";
import { getRosterSheetsApi } from "@/lib/club-hub/rosterSheetApi";
import {
  getClubRosterSpreadsheetId,
  isClubRosterSheetSyncConfigured,
} from "@/lib/club-hub/rosterSheetConfig";
import { slugForClubName, syncSeminarRostersForStudents } from "@/lib/club-hub/rosterSheetSync";
import {
  STUDENT_MEETING_TAB,
  buildStudentMeetingSheetHeaders,
  specialEventCellsForUser,
  studentMeetingUserIdColumnIndex,
} from "@/lib/club-hub/studentMeetingSheetLayout";

export { STUDENT_MEETING_TAB };

function quoteTab(title) {
  return `'${title.replace(/'/g, "''")}'`;
}

/** @param {string} slug */
function clubNameForSlug(slug) {
  if (!slug) return "";
  return getClubBySlug(slug)?.name || slug;
}

/** @param {string | undefined} goldName @param {string | undefined} maroonName */
function previousSeminarSlugs(goldName, maroonName) {
  return [slugForClubName(goldName || ""), slugForClubName(maroonName || "")].filter(Boolean);
}

/** @param {number} colCount */
function sheetEndColumnLetter(colCount) {
  if (colCount <= 0) return "A";
  if (colCount <= 26) return String.fromCharCode(64 + colCount);
  return "Z";
}

/**
 * @param {ReturnType<typeof getRosterSheetsApi>} sheets
 * @param {string} spreadsheetId
 */
async function ensureStudentMeetingTab(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });
  const props = meta.sheets?.map((s) => s.properties).filter(Boolean) ?? [];
  let tab = props.find((p) => p.title === STUDENT_MEETING_TAB);
  if (!tab?.sheetId) {
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: STUDENT_MEETING_TAB } } }],
      },
    });
    const sheetId = addRes.replies?.[0]?.addSheet?.properties?.sheetId;
    if (sheetId == null) throw new Error("Could not create student meeting tab.");
    tab = { title: STUDENT_MEETING_TAB, sheetId };
  }
  return tab.sheetId;
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 */
async function loadSpecialEventsForSheet(db) {
  return listSpecialSheetEvents(db);
}

/**
 * @param {ReturnType<typeof getRosterSheetsApi>} sheets
 * @param {string} spreadsheetId
 * @param {number} sheetId
 * @param {number} userIdColIndex
 */
async function ensureHiddenUserIdColumn(sheets, spreadsheetId, sheetId, userIdColIndex) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: userIdColIndex,
              endIndex: userIdColIndex + 1,
            },
            properties: { hiddenByUser: true },
            fields: "hiddenByUser",
          },
        },
      ],
    },
  });
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {ReturnType<typeof getRosterSheetsApi>} sheets
 * @param {string} spreadsheetId
 * @param {number} sheetId
 */
export async function rebuildStudentMeetingSheet(db, sheets, spreadsheetId, sheetId) {
  const specialEvents = await loadSpecialEventsForSheet(db);
  const headers = buildStudentMeetingSheetHeaders(specialEvents);
  const userIdCol = studentMeetingUserIdColumnIndex(specialEvents.length);
  const colCount = headers.length;

  const snap = await db.collection(CLUB_HUB_MEETING_CHOICES).get();
  /** @type {Map<string, { displayName: string, goldClubSlug: string, maroonClubSlug: string }>} */
  const meetingByUser = new Map();

  for (const docSnap of snap.docs) {
    const choices = normalizeMeetingChoices(docSnap.data());
    if (!choices.goldClubSlug && !choices.maroonClubSlug) continue;
    const userId = docSnap.id;
    let displayName = "Student";
    const userSnap = await db.collection("users").doc(userId).get();
    if (userSnap.exists) {
      displayName = userSnap.data()?.displayName?.trim() || displayName;
    }
    meetingByUser.set(userId, {
      displayName,
      goldClubSlug: choices.goldClubSlug,
      maroonClubSlug: choices.maroonClubSlug,
    });
  }

  /** @type {Set<string>} */
  const allUserIds = new Set(meetingByUser.keys());
  for (const ev of specialEvents) {
    for (const uid of ev.studentUserIds || []) {
      if (uid) allUserIds.add(uid);
    }
  }

  /** @type {{ userId: string, displayName: string, goldClubSlug: string, maroonClubSlug: string }[]} */
  const entries = [];
  for (const userId of allUserIds) {
    const meeting = meetingByUser.get(userId);
    if (meeting) {
      entries.push({ userId, ...meeting });
      continue;
    }
    let displayName = "Student";
    const userSnap = await db.collection("users").doc(userId).get();
    if (userSnap.exists) {
      displayName = userSnap.data()?.displayName?.trim() || displayName;
    }
    entries.push({
      userId,
      displayName,
      goldClubSlug: "",
      maroonClubSlug: "",
    });
  }

  entries.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const values = [
    headers,
    ...entries.map((e) => {
      /** @type {string[]} */
      const row = new Array(colCount).fill("");
      row[0] = e.displayName;
      row[1] = clubNameForSlug(e.goldClubSlug);
      row[2] = clubNameForSlug(e.maroonClubSlug);
      const specialCells = specialEventCellsForUser(e.userId, specialEvents);
      for (let i = 0; i < specialCells.length; i += 1) {
        row[3 + i] = specialCells[i];
      }
      row[userIdCol] = e.userId;
      return row;
    }),
  ];

  const endCol = sheetEndColumnLetter(colCount);
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${quoteTab(STUDENT_MEETING_TAB)}!A:${endCol}`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${quoteTab(STUDENT_MEETING_TAB)}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  await ensureHiddenUserIdColumn(sheets, spreadsheetId, sheetId, userIdCol);

  return { rows: entries.length, specialEventColumns: specialEvents.length };
}

/**
 * @param {{
 *   userId: string,
 *   displayName: string,
 *   goldClubSlug: string,
 *   maroonClubSlug: string,
 * }} row
 */
export async function syncStudentMeetingRowToSheet(row) {
  if (!isClubRosterSheetSyncConfigured()) {
    return { ok: true, skipped: true };
  }
  const db = getAdminFirestore();
  const sheets = getRosterSheetsApi();
  const spreadsheetId = getClubRosterSpreadsheetId();
  if (!db || !sheets || !spreadsheetId) {
    return { ok: false, error: "Sheets client not configured." };
  }

  const userId = row.userId?.trim();
  if (!userId) return { ok: false, error: "Missing user." };

  await applyCustomClubsFromAdminDb(db);
  const specialEvents = await loadSpecialEventsForSheet(db);
  const userIdCol = studentMeetingUserIdColumnIndex(specialEvents.length);
  const colCount = buildStudentMeetingSheetHeaders(specialEvents).length;

  const goldName = clubNameForSlug(row.goldClubSlug?.trim() || "");
  const maroonName = clubNameForSlug(row.maroonClubSlug?.trim() || "");
  const name = row.displayName?.trim() || "Student";
  const sheetId = await ensureStudentMeetingTab(sheets, spreadsheetId);

  const endCol = sheetEndColumnLetter(colCount);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteTab(STUDENT_MEETING_TAB)}!A:${endCol}`,
  });
  const rows = res.values || [];

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i += 1) {
    if (rows[i]?.[userIdCol] === userId) {
      rowIndex = i;
      break;
    }
  }

  const inSpecialEvent = specialEvents.some((ev) => (ev.studentUserIds || []).includes(userId));
  const previousSlugs =
    rowIndex >= 0 ? previousSeminarSlugs(rows[rowIndex]?.[1], rows[rowIndex]?.[2]) : [];

  if (!goldName && !maroonName && !inSpecialEvent) {
    if (rowIndex < 0) return { ok: true, skipped: true };
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    await syncSeminarRostersForStudents([
      {
        userId,
        displayName: name,
        goldClubSlug: "",
        maroonClubSlug: "",
        previousSlugs,
      },
    ]);
    return { ok: true, removed: true };
  }

  /** @type {string[]} */
  const dataRow = new Array(colCount).fill("");
  if (rowIndex >= 0 && rows[rowIndex]) {
    for (let c = 0; c < colCount; c += 1) {
      dataRow[c] = rows[rowIndex][c] ?? "";
    }
  } else {
    const specialCells = specialEventCellsForUser(userId, specialEvents);
    for (let i = 0; i < specialCells.length; i += 1) {
      dataRow[3 + i] = specialCells[i];
    }
  }

  dataRow[0] = name;
  dataRow[1] = goldName;
  dataRow[2] = maroonName;
  dataRow[userIdCol] = userId;

  if (rowIndex >= 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${quoteTab(STUDENT_MEETING_TAB)}!A${rowIndex + 1}:${endCol}${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [dataRow] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${quoteTab(STUDENT_MEETING_TAB)}!A:${endCol}`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [dataRow] },
    });
  }

  await syncSeminarRostersForStudents([
    {
      userId,
      displayName: name,
      goldClubSlug: row.goldClubSlug?.trim() || "",
      maroonClubSlug: row.maroonClubSlug?.trim() || "",
      previousSlugs,
    },
  ]);

  return { ok: true };
}

/**
 * Update several student meeting rows in one sheet read.
 * @param {{ userId: string, displayName: string, goldClubSlug: string, maroonClubSlug: string }[]} updates
 */
export async function syncStudentMeetingRowsToSheet(updates) {
  const rowsToSync = updates.filter((row) => row.userId?.trim());
  if (!rowsToSync.length) return { ok: true, skipped: true, updated: 0 };
  if (!isClubRosterSheetSyncConfigured()) {
    return { ok: true, skipped: true, updated: 0 };
  }
  const db = getAdminFirestore();
  const sheets = getRosterSheetsApi();
  const spreadsheetId = getClubRosterSpreadsheetId();
  if (!db || !sheets || !spreadsheetId) {
    return { ok: false, error: "Sheets client not configured." };
  }

  await applyCustomClubsFromAdminDb(db);
  const specialEvents = await loadSpecialEventsForSheet(db);
  const userIdCol = studentMeetingUserIdColumnIndex(specialEvents.length);
  const colCount = buildStudentMeetingSheetHeaders(specialEvents).length;
  const endCol = sheetEndColumnLetter(colCount);
  const sheetId = await ensureStudentMeetingTab(sheets, spreadsheetId);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteTab(STUDENT_MEETING_TAB)}!A:${endCol}`,
  });
  const sheetRows = res.values || [];

  /** @type {Map<string, number>} */
  const rowIndexByUser = new Map();
  for (let i = 1; i < sheetRows.length; i += 1) {
    const userId = sheetRows[i]?.[userIdCol];
    if (userId) rowIndexByUser.set(userId, i);
  }

  /** @type {Parameters<typeof syncSeminarRostersForStudents>[0]} */
  const rosterUpdates = [];
  /** @type {{ range: string, values: string[][] }[]} */
  const valueUpdates = [];
  /** @type {string[][]} */
  const appends = [];
  /** @type {number[]} */
  const deleteIndexes = [];

  for (const row of rowsToSync) {
    const userId = row.userId.trim();
    const goldName = clubNameForSlug(row.goldClubSlug?.trim() || "");
    const maroonName = clubNameForSlug(row.maroonClubSlug?.trim() || "");
    const inSpecialEvent = specialEvents.some((ev) => (ev.studentUserIds || []).includes(userId));
    const rowIndex = rowIndexByUser.get(userId);
    const previousSlugs =
      rowIndex != null ? previousSeminarSlugs(sheetRows[rowIndex]?.[1], sheetRows[rowIndex]?.[2]) : [];
    rosterUpdates.push({
      userId,
      displayName: row.displayName?.trim() || "Student",
      goldClubSlug: !goldName && !maroonName && !inSpecialEvent ? "" : row.goldClubSlug?.trim() || "",
      maroonClubSlug: !goldName && !maroonName && !inSpecialEvent ? "" : row.maroonClubSlug?.trim() || "",
      previousSlugs,
    });

    if (!goldName && !maroonName && !inSpecialEvent) {
      if (rowIndex != null) deleteIndexes.push(rowIndex);
      continue;
    }

    /** @type {string[]} */
    const dataRow = new Array(colCount).fill("");
    if (rowIndex != null && sheetRows[rowIndex]) {
      for (let c = 0; c < colCount; c += 1) {
        dataRow[c] = sheetRows[rowIndex][c] ?? "";
      }
    } else {
      const specialCells = specialEventCellsForUser(userId, specialEvents);
      for (let i = 0; i < specialCells.length; i += 1) {
        dataRow[3 + i] = specialCells[i];
      }
    }
    dataRow[0] = row.displayName?.trim() || "Student";
    dataRow[1] = goldName;
    dataRow[2] = maroonName;
    dataRow[userIdCol] = userId;

    if (rowIndex != null) {
      valueUpdates.push({
        range: `${quoteTab(STUDENT_MEETING_TAB)}!A${rowIndex + 1}:${endCol}${rowIndex + 1}`,
        values: [dataRow],
      });
    } else {
      appends.push(dataRow);
    }
  }

  if (valueUpdates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: "RAW", data: valueUpdates },
    });
  }
  if (appends.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${quoteTab(STUDENT_MEETING_TAB)}!A:${endCol}`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: appends },
    });
  }
  if (deleteIndexes.length) {
    const unique = [...new Set(deleteIndexes)].sort((a, b) => b - a);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: unique.map((rowIndex) => ({
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        })),
      },
    });
  }

  await syncSeminarRostersForStudents(rosterUpdates);
  return { ok: true, updated: rowsToSync.length };
}

/**
 * After leaving a club: clear that club from meeting choices (Firestore) and mirror the row on Sheets.
 * @param {{ userId: string, clubSlug: string }} args
 */
export async function syncStudentMeetingRowAfterClubLeave({ userId, clubSlug }) {
  const db = getAdminFirestore();
  if (!db) {
    return { ok: false, error: "Admin Firestore unavailable." };
  }

  const uid = userId?.trim();
  const slug = clubSlug?.trim();
  if (!uid || !slug) {
    return { ok: false, error: "Missing user or club." };
  }

  const { choices } = await clearSeminarSignupAfterClubLeaveAdmin(db, {
    userId: uid,
    clubSlug: slug,
  });

  let displayName = "Student";
  const userSnap = await db.collection("users").doc(uid).get();
  if (userSnap.exists) {
    displayName = userSnap.data()?.displayName?.trim() || displayName;
  }

  return syncStudentMeetingRowToSheet({
    userId: uid,
    displayName,
    goldClubSlug: choices.goldClubSlug,
    maroonClubSlug: choices.maroonClubSlug,
  });
}

/** Rebuild the student meeting tab from Firestore. */
export async function bootstrapStudentMeetingTabFromFirestore() {
  if (!isClubRosterSheetSyncConfigured()) {
    return { ok: false, error: "CLUB_ROSTER_SPREADSHEET_ID is not set." };
  }
  const db = getAdminFirestore();
  if (!db) return { ok: false, error: "Admin Firestore unavailable." };

  const sheets = getRosterSheetsApi();
  const spreadsheetId = getClubRosterSpreadsheetId();
  if (!sheets || !spreadsheetId) {
    return { ok: false, error: "Sheets client not configured." };
  }

  const sheetId = await ensureStudentMeetingTab(sheets, spreadsheetId);
  const result = await rebuildStudentMeetingSheet(db, sheets, spreadsheetId, sheetId);
  return { ok: true, ...result };
}
