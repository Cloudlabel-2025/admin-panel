@echo off
echo ========================================
echo PROJECT GIT HISTORY REPORT
echo ========================================
echo.

echo === All Contributors ===
git log --format="%%an <%%ae>" | sort | uniq
echo.

echo === Commit Count by Author ===
git shortlog -sn --all
echo.

echo === Recent Commits (Last 20) ===
git log --pretty=format:"%%h - %%an, %%ar : %%s" -20
echo.

echo === File Change Statistics by Author ===
git log --shortstat --pretty="%%cN" | sed 's/\(.*\)/\L\1/' | grep -v "^$" | awk 'BEGIN { line=""; } !/^ / { if (line=="" || !match(line, $0)) {line = $0; print $0} } /^ / { print line " # " $0; line=""}' | sort | sed -E 's/# //;s/ files? changed,//;s/([0-9]+) ([0-9]+ deletion)/\1 0 insertions\(+\), \2/;s/\(\+\)$/\(\+\), 0 deletions\(-\)/;s/insertions?\(\+\), //;s/ deletions?\(-\)//' | awk 'BEGIN {name=""; files=0; insertions=0; deletions=0;} {if ($1 != name && name != "") { print name ": " files " files changed, " insertions " insertions(+), " deletions " deletions(-)"; files=0; insertions=0; deletions=0; name=$1; } name=$1; files+=$2; insertions+=$3; deletions+=$4; } END {print name ": " files " files changed, " insertions " insertions(+), " deletions " deletions(-)"}'
echo.

echo === Files Modified Most ===
git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -20
echo.

echo Report generated successfully!
pause
