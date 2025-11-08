# Projekto "Aiplenk" Diegimo Gidas (Naujam Kompiuteriui)

Šis dokumentas aprašo visas būtinas programas ir įrankius, reikalingus paleisti ir vystyti „Aiplenk“ projektą lokaliame „Windows“ kompiuteriui.

## 1. Pagrindiniai Kodo Įrankiai

Šie įrankiai yra būtini kodo rašymui ir programos paleidimui.

### A. Visual Studio Code (VS Code)
* **Kas tai?** Pagrindinis kodo redaktorius.
* **Kam reikalinga?** Rašyti ir redaguoti visą projekto kodą (`.tsx`, `.ts`, `.sql` failus) bei naudoti integruotą terminalą komandoms.
* **Kaip įdiegti?** Atsisiųsti iš [code.visualstudio.com](https://code.visualstudio.com/).

### B. Node.js
* **Kas tai?** „JavaScript“ vykdymo aplinka.
* **Kam reikalinga?** Ji įdiegia **`npm`** (Node Package Manager). `npm` yra būtinas:
    1.  Paleisti lokalią svetainę (`npm run dev`).
    2.  Atsisiųsti visus „Front-End“ paketus (`npm install`), pvz., „React“.
* **Kaip įdiegti?** Atsisiųsti **LTS** versiją iš [nodejs.org](https://nodejs.org/). Diegiant **nereikia** žymėti varnelės prie „Tools for Native Modules“.

---

## 2. „Windows“ Paketų Tvarkyklės

### A. Scoop
* **Kas tai?** Paketų tvarkyklė, skirta „Windows“.
* **Kam reikalinga?** Naudojome tam, kad įdiegtume „Git“ ir „Supabase CLI“.
* **Kaip įdiegti?** Per „PowerShell“ (atidarytame per VS Code terminalą):
    ```bash
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    Invoke-RestMethod -Uri [https://get.scoop.sh](https://get.scoop.sh) | Invoke-Expression
    ```

---

## 3. Būtinieji Programavimo Įrankiai

Šie įrankiai buvo įdiegti naudojant „Scoop“.

### A. Git
* **Kas tai?** Versijavimo kontrolės sistema.
* **Kam reikalinga?** Būtina, kad galėtumėte:
    1.  Atsisiųsti (klonuoti) projektą iš „GitHub“ (`git clone ...`).
    2.  Įkelti (pushinti) savo kodo pakeitimus atgal į „GitHub“.
* **Kaip įdiegti?** Per „Scoop“ terminale:
    ```bash
    scoop install git
    ```

### B. Supabase CLI
* **Kas tai?** „Supabase“ komandinės eilutės įrankis.
* **Kam reikalinga?** Tai jūsų tiltas tarp kodo ir duomenų bazės:
    1.  Kurti migracijas (`supabase migration new ...`).
    2.  Atnaujinti duomenų bazės struktūrą (`supabase db push`).
    3.  Susieti projektą (`supabase link ...`).
    4.  Paleisti „Edge Functions“ (`supabase functions serve`).
* **Kaip įdiegti?** Per „Scoop“ terminale (dvi komandos):
    ```bash
    scoop bucket add supabase [https://github.com/supabase/scoop-bucket.git](https://github.com/supabase/scoop-bucket.git)
    scoop install supabase
    ```

---

## 4. Serverio Aplinka („Back-End“)

### A. Docker Desktop
* **Kas tai?** Konteinerizacijos platforma.
* **Kam reikalinga?** **Būtina**, kad galėtumėte paleisti „Supabase Edge Functions“ (pvz., būsimą `scan-invoice` ar `get-all-users`) savo kompiuteryje (`supabase functions serve`).
* **Kaip įdiegti?** Atsisiųsti iš [docker.com/desktop](https://www.docker.com/desktop/install/windows-install/). Diegiant palikti rekomenduojamą parinktį **„Use WSL 2“** ir **nežymėti** „Windows Containers“.