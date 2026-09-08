# DRAFT - BRANDING PENDING

**Status:** Internal operating document. Use now, but treat as v1 until validated by real Threadline prospects/clients.

---

# SOP 10 - Create / Revise an SOP

## Trigger
A process has been run successfully at least twice in approximately the same way and documenting it would reduce errors, training time or dependence on memory.

## Objective
Create an SOP that somebody can actually execute without the author sitting beside them.

## SOP creation sequence
### 1. Prove before documenting
Do not SOP a speculative process. Link the real runs/examples that proved it.

### 2. Define the output
One sentence: **"When this SOP is complete, X exists/is true."**

### 3. Define trigger and owner
State exactly when it starts, how often, primary owner and backup/escalation owner.

### 4. List required inputs/access
Accounts, source files, client dependencies, permissions, tools, templates.

### 5. Write exact actions in chronological order
Use numbered actions. One action should represent one observable step. Include links/template names where possible.

### 6. Add decision branches
For each realistic fork: `IF X -> do Y; ELSE -> continue to step Z.` Do not hide judgement inside vague phrases like "handle accordingly".

### 7. Add quality gate / definition of done
State what must be checked before the SOP can be closed.

### 8. Add failure modes + escalation
List the 3-5 most common mistakes/blockers and exactly when to escalate.

### 9. Add a correct example
Attach/link a completed output from a real run where possible.

### 10. Add NEXT SOP / return path
Every operational SOP must end with:
- `NEXT SOP: ...` or
- `RETURN TO: ...`.
This prevents dead ends and is mandatory.

### 11. Test it
Have another person execute it, OR execute the next real run using only the written SOP. Record ambiguity/errors.

### 12. Revise/version
Add version/date/owner. Change SOP when evidence shows process changed; do not rewrite it because one person had a preference.

## SOP quality checklist
- [ ] purpose/output is unambiguous;
- [ ] trigger is objective;
- [ ] owner/backup clear;
- [ ] exact inputs/access listed;
- [ ] chronological numbered steps;
- [ ] decision branches explicit;
- [ ] definition of done measurable/observable;
- [ ] common failures + escalation;
- [ ] real example/template linked;
- [ ] NEXT SOP/RETURN path included;
- [ ] tested on real work;
- [ ] version/date/owner present.

## Routing rule for the SOP library
When adding a new SOP, update `00_MASTER_SOP_ROUTER_AND_STAGE_GATES.md` if the new SOP changes the main lifecycle or creates a new trigger. If it is a sub-SOP, add it inside the parent SOP at the exact step where it should be called.

## Definition of done
A person can start from the trigger, follow the document without oral explanation, produce the expected output, and know exactly what SOP/process comes next.

## NEXT SOP
Return to the operating SOP that triggered this SOP creation/revision.
