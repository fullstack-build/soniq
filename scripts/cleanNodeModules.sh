cd packages
for d in */ ; do
  cd "$d"
  pwd
  rm -rf node_modules/
  echo " "
  echo " "
  cd ..
done