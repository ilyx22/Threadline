-- The visitor token identifies a browser, not a person, and it is now unique
-- per organisation rather than globally. One browser that reads two clients'
-- content therefore gets a single cookie value and two independent visitor
-- rows, so neither client can be linked to the other through it.
--
-- Safe against existing data: the Visitor table is introduced by the preceding
-- migration in this same pass and holds no rows in any environment.
DROP INDEX "Visitor_token_key";
CREATE UNIQUE INDEX "Visitor_orgId_token_key" ON "Visitor"("orgId", "token");
