const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <script>
  function go() {
    var data = <%=data%>;

    for(var i in data.origins) {
      try {
        window.opener.postMessage(data.message, data.origins[i]);
      } catch(e) {}
    }
    window.close();
  }

  window.onload = go;
  </script>
  <title>Authetication</title>
</head>
<body>
  <h1>This Page requires Javascript.</h1>
</body>
</html>`;

export default (message, origins) => {
  const data = {
    message,
    origins
  };

  return template.replace("<%=data%>", JSON.stringify(data));
};
