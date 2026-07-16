param(
    [Parameter(Mandatory = $true)]
    [string]$BranchName
)

$ErrorActionPreference = "Stop"

git fetch origin
git switch main
git pull origin main
git switch -c $BranchName
