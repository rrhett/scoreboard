#!/bin/bash
set -e

# Verify there are no pending changes and we are fully synced.
# Updates the package.json with major, minor or patch
# Commits the package.json update
# Tags the commit
# Pushes

# -s major|minor|patch
PUMP="false"
while getopts 's:' flag; do
  case "${flag}" in
    s) PUMP=${OPTARG} ;;
    *)
      echo "Invalid args"
      exit 1
      ;;
  esac
done

# Verify we are on the main branch
BRANCH=$(git branch --show-current --no-color)
if [[ "$BRANCH" != "main" ]]; then
  echo "release only works on branch 'main'"
  exit 1
fi

# Verify there are no changes and we are synced to HEAD
git remote update
STATUS=$(git status --porcelain)
if [ ! -z "$STATUS" ]; then
  echo "Not clean"
  exit 1
fi

# Fetch the current version out of package.json
VERSION=$(jq -r '.version' package.json)
MAJOR=$(echo "$VERSION" | cut -d '.' -f1)
MINOR=$(echo "$VERSION" | cut -d '.' -f2)
PATCH=$(echo "$VERSION" | cut -d '.' -f3)

# Bump the version
if [[ $PUMP == "major" ]]; then
  MAJOR=$((MAJOR + 1))
  MINOR=0
  PATCH=0
elif [[ $PUMP == "minor" ]]; then
  MINOR=$((MINOR + 1))
  PATCH=0
elif [[ $PUMP == "patch" ]]; then
  PATCH=$((PATCH + 1))
else
  echo "Must select -s major|minor|patch"
  exit 1
fi
NEXT_VERSION=$MAJOR.$MINOR.$PATCH

# Update package.json
echo "Pumping version: $VERSION => $NEXT_VERSION"
jq --arg version "$NEXT_VERSION" '.version = $version' package.json > package.json.tmp && mv package.json.tmp package.json

# Commit package.json
git commit -a -m "chore: version v$NEXT_VERSION"
git tag "v$NEXT_VERSION"

git push --tags
