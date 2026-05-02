import { MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';

type SoftDeletableTable =
  | 'projects'
  | 'posts'
  | 'resumeItems'
  | 'services'
  | 'testimonials'
  | 'aboutDailyRoutine'
  | 'aboutFaq'
  | 'checkouts'
  | 'proposals'
  | 'aiGeneratedResumes';

export async function softDeleteDoc(
  ctx: MutationCtx,
  table: SoftDeletableTable,
  id: Id<typeof table>,
  actorId: string,
) {
  await ctx.db.patch(id as any, {
    deletedAt: Date.now(),
    deletedBy: actorId as any,
  });
}

export async function restoreDoc(
  ctx: MutationCtx,
  table: SoftDeletableTable,
  id: Id<typeof table>,
) {
  await ctx.db.patch(id as any, {
    deletedAt: undefined,
    deletedBy: undefined,
  });
}
