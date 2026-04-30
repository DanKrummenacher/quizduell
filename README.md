# Quizduell - IPA Projekt

Dieses Repository enthält die Anwendung **"Quizduell"**, eine interaktive Echtzeit-Multiplayer-Quiz-Applikation. Das Projekt wurde im Rahmen der individuellen praktischen Arbeit (IPA) entwickelt.

## Technologien

Das Projekt ist in zwei Hauptbereiche unterteilt und basiert auf einem modernen TypeScript-Stack:

- **Frontend:** [Angular 21+](https://angular.io/) (Standalone Components, Signals, Smart/Dumb Container Pattern)
- **Backend:** [NestJS](https://nestjs.com/) (Modular Architecture)
- **Echtzeit-Kommunikation:** [Socket.io](https://socket.io/) (WebSockets)
- **Styling:** SCSS / CSS-Tokens (Mobile-First Responsiveness)

## Lokale Installation & Start

Stelle sicher, dass [Node.js](https://nodejs.org/) (LTS Version empfohlen) auf deinem System installiert ist.

### 1. Backend starten
```bash
cd backend
npm install
npm run start:dev
```
Das Backend läuft standardmässig auf `http://localhost:3000`.

### 2. Frontend starten
Öffne ein neues Terminalfenster:
```bash
cd frontend
npm install
npm run start
```
Das Frontend ist nun unter `http://localhost:4200` erreichbar.

---
*Dieses Projekt wurde als Prüfungsarbeit (IPA) umgesetzt.*
