import { asc, eq, inArray } from 'drizzle-orm';
import type { PartView, ScoreSummary } from '../../../../contract/api';
import type { DbExecutor } from '../../db/client';
import { part, pdfFile, score } from '../../db/schema';
import { spaceOfKey } from '../space/space-key';

type ScoreRow = typeof score.$inferSelect;

/** Attaches ordered parts to score rows, preserving the input row order. */
export async function toScoreSummaries(executor: DbExecutor, rows: ScoreRow[]): Promise<ScoreSummary[]> {
  if (rows.length === 0) return [];
  const partRows = await executor
    .select({
      id: part.id,
      scoreId: part.scoreId,
      instrument: part.instrument,
      customLabel: part.customLabel,
      sha256: pdfFile.sha256,
      pageCount: pdfFile.pageCount,
      hasThumbnail: pdfFile.hasThumbnail,
    })
    .from(part)
    .innerJoin(pdfFile, eq(part.pdfSha256, pdfFile.sha256))
    .where(inArray(part.scoreId, rows.map(row => row.id)))
    .orderBy(asc(part.position), asc(part.createdAt));

  const partsByScore = new Map<string, PartView[]>();
  for (const { scoreId, ...partView } of partRows) {
    const list = partsByScore.get(scoreId) ?? [];
    list.push(partView);
    partsByScore.set(scoreId, list);
  }

  return rows.map(row => ({
    id: row.id,
    space: spaceOfKey(row.spaceKey),
    title: row.title,
    composer: row.composer,
    bpm: row.bpm,
    timeSignature: row.timeSignature,
    createdAt: row.createdAt.toISOString(),
    lastOpenedAt: row.lastOpenedAt?.toISOString() ?? null,
    parts: partsByScore.get(row.id) ?? [],
  }));
}

export async function loadScoreSummary(executor: DbExecutor, scoreId: string): Promise<ScoreSummary | undefined> {
  const rows = await executor.select().from(score).where(eq(score.id, scoreId));
  const [summary] = await toScoreSummaries(executor, rows);
  return summary;
}
