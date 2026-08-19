#!/usr/bin/env bash
# ==============================================================================
# HyperClick Pro 2026 - Automated Git Release & Push Script (Bash)
# ==============================================================================

set -e

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Default values
MESSAGE=""
TAG=""
BUMP="none"
BRANCH="main"
REMOTE="origin"
SKIP_TAG=false
NO_PUSH=false
FORCE=false

# Helper functions
print_header() {
    echo -e "\n${CYAN}========================================================${NC}"
    echo -e "  ${WHITE}$1${NC}"
    echo -e "${CYAN}========================================================${NC}\n"
}

print_step() {
    echo -e "${CYAN}[$1]${NC} ${WHITE}$2${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} ${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} ${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} ${RED}$1${NC}"
}

# Parse Arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -m|--message) MESSAGE="$2"; shift ;;
        -t|--tag) TAG="$2"; shift ;;
        -b|--bump) BUMP="$2"; shift ;;
        --branch) BRANCH="$2"; shift ;;
        --remote) REMOTE="$2"; shift ;;
        -s|--skip-tag) SKIP_TAG=true ;;
        -n|--no-push) NO_PUSH=true ;;
        -f|--force) FORCE=true ;;
        -h|--help)
            echo "Usage: ./scripts/git-push.sh [options]"
            echo "Options:"
            echo "  -m, --message <msg>   Commit message"
            echo "  -t, --tag <tag>       Tag name (e.g. v1.0.1)"
            echo "  -b, --bump <type>     Bump type: patch | minor | major"
            echo "  --branch <branch>     Git branch (default: main)"
            echo "  --remote <remote>     Git remote (default: origin)"
            echo "  -s, --skip-tag        Skip tag creation and pushing"
            echo "  -n, --no-push         Commit only, do not push"
            echo "  -f, --force           Force push tag if already exists"
            echo "  -h, --help            Show this help dialog"
            exit 0
            ;;
        *)
            if [ -z "$MESSAGE" ]; then
                MESSAGE="$1"
            fi
            ;;
    esac
    shift
done

print_header "HyperClick Pro 2026 - Automated Git Release Engine"

# 1. Verify Git Repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    print_error "Current directory is not a valid Git repository."
    exit 1
fi

# 2. Get and Bump package.json Version
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_PATH="$SCRIPT_DIR/../package.json"
CURRENT_VERSION="1.0.0"

if [ -f "$PKG_PATH" ]; then
    CURRENT_VERSION=$(node -p "require('$PKG_PATH').version" 2>/dev/null || echo "1.0.0")
    print_step "VERSION" "Current package.json version: v$CURRENT_VERSION"

    if [ "$BUMP" != "none" ]; then
        IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
        case "$BUMP" in
            major)
                MAJOR=$((MAJOR + 1))
                MINOR=0
                PATCH=0
                ;;
            minor)
                MINOR=$((MINOR + 1))
                PATCH=0
                ;;
            patch)
                PATCH=$((PATCH + 1))
                ;;
            *)
                print_warning "Unknown bump type '$BUMP'. Supported: patch, minor, major."
                ;;
        esac

        NEW_VERSION="$MAJOR.$MINOR.$PATCH"
        node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('$PKG_PATH', 'utf8'));
            pkg.version = '$NEW_VERSION';
            fs.writeFileSync('$PKG_PATH', JSON.stringify(pkg, null, 2) + '\n');
        "
        print_success "Bumped version: v$CURRENT_VERSION -> v$NEW_VERSION"
        CURRENT_VERSION="$NEW_VERSION"
        if [ -z "$TAG" ] && [ "$SKIP_TAG" = false ]; then
            TAG="v$NEW_VERSION"
        fi
    fi
fi

# 3. Check Working Tree Status
print_step "STATUS" "Checking Git working tree status..."
GIT_STATUS=$(git status --porcelain)

if [ -z "$GIT_STATUS" ]; then
    print_warning "Working tree is clean. No unstaged or uncommitted changes found."
    if [ -z "$TAG" ]; then
        read -p "Would you like to create and push a tag only? (y/N): " CREATE_TAG_ONLY
        if [[ ! "$CREATE_TAG_ONLY" =~ ^[Yy]$ ]]; then
            print_success "Nothing to commit or push. Exiting cleanly."
            exit 0
        fi
    fi
else
    echo -e "${GRAY}${GIT_STATUS}${NC}"
fi

# 4. Prompt for Commit Message
if [ -n "$GIT_STATUS" ]; then
    if [ -z "$MESSAGE" ]; then
        TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
        DEFAULT_MSG="feat(release): HyperClick Pro v$CURRENT_VERSION update [$TIMESTAMP]"
        echo -e "\n${YELLOW}Enter commit message (press Enter for default: '$DEFAULT_MSG'):${NC}"
        read -p "> " INPUT_MSG
        if [ -z "$INPUT_MSG" ]; then
            MESSAGE="$DEFAULT_MSG"
        else
            MESSAGE="$INPUT_MSG"
        fi
    fi

    # 5. Stage & Commit Changes
    print_step "STAGE" "Staging all tracked and untracked changes..."
    git add -A

    print_step "COMMIT" "Committing with message: '$MESSAGE'..."
    git commit -m "$MESSAGE"
    print_success "Changes successfully committed!"
fi

# 6. Tag Management
if [ "$SKIP_TAG" = false ]; then
    if [ -z "$TAG" ]; then
        read -p "Create and push a release tag for v$CURRENT_VERSION? (y/N): " PROMPT_TAG
        if [[ "$PROMPT_TAG" =~ ^[Yy]$ ]]; then
            TAG="v$CURRENT_VERSION"
        fi
    fi

    if [ -n "$TAG" ]; then
        # Ensure 'v' prefix
        if [[ ! "$TAG" =~ ^v ]]; then
            TAG="v$TAG"
        fi

        if git tag -l "$TAG" | grep -q "^$TAG$"; then
            print_warning "Tag $TAG already exists locally."
            if [ "$FORCE" = true ]; then
                print_step "TAG" "Force replacing local tag $TAG..."
                git tag -d "$TAG" >/dev/null 2>&1
                git tag -a "$TAG" -m "HyperClick Pro Release $TAG"
                print_success "Created annotated tag: $TAG"
            fi
        else
            print_step "TAG" "Creating annotated tag: $TAG..."
            git tag -a "$TAG" -m "HyperClick Pro Release $TAG"
            print_success "Created annotated tag: $TAG"
        fi
    fi
fi

# 7. Push Commits & Tags to Remote
if [ "$NO_PUSH" = false ]; then
    print_step "PUSH" "Pushing commits to $REMOTE/$BRANCH..."
    if ! git push "$REMOTE" "$BRANCH"; then
        print_warning "Normal push failed. Attempting with upstream tracking: git push -u $REMOTE $BRANCH..."
        git push -u "$REMOTE" "$BRANCH"
    fi
    print_success "Commits successfully pushed to $REMOTE/$BRANCH!"

    if [ -n "$TAG" ] && [ "$SKIP_TAG" = false ]; then
        print_step "PUSH" "Pushing tag $TAG to $REMOTE..."
        if [ "$FORCE" = true ]; then
            git push "$REMOTE" "$TAG" --force
        else
            git push "$REMOTE" "$TAG"
        fi
        print_success "Tag $TAG successfully pushed to $REMOTE!"
        echo -e "${CYAN}  -> GitHub Actions CI/CD release workflow will automatically trigger.${NC}"
    fi
else
    print_warning "Skipping push (--no-push specified)."
fi

print_header "Release Automation Complete!"
