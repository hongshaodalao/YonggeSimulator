---
name: sync
description: "Sync the project to GitHub in one step — stage, commit, and push all changes, then update the GitHub Pages deployment. Use whenever the user says sync, 提交, 推送, 同步, 同步到GitHub, commit and push, push to GitHub, or asks to save/upload their work to the repo — even if they don't say 'sync'."
---

# Sync to GitHub

Stage all changes, commit with a conventional message, push, and refresh the GitHub Pages deployment. The user asked for one thing, so carry the whole flow through — don't stop to ask between steps.

## Workflow

Run these in order, from the project root:

1. **Check for a repo.** Run `git status`. If it fails ("not a git repository"), run `git init -b main`, then add the remote unless `git remote -v` already shows one:
   `git remote add origin git@github.com:hongshaodalao/YonggeSimulator.git`
   Tell the user you initialized the repo.
2. **Review changes.** `git status --short` plus `git diff --stat` (and `git diff --cached --stat` if things are already staged) to see what's new or modified. If there is nothing to sync AND `gh-pages` already matches `main`, say so and stop — don't create an empty commit.
3. **Stage everything.** `git add -A`. If you spot files that look like secrets (`.env`, credentials, API keys, tokens), unstage/exclude them and tell the user why.
4. **Write the commit message.** If the command came with an argument (e.g. `/sync "fix mobile layout"`), use it verbatim. Otherwise summarize the diff and pick the dominant type from the convention below.
5. **Commit.** `git commit -m "<message>"`. If it fails because `user.name`/`user.email` are unset, stop and ask the user what identity to configure — never invent one.
6. **Push.** `git push -u origin HEAD`. Using `HEAD` instead of a hardcoded branch name avoids failures on repos whose default branch is `master`; `-u` is required on a branch's first push and harmless afterwards.
7. **Deploy to GitHub Pages.** The live site (https://hongshaodalao.github.io/YonggeSimulator/) builds from the `gh-pages` branch, so always update it after pushing:
   `git push origin HEAD:gh-pages`
   - If this is rejected as non-fast-forward, someone pushed to `gh-pages` directly — compare with `git fetch origin gh-pages` + `git log origin/gh-pages --oneline -3`; unless the remote commits are intentional, `git push -f origin HEAD:gh-pages` is acceptable (the branch is a deployment mirror of `main`, not independent work). Mention that you force-pushed.
   - Deployment takes ~1 minute; the site is current once `git ls-remote origin refs/heads/gh-pages` shows the new hash. No need to poll the URL every time.
8. **Report.** Give the commit hash, a one-line summary of what was pushed, and confirm the Pages update was pushed (site refreshes within ~1 minute). If a push failed, show the exact error and what it means (see below).

## Commit message convention

Conventional Commits, imperative mood, single line:

| Change | Prefix | Example |
|---|---|---|
| New code / feature | `feat:` | `feat: add daily challenge mode` |
| Bug fix | `fix:` | `fix: score panel overflow on mobile` |
| Design docs (设计文档*.md, GDD) | `docs:` | `docs: add mobile adaptation design doc` |
| Config / chores | `chore:` | `chore: update page metadata` |

Mixed changes: lead with the dominant type and mention the rest — `feat: add variants; docs: update design notes`.

## Push failures

- **Non-fast-forward** (`rejected ... fetch first`): run `git pull --rebase origin <branch>`, resolve conflicts if any, then push again.
- **Remote repo doesn't exist** (`Repository not found`): tell the user to create the repo on GitHub or confirm the remote URL — don't try to create it yourself.
- **Permission / SSH errors**: report them; the user needs to fix keys or repo access.
