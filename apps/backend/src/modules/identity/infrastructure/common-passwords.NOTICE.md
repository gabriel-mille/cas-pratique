# common-passwords.txt

Liste des mots de passe interdits (ASVS 6.2.4, D18, D32).

- Source : SecLists, `Passwords/Common-Credentials/xato-net-10-million-passwords-1000000.txt`,
  commit `47cd752f4323f703e304104173633ee31462b9b3` (https://github.com/danielmiessler/SecLists).
  Mots de passe triés du plus au moins fréquent, issus du jeu « ten million passwords » de xato.net.
- Filtre : normalisation NFC, minuscules, doublons retirés, 15 à 128 caractères (points de code),
  c'est-à-dire seulement les mots de passe que notre politique accepterait sans cette liste.
  L'ASVS 6.2.4 demande « at least, the top 3000 passwords which match the application's password policy » :
  la liste en contient 10 898. La liste des 10 000 plus courants n'en aurait gardé qu'un seul.
- Pour régénérer : appliquer le même filtre au fichier source du commit indiqué.

## Licence de la source

```
MIT License

Copyright (c) 2018 Daniel Miessler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
