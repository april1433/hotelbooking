/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PGlite } from "@electric-sql/pglite";

export async function handlePostgrestRequest(
  db: PGlite,
  table: string,
  method: string,
  searchParams: URLSearchParams,
  body: any,
  headers: Headers
): Promise<{ status: number; data: any; headers?: Record<string, string> }> {
  try {
    // Sanitize table name
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      return { status: 400, data: { message: "Invalid table name" } };
    }

    const preferHeader = headers.get("prefer") || "";
    const acceptHeader = headers.get("accept") || "";
    const isSingleObject = acceptHeader.includes("vnd.pgrst.object+json") || preferHeader.includes("return=representation");

    // Build WHERE conditions
    const whereClauses: string[] = [];
    const params: any[] = [];

    searchParams.forEach((val, key) => {
      if (["select", "order", "limit", "offset", "columns", "on_conflict"].includes(key)) return;

      const paramIdx = () => params.length;

      if (val.startsWith("eq.")) {
        params.push(val.slice(3));
        whereClauses.push(`"${key}" = $${paramIdx()}`);
      } else if (val.startsWith("neq.")) {
        params.push(val.slice(4));
        whereClauses.push(`"${key}" != $${paramIdx()}`);
      } else if (val.startsWith("gt.")) {
        params.push(val.slice(3));
        whereClauses.push(`"${key}" > $${paramIdx()}`);
      } else if (val.startsWith("gte.")) {
        params.push(val.slice(4));
        whereClauses.push(`"${key}" >= $${paramIdx()}`);
      } else if (val.startsWith("lt.")) {
        params.push(val.slice(3));
        whereClauses.push(`"${key}" < $${paramIdx()}`);
      } else if (val.startsWith("lte.")) {
        params.push(val.slice(4));
        whereClauses.push(`"${key}" <= $${paramIdx()}`);
      } else if (val.startsWith("like.")) {
        params.push(val.slice(5));
        whereClauses.push(`"${key}" LIKE $${paramIdx()}`);
      } else if (val.startsWith("ilike.")) {
        params.push(val.slice(6));
        whereClauses.push(`"${key}" ILIKE $${paramIdx()}`);
      } else if (val === "is.null") {
        whereClauses.push(`"${key}" IS NULL`);
      } else if (val === "is.not.null") {
        whereClauses.push(`"${key}" IS NOT NULL`);
      } else if (val.startsWith("in.(")) {
        const items = val.slice(4, -1).split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        const placeholders = items.map((item) => {
          params.push(item);
          return `$${paramIdx()}`;
        });
        whereClauses.push(`"${key}" IN (${placeholders.join(",")})`);
      } else if (val.startsWith("not.in.(")) {
        const items = val.slice(8, -1).split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        const placeholders = items.map((item) => {
          params.push(item);
          return `$${paramIdx()}`;
        });
        whereClauses.push(`"${key}" NOT IN (${placeholders.join(",")})`);
      } else if (val.startsWith("not.eq.")) {
        params.push(val.slice(7));
        whereClauses.push(`"${key}" != $${paramIdx()}`);
      }
    });

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // ── GET (SELECT) ────────────────────────────────────────────────────────
    if (method === "GET") {
      const selectParam = searchParams.get("select") || "*";
      let selectCols = "*";

      if (selectParam !== "*" && !selectParam.includes("(")) {
        const rawCols = selectParam.split(",").map((c) => c.trim().split(":")[0]).filter(Boolean);
        if (rawCols.length > 0 && !rawCols.includes("*")) {
          selectCols = rawCols.map((c) => `"${c}"`).join(", ");
        }
      }

      let orderSql = "";
      const orderParam = searchParams.get("order");
      if (orderParam) {
        const parts = orderParam.split(".");
        const col = parts[0];
        const dir = parts[1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        orderSql = `ORDER BY "${col}" ${dir}`;
      }

      let limitSql = "";
      const limitParam = searchParams.get("limit");
      if (limitParam) {
        limitSql = `LIMIT ${parseInt(limitParam, 10)}`;
      }

      let offsetSql = "";
      const offsetParam = searchParams.get("offset");
      if (offsetParam) {
        offsetSql = `OFFSET ${parseInt(offsetParam, 10)}`;
      }

      const sql = `SELECT ${selectCols} FROM "${table}" ${whereSql} ${orderSql} ${limitSql} ${offsetSql};`;
      const result = await db.query(sql, params);
      let rows = result.rows;

      // Handle relation embeds if requested (e.g. hotels(name), room_types(*), guests(...))
      if (selectParam.includes("(")) {
        rows = await enrichRelationEmbeds(db, table, rows, selectParam);
      }

      if (isSingleObject) {
        if (rows.length === 0) {
          return {
            status: 406,
            data: { details: "The result contains 0 rows", message: "JSON object requested, multiple (or no) rows returned" },
          };
        }
        return { status: 200, data: rows[0] };
      }

      const respHeaders: Record<string, string> = {
        "content-type": "application/json",
      };
      if (preferHeader.includes("count=exact")) {
        const countRes = await db.query<{ count: string }>(`SELECT count(*) FROM "${table}" ${whereSql};`, params);
        const total = countRes.rows[0]?.count ?? rows.length;
        respHeaders["content-range"] = `0-${rows.length - 1}/${total}`;
      }

      return { status: 200, data: rows, headers: respHeaders };
    }

    // ── POST (INSERT / UPSERT) ──────────────────────────────────────────────
    if (method === "POST") {
      const records = Array.isArray(body) ? body : [body];
      if (records.length === 0) return { status: 200, data: [] };

      const cols = Object.keys(records[0]);
      const insertedRows = [];

      const onConflict = searchParams.get("on_conflict");
      let conflictSql = "";
      if (onConflict) {
        const updateCols = cols.filter((c) => c !== onConflict).map((c) => `"${c}" = EXCLUDED."${c}"`).join(", ");
        conflictSql = `ON CONFLICT ("${onConflict}") DO UPDATE SET ${updateCols}`;
      }

      for (const record of records) {
        const valPlaceholders = [];
        const recordParams = [];

        for (const col of cols) {
          recordParams.push(record[col]);
          valPlaceholders.push(`$${recordParams.length}`);
        }

        const sql = `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")})
                     VALUES (${valPlaceholders.join(", ")})
                     ${conflictSql}
                     RETURNING *;`;

        const res = await db.query(sql, recordParams);
        if (res.rows[0]) insertedRows.push(res.rows[0]);
      }

      if (isSingleObject || !Array.isArray(body)) {
        return { status: 201, data: insertedRows[0] ?? body };
      }

      return { status: 201, data: insertedRows };
    }

    // ── PATCH / PUT (UPDATE) ────────────────────────────────────────────────
    if (method === "PATCH" || method === "PUT") {
      const setClauses: string[] = [];
      const updateParams = [...params];

      Object.entries(body || {}).forEach(([col, val]) => {
        updateParams.push(val);
        setClauses.push(`"${col}" = $${updateParams.length}`);
      });

      if (setClauses.length === 0) {
        return { status: 200, data: [] };
      }

      const sql = `UPDATE "${table}" SET ${setClauses.join(", ")} ${whereSql} RETURNING *;`;
      const res = await db.query(sql, updateParams);

      if (isSingleObject) {
        return { status: 200, data: res.rows[0] ?? null };
      }

      return { status: 200, data: res.rows };
    }

    // ── DELETE ──────────────────────────────────────────────────────────────
    if (method === "DELETE") {
      const sql = `DELETE FROM "${table}" ${whereSql} RETURNING *;`;
      const res = await db.query(sql, params);
      return { status: 200, data: res.rows };
    }

    return { status: 405, data: { message: "Method not allowed" } };
  } catch (err: any) {
    console.error(`❌ [PostgREST Error] ${method} /${table}:`, err.message ?? err);
    return { status: 500, data: { message: err.message ?? "Database execution error" } };
  }
}

async function fetchRelationRecord(db: PGlite, relName: string, id: string, subSelect: string) {
  try {
    const res = await db.query(`SELECT * FROM "${relName}" WHERE id = $1 LIMIT 1;`, [id]);
    const record: any = res.rows[0];
    if (!record) return null;

    // Check if subSelect contains nested relations e.g. room_types(name) inside rooms(...)
    if (subSelect.includes("(")) {
      const enrichedList = await enrichRelationEmbeds(db, relName, [record], subSelect);
      return enrichedList[0] ?? record;
    }

    // Filter fields if specified and not '*'
    if (subSelect && subSelect !== "*") {
      const fieldList = subSelect.split(",").map((f) => f.trim().split("(")[0].trim()).filter(Boolean);
      const filteredRecord: Record<string, any> = {};
      fieldList.forEach((f) => {
        if (f in record) filteredRecord[f] = record[f];
      });
      return filteredRecord;
    }

    return record;
  } catch {
    return null;
  }
}

async function enrichRelationEmbeds(db: PGlite, table: string, rows: any[], selectParam: string) {
  if (!rows || rows.length === 0 || !selectParam.includes("(")) return rows;

  // Match top-level relations like: guests(...), rooms(...)
  const topEmbedRegex = /([a-zA-Z0-9_]+)\(([^()]*|\((?:[^()]+|\([^()]*\))*\))*\)/g;
  const embedMatches = Array.from(selectParam.matchAll(topEmbedRegex));

  for (const match of embedMatches) {
    const relName = match[1]; // e.g. "guests", "rooms", "hotels", "room_types", "profiles"
    const relFields = match[2] ? match[2].trim() : "*";

    let fkCol = "";
    if (relName === "hotels") fkCol = "hotel_id";
    else if (relName === "room_types") fkCol = "room_type_id";
    else if (relName === "rooms") fkCol = "room_id";
    else if (relName === "guests") fkCol = "guest_id";
    else if (relName === "profiles") fkCol = "profile_id";

    for (const row of rows) {
      const fkVal = row[fkCol] || (relName === "profiles" ? (row.profile_id || row.user_id || row.id) : null);
      if (fkVal) {
        row[relName] = await fetchRelationRecord(db, relName, fkVal, relFields);
      } else {
        row[relName] = null;
      }
    }
  }

  return rows;
}
