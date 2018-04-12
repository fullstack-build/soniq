cd packages
for d in */ ; do
  cd "$d"
  pwd
  echo "npm run build"
  npm run build
  echo " "
  echo " "
  cd ..
done