Jedes Paket kann eine eigene Config haben. diese muss einmal im constructor registriert werden: 
`config.addConfigFolder(__dirname + '/../config');`

Eine config ist eine einfache JSON-Datei, z.b:
```
module.exports = {
  'a': true,
  'b': 20,
  c: undefined,
  d: null,
  e: {
    env: process.env.NODE_ENV
  },
  f: {
    g: null
  }
};
```


Alle Felder MÜSSEN gesetzt werden. Diese können entweder direkt in der Datei gesetzt werden, einer späteren (z.b. anhand der Umgebung, oder der Implementierung). Umgebungsvariablen können darin auch verwendet werden. 
Ist ein Wert davon `null`, kann man den Server nicht starten und es wir der Pfad zu dem fehlenden Wert ausgegeben.

Alle Umgebungsvariablen werden automatisch in die Config aufgenommen. Somit kann man auch über die Config auf Umgebungsvariablen zugreifen. Hat eine Umgebungsvariable einen Punkt, wird davon ausgegangen, dass es ein verschachtelter Pfad ist. Damit kann man auch über Umgebungsvariablen Config-Werte setzen. 
In dem obigen Beispiel könnte man entsprechend über die Umgebungsvariable `f.g=true` den verschachtelten Wert setzen.