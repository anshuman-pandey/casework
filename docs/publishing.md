# Publish a reviewable preview

[← Project](../README.md)

This is a maintainer procedure, not a prerequisite for running the source bundle. The intended public destination is `anshuman-pandey/casework`. Repository creation needs owner permissions; a GitHub integration that can read or push selected repositories may still be unable to create one.

## Initial repository

Create a public, empty `casework` repository under the intended account, without initializing a README, license or .gitignore. This checkout already contains those files and committed history. With an owner-authorized GitHub CLI:

```sh
gh repo create anshuman-pandey/casework --public --source . --remote origin --push
```

If it was created in the web interface instead, from this committed checkout:

```sh
git remote add origin https://github.com/anshuman-pandey/casework.git
git push -u origin main
```

If `origin` already exists, inspect `git remote -v` and use it only when it points to the intended repository. Do not overwrite another repository's history. Grant the connected GitHub integration access to this repository if it cannot see or push it. Remove the publication-pending note in the README once the public URL has been verified.

Enable private vulnerability reporting in the repository's Security settings, then put the verified reporting route in SECURITY.md. Check that the issue forms, screenshots, license and Actions workflow render on GitHub. Contributors can use forks and PRs without direct write access.

## Versioned source release

Keep VERSION, the feature-status table and validation record accurate. Run the Python, browser and Docker checks. Commit the final tree and package it:

```sh
python3 scripts/package_release.py
```

The script refuses a dirty checkout. It writes a source ZIP, SOURCE.json with the exact commit, and SHA256SUMS outside the repository. No database, secret file, Git credentials or local environment is included. Test the ZIP after extraction using `python3 -m casework --demo` before publishing.

Create a **prerelease**, with the exact tested commit as its target and the three files attached. Name the current tag `v0.1.0-preview.1`. Include working startup instructions and the synthetic-data/single-user boundary in the release notes. A preview must not imply that model-backed agents or production authentication exist.

GitHub will also provide source archives for the tag. Link to the specific preview release; GitHub's `/releases/latest` endpoint may skip prereleases. Verify the public ZIP download and checksums after upload.
