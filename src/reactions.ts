/**
 * Reaction that deletes a posted quote — a real `notes/delete`, not a
 * soft-delete/edit-away like OpenMiQ's Discord delete button, since this
 * Misskey instance has no note-edit API to fall back on. See
 * `handlers/reaction.ts`.
 *
 * No trailing U+FE0F (variation selector-16): Misskey's `ReactionService`
 * normalizes every reaction server-side by stripping it from any
 * non-ZWJ emoji before storing/broadcasting it, so a client that sends the
 * VS16 form (most emoji pickers do) still round-trips back through the
 * `notification` stream event as this — bare — form. Comparing against the
 * VS16 form here would never match.
 */
export const DELETE_REACTION_EMOJI = "🗑";
