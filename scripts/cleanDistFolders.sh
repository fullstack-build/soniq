cd packages
for d in */ ; do
  cd "$d"
  pwd
  rm -rf dist/
  echo " "
  echo " "
  cd ..
done