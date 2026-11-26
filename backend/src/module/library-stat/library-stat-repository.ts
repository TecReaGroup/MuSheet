import { sql } from 'drizzle-orm';
import type { LibraryStatView } from '../../../../contract/api';
import { db } from '../../db/client';
import { annotationPage, appUser, part, pdfFile, score, setlist } from '../../db/schema';
import { TEAM_SPACE_KEY } from '../space/space-key';

interface LibraryStatRow extends Record<string, unknown> {
  member_count: number;
  personal_score_count: number;
  team_score_count: number;
  personal_setlist_count: number;
  team_setlist_count: number;
  part_count: number;
  annotated_page_count: number;
  pdf_file_count: number;
  pdf_byte_size: number;
}

/** One round trip; the byte sum is cast to float8 because postgres-js returns bigint as a string. */
export async function readLibraryStat(): Promise<LibraryStatView> {
  const [row] = await db.execute<LibraryStatRow>(sql`
    select
      (select count(*)::int from ${appUser}) as member_count,
      (select count(*)::int from ${score} where ${score.spaceKey} <> ${TEAM_SPACE_KEY}) as personal_score_count,
      (select count(*)::int from ${score} where ${score.spaceKey} = ${TEAM_SPACE_KEY}) as team_score_count,
      (select count(*)::int from ${setlist} where ${setlist.spaceKey} <> ${TEAM_SPACE_KEY}) as personal_setlist_count,
      (select count(*)::int from ${setlist} where ${setlist.spaceKey} = ${TEAM_SPACE_KEY}) as team_setlist_count,
      (select count(*)::int from ${part}) as part_count,
      (select count(*)::int from ${annotationPage}) as annotated_page_count,
      (select count(*)::int from ${pdfFile}) as pdf_file_count,
      (select coalesce(sum(${pdfFile.byteSize}), 0)::float8 from ${pdfFile}) as pdf_byte_size
  `);
  return {
    // Root lives in .env, not in app_user.
    userCount: row.member_count + 1,
    score: { personal: row.personal_score_count, team: row.team_score_count },
    setlist: { personal: row.personal_setlist_count, team: row.team_setlist_count },
    partCount: row.part_count,
    annotatedPageCount: row.annotated_page_count,
    pdfFileCount: row.pdf_file_count,
    pdfByteSize: row.pdf_byte_size,
  };
}
