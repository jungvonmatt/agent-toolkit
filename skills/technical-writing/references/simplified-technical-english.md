# Simplified Technical English for software docs

[ASD-STE100](https://www.asd-ste100.org/) (Issue 9, January 2025) is a controlled language from aerospace maintenance. It helps most where a procedure is complex and the reader is not a native speaker. This file adapts its grammar rules to software documentation. It drops the closed STE dictionary: software terms such as run, check, call, and return stay, and the project's own terms replace the dictionary.

**Scope:** English documentation prose. Code, identifiers, paths, commands, URLs, and UI labels are exempt: write them verbatim. For documentation in German or another language, apply the same principles where its grammar allows. Blog posts use the core rules in `SKILL.md`, not this file.

## Words

1. **One term per concept, one meaning per term.** Take the term from the code or the UI. When the project keeps a glossary (`CONTEXT.md`, `GLOSSARY.md`), use its terms, and add a term you introduce.
2. **A verb for an action.** "Configure the cache", not "perform the configuration of the cache".
3. **Three nouns in a row at most**, not counting a code or product name. Rewrite a longer stack with "of", "for", or "that": "the refresh interval for the session token", not "the session token refresh interval".
4. **A one-word verb over a phrasal verb.** "Start", not "fire up". "Find", not "figure out". Terms of art stay: set up, log in, sign in, roll back, check out.
5. **Nouns as verbs** only when the term is established in the project (cache, commit, deploy).
6. **Modal verbs:** "must" for a requirement, "can" for an ability, "might" for a possibility. Use "should" and "may" only as defined RFC 2119 keywords in a normative spec.
7. **Full words** for "for example", "that is", and "and so on". Latin abbreviations confuse non-native readers.
8. **Keep the articles, "that", and the subject.** "If the package is installed, remove it", not "If installed, remove".
9. **Replace a pronoun with its noun** when "it", "this", or "they" can point at two things.
10. **American English spelling,** unless the project sets another locale.

## Sentences

11. **Simple verb forms.** Use the imperative, the simple present, the simple past, the simple future, and the past participle as an adjective ("the generated file"). Default to the present tense. Rewrite a perfect form ("has been created") or a progressive form ("is creating") as a simple one.
12. **Active voice.** Use the passive only when the actor is unknown or does not matter ("Logs are deleted after 30 days"), or in an error message where the active voice blames the user.
13. **"-ing" forms** only inside established terms and UI labels ("logging", "Troubleshooting"). Turn an "-ing" clause into its own sentence: "…, creating a new file" becomes "This creates a new file."
14. **Sentence length:** hold the limits of core rule 2 in `SKILL.md` strictly (STE sets 20 words for a procedure step and 25 for a description or a note). Count a code span, command, path, URL, UI label, proper name, or number with its unit as one word.
15. **One topic per paragraph,** at most six sentences.
16. **No semicolons** in prose. Write two sentences.
17. **Full forms** ("do not", "it is") unless the project's docs already use contractions. Keep one style per document.
18. **A vertical list** for three or more parallel items.

## Notes and warnings

- **A note gives information, never an instruction.** Turn an action in a note into a step.
- **A warning starts with the command or the condition, then states the consequence:** "Back up the database before you run `migrate --reset`. The command deletes all rows."
- **Pick the level by the harm:** a warning for data loss, a security exposure, or an outage. A caution for harm the reader can undo. A note for information only.
- **Place it before the step it concerns,** in the platform's callout syntax (`> [!WARNING]` on GitHub, `::: warning` in VitePress).

## Check

- [ ] No sentence exceeds its limit, counted as in rule 14.
- [ ] No semicolon, no "e.g.", "i.e.", or "etc." in prose.
- [ ] No stack of more than three nouns.
- [ ] No perfect or progressive verb form. A passive only where rule 12 allows it.
- [ ] Every concept has one term, and every term has one meaning.
- [ ] No note contains an instruction. Every warning names the condition and the consequence.
