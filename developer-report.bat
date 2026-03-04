@echo off
echo ========================================
echo PROJECT DEVELOPER CONTRIBUTION REPORT
echo ========================================
echo.

echo === All Contributors ===
git log --format="%%an (%%ae)" --all | sort | uniq
echo.

echo === Total Commits by Each Developer ===
git shortlog -sn --all --no-merges
echo.

echo === Recent 30 Commits with Developer Names ===
git log --pretty=format:"%%h | %%ad | %%an | %%s" --date=short -30
echo.

echo === First and Last Commit Dates by Developer ===
git log --format="%%an|%%ad" --date=short --all | sort | awk -F"|" "{if (!first[$1]) first[$1]=$2; last[$1]=$2} END {for (name in first) print name \": First commit: \" first[name] \", Last commit: \" last[name]}"
echo.

echo === Files Changed by Each Developer (Top Contributors) ===
git log --all --numstat --format="%%n%%an" | awk 'NF==3 {files[$1]++; inserted[$1]+=$2; deleted[$1]+=$3} NF==1 {name=$0} END {for (i in files) printf "%%s: %%d files, +%%d insertions, -%%d deletions\n", i, files[i], inserted[i], deleted[i]}' | sort -t: -k2 -rn
echo.

echo Report completed!
echo.
pause
