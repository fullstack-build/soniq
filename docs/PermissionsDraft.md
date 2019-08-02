
# Entwurf für neue Permissions

## Mögliche Verbesserungen

### A) Create-Mutations vereinfachen

Aus den Mutations wie z.B. `USER_CREATE_ADMIN` und `USER_CREATE_ME` soll eine einzige Mutation `createUser` werden. 

### B) Update-Mutations vereinfachen

Aus den Mutations wie z.B. `USER_UPDATE_ADMIN` und `USER_UPDATE_ME` soll eine einzige Mutation `updateUser` werden. 

### C) Upsert-Mutations

Eine Entität erzeugen und bei einem Konflikt stattdessen ein update machen.

### D) Delete-Mutations verbessern

Die Delete-Mutations finde ich in Ordnung. Es gibt ein Array von Expressions und pro Entität eine einzige Mutation.

Es wäre allerdings nicht schlecht, wenn man anstelle eines ID-Matchings auch komplexere `WHERE`-Conditions mitgeben könnte.

z.B. `Lösche alle Posts, die vor dem 16. Juni 2007 erstellt wurden.`

### E) Update-Mutations verbessern

Gleich wie bei den Delete-Mutations wäre es praktisch anstelle dem ID-Matching `WHERE`-Conditions zu haben.

z.B. `Beende die Produktion aller Getränke einer Bestellung`


Die Punkte A und B finde ich wichtig, alles andere ist eher `Nice-to-Have`.