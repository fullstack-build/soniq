cd packages
for d in */ ; do
  cd "$d"
  pwd
  npm install
  npm link
  echo " "
  echo " "
  cd ..
done