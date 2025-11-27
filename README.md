# 🚀 Mini-CRM + Lead Scoring & Automation System

Un sistem CRM complet **end-to-end** care combină:

-   un **Dashboard React modern**
-   un **Backend Node.js rapid**
-   **automatizări complexe în n8n** pentru lead scoring, routing și
    follow-up automat
-   un **Video prezentare** https://www.youtube.com/watch?v=hYqUFwL39ko

## 🚀 Ghid de Instalare Rapidă (\< 5 minute)

### **1. Backend Setup**

``` bash
cd server
npm install
node server.js
```

-   Server disponibil la **http://localhost:3001**
-   Baza de date `database.sqlite` se creează automat

------------------------------------------------------------------------

### **2. Frontend Setup**

``` bash
npm install
npm run dev
```

-   Aplicația va porni la: **http://localhost:5173**

------------------------------------------------------------------------

### **3. n8n Automation Setup**

Instalare:

``` bash
npm install n8n -g
```

Pornire:

``` bash
n8n start
```

-   n8n rulează pe **http://localhost:5678**
-   În UI: *Workflows → Import from File*
-   Selectezi fișierele `.json` din folderul **/n8n**

------------------------------------------------------------------------

## 📂 Structură Proiect

    /src      – Codul sursă React (Frontend)
    /server   – API Node.js + baza SQLite
    /n8n      – Workflow-urile de automatizare n8n

------------------------------------------------------------------------

------------------------------------------------------------------------

## 🛠️ Tech Stack

### **Frontend**

-   React (Vite)
-   Tailwind CSS
-   Lucide Icons

### **Backend**

-   Node.js
-   Express.js
-   SQLite (bază de date locală)

### **Automation**

-   n8n (Workflow Automation)

------------------------------------------------------------------------

## ✨ Funcționalități Cheie

### **1. Dashboard Modern**

-   Vizualizare leads\
-   Filtrare live\
-   Editare status inline

### **2. Inbound Lead Automation (Flow 1)**

-   Detectează mesajele noi\
-   Creează automat lead-uri dacă nu există\
-   Loghează conversațiile

### **3. Automated Sentiment Scoring (Flow 2)**

-   Analizează mesajele primite\
-   Cuvinte pozitive (`urgent`, `contract`) → **+10 / +20 scor**\
-   Cuvinte negative → **scădere scor**\
-   Promovare automată la **Qualified** dacă scorul \> 40

### **4. Follow-up Scheduler (Flow 3)**

-   Rulează periodic și detectează lead-urile "uitate"\
-   **2 ore fără răspuns** → status *Needs Followup*\
-   **48 ore fără răspuns** → status *Cold*

### **5. Export CSV (Flow 4)**

-   Generare raport direct din Dashboard\
-   Procesare prin backend → n8n

------------------------------------------------------------------------
