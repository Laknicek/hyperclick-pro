<#
.SYNOPSIS
    Automated Git Release & Push Automation Script for HyperClick Pro 2026.
.DESCRIPTION
    Checks working tree status, stages changes, handles version bumping (major/minor/patch),
    creates annotated SemVer git tags, and pushes commits & tags to GitHub remote.
.EXAMPLE
    .\scripts\git-push.ps1 -Message "feat: add quantum click engine" -Bump patch
.EXAMPLE
    .\scripts\git-push.ps1 -Message "chore: maintenance update" -SkipTag
.EXAMPLE
    .\scripts\git-push.ps1
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Message,

    [Parameter(Position = 1)]
    [string]$Tag,

    [ValidateSet("patch", "minor", "major", "none")]
    [string]$Bump = "none",

    [string]$Branch = "main",

    [string]$Remote = "origin",

    [switch]$SkipTag,

    [switch]$NoPush,

    [switch]$Force
)

# Set UTF-8 Output
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Color Helper Functions
function Write-Header {
    param([string]$text)
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor White
    Write-Host "========================================================`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$badge, [string]$text)
    Write-Host "[$badge] " -ForegroundColor Cyan -NoNewline
    Write-Host "$text" -ForegroundColor White
}

function Write-Success {
    param([string]$text)
    Write-Host "[SUCCESS] " -ForegroundColor Green -NoNewline
    Write-Host "$text" -ForegroundColor Green
}

function Write-WarningMsg {
    param([string]$text)
    Write-Host "[WARNING] " -ForegroundColor Yellow -NoNewline
    Write-Host "$text" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$text)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host "$text" -ForegroundColor Red
}

# ---------------------------------------------------------------------------
# 1. Verify Git Repository
# ---------------------------------------------------------------------------
Write-Header "HyperClick Pro 2026 - Automated Git Release Engine"

try {
    $null = git rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Current directory is not a valid Git repository."
        exit 1
    }
} catch {
    Write-ErrorMsg "Git command not found or failed."
    exit 1
}

# ---------------------------------------------------------------------------
# 2. Version Bump Logic (package.json)
# ---------------------------------------------------------------------------
$pkgPath = Join-Path $PSScriptRoot "..\package.json"
$currentVersion = "1.0.0"

if (Test-Path $pkgPath) {
    try {
        $pkgJson = Get-Content $pkgPath -Raw | ConvertFrom-Json
        $currentVersion = $pkgJson.version
        Write-Step "VERSION" "Current package.json version: v$currentVersion"

        if ($Bump -ne "none") {
            $semverParts = $currentVersion.Split('.')
            $major = [int]$semverParts[0]
            $minor = [int]$semverParts[1]
            $patch = [int]$semverParts[2]

            switch ($Bump) {
                "major" { $major += 1; $minor = 0; $patch = 0 }
                "minor" { $minor += 1; $patch = 0 }
                "patch" { $patch += 1 }
            }

            $newVersion = "$major.$minor.$patch"
            $pkgJson.version = $newVersion
            
            # Save updated package.json with pretty indentation
            $updatedJsonStr = $pkgJson | ConvertTo-Json -Depth 10
            Set-Content -Path $pkgPath -Value $updatedJsonStr -Encoding UTF8
            
            Write-Success "Bumped version: v$currentVersion -> v$newVersion"
            $currentVersion = $newVersion
            if (-not $Tag -and -not $SkipTag) {
                $Tag = "v$newVersion"
            }
        }
    } catch {
        Write-WarningMsg "Failed to read or update package.json version: $_"
    }
}

# ---------------------------------------------------------------------------
# 3. Check Working Tree Status
# ---------------------------------------------------------------------------
Write-Step "STATUS" "Checking Git working tree status..."
$gitStatus = git status --porcelain

if (-not $gitStatus) {
    Write-WarningMsg "Working tree is clean. No unstaged or uncommitted changes found."
    if (-not $Tag) {
        $createTagOnly = Read-Host "Would you like to create and push a tag only? (y/N)"
        if ($createTagOnly -ne 'y' -and $createTagOnly -ne 'Y') {
            Write-Success "Nothing to commit or push. Exiting cleanly."
            exit 0
        }
    }
} else {
    Write-Host "$gitStatus" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
# 4. Prompt for Commit Message if Not Provided
# ---------------------------------------------------------------------------
if ($gitStatus) {
    if (-not $Message) {
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm")
        $defaultMsg = "feat(release): HyperClick Pro v$currentVersion update [$timestamp]"
        Write-Host "`nEnter commit message (press Enter for default: '$defaultMsg'):" -ForegroundColor Yellow
        $inputMsg = Read-Host "> "
        if ([string]::IsNullOrWhiteSpace($inputMsg)) {
            $Message = $defaultMsg
        } else {
            $Message = $inputMsg
        }
    }

    # -----------------------------------------------------------------------
    # 5. Stage & Commit Changes
    # -----------------------------------------------------------------------
    Write-Step "STAGE" "Staging all tracked and untracked changes..."
    git add -A
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Failed to stage changes with 'git add -A'."
        exit 1
    }

    Write-Step "COMMIT" "Committing with message: '$Message'..."
    git commit -m "$Message"
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Git commit failed."
        exit 1
    }
    Write-Success "Changes successfully committed!"
}

# ---------------------------------------------------------------------------
# 6. Tag Management
# ---------------------------------------------------------------------------
if (-not $SkipTag) {
    if (-not $Tag) {
        $promptTag = Read-Host "`nCreate and push a release tag for v$currentVersion? (y/N)"
        if ($promptTag -eq 'y' -or $promptTag -eq 'Y') {
            $Tag = "v$currentVersion"
        }
    }

    if ($Tag) {
        # Ensure tag has 'v' prefix
        if (-not $Tag.StartsWith("v")) {
            $Tag = "v$Tag"
        }

        # Check if tag already exists locally or remotely
        $existingTag = git tag -l $Tag
        if ($existingTag) {
            Write-WarningMsg "Tag $Tag already exists locally."
            if ($Force) {
                Write-Step "TAG" "Force replacing local tag $Tag..."
                git tag -d $Tag 2>$null
                git tag -a $Tag -m "HyperClick Pro Release $Tag"
                Write-Success "Created annotated tag: $Tag"
            }
        } else {
            Write-Step "TAG" "Creating annotated tag: $Tag..."
            git tag -a $Tag -m "HyperClick Pro Release $Tag"
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Created annotated tag: $Tag"
            } else {
                Write-WarningMsg "Failed to create tag $Tag."
            }
        }
    }
}

# ---------------------------------------------------------------------------
# 7. Push Commits & Tags to Remote
# ---------------------------------------------------------------------------
if (-not $NoPush) {
    Write-Step "PUSH" "Pushing commits to $Remote/$Branch..."
    
    # Check if upstream is set
    git push $Remote $Branch
    if ($LASTEXITCODE -ne 0) {
        Write-WarningMsg "Normal push failed. Attempting with upstream setup: git push -u $Remote $Branch..."
        git push -u $Remote $Branch
        if ($LASTEXITCODE -ne 0) {
            Write-ErrorMsg "Push to $Remote/$Branch failed. Check remote URL and permissions."
            exit 1
        }
    }
    Write-Success "Commits successfully pushed to $Remote/$Branch!"

    # Push Tag if created
    if ($Tag -and (-not $SkipTag)) {
        Write-Step "PUSH" "Pushing tag $Tag to $Remote..."
        if ($Force) {
            git push $Remote $Tag --force
        } else {
            git push $Remote $Tag
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Success "Tag $Tag successfully pushed to $Remote!"
            Write-Host "  -> GitHub Actions CI/CD release workflow will automatically trigger." -ForegroundColor Cyan
        } else {
            Write-WarningMsg "Failed to push tag $Tag to $Remote."
        }
    }
} else {
    Write-WarningMsg "Skipping push (--NoPush specified)."
}

Write-Header "Release Automation Complete!"
