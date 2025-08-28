# FrankStack

## Welcome

**FrankStack** takes inspiration from *Frankenstein*: the monster built from multiple parts becomes a metaphor for a **fullstack project** that integrates all layers of development, from front-end to DevOps. The name also symbolizes the ambition of the project: creating an **end-to-end AI travel agent**, complete, modular, and orchestrated, like a multi-component robot that simulates a real travel booking cycle.

The project was bootstrapped using **Vite**, providing a fast and modern setup for React + TypeScript.

The integrated AI assistant is called:

```
🤖 FrankStack AI Assistant
```

It can answer questions, guide the user, and interact with simulated booking systems.

User session data (e.g., current chat, user name, API key) is stored in memory using **Zustand**, similar to Redux, allowing persistent state across components during a session.

---

## Ambitious Goal

The challenging goal is to create an **AI travel agent** that:

* Handles a complete booking using the **saga pattern**, with a choreography of API calls
* Interacts with backend services on **AWS Cloud**
* Covers all layers of the stack: React front-end, Spring Boot API, AI, orchestration

Demonstrates an end-to-end demo:
The **Scrum methodology** is applied with **unit sprints** and **code review sprints**, **Sprint Planning**, simulated team management, task assignment, simulation of a standard workday, etc.

**Final test example** (user interacts with AI):

> Organize and book a full travel experience for 2 people to Paris to visit the Eiffel Tower, duration 4 days, maximum budget 1500€, 3-star hotel, departing from Milan starting tomorrow, weather permitting, 1 suitcase, and airport-to-hotel shuttle/taxi included.

The AI will analyze the request and return a structured JSON ready for API booking calls.

> **Note:** The project is still in progress and not yet finished.

---

## React Project Structure

📁 **src/**

* 📁 **components/** – all React components (Header, InputBar, MessageList, MessageBubble, DebugPanel, Button)
* 📁 **hooks/** – custom hooks (`useWeather`, `useServerHealth`, `useAI`)
* 📁 **pages/** – main pages (Chat.tsx, Home.tsx)
* 📁 **store/** – **Zustand store** (`useAuthStore.ts`) for user session management
* 📁 **types/** – shared TypeScript types (`chat.ts`)
* 📁 **utils/** – utility functions (`contextBuilder.ts`, `datetime.ts`, `weatherCodes.ts`)
* index.css – global styles
* App.tsx – root React component
* main.tsx – entry point

---

## Pipeline Overview

Here’s a small **schematic of the flow**:

```text
[React Front-End (Vite)] 
      │
      ▼
[Zustand Store: user session, API key, chat state]
      │
      ▼
[Spring Boot API] <─┐
      │            │
      ▼            │
[Ollama AI GPT-OSS 20B] 
      │
      ▼
[Saga Pattern / Choreography of API Calls]
      │
      ▼
[AWS Cloud Services / Orchestration]
      │
      ▼
[User Receives Complete Travel Booking]
```

* Front-end sends requests via React UI
* **Zustand store** keeps track of the user session and chat state
* API handles communication with AI and cloud services
* AI interprets user input and returns structured JSON
* Saga pattern executes chained booking actions
* AWS orchestrates services ensuring end-to-end flow

---

## User Session Management with Zustand

```text
[User Input / Chat Component] 
        │
        ▼
[Zustand Store: useAuthStore] 
   ├─ currentUser: "Edoardo"
   ├─ apiKey: "********"
   ├─ chatMessages: [...]
   └─ other session state
        │
        ▼
[All React Components] 
(Header, InputBar, MessageList, DebugPanel)
        │
        ▼
[UI Updates in Real-Time]
```

* The **Zustand store** acts as a centralized memory for the session.
* Components subscribe to store state and automatically re-render when relevant data changes.
* Allows persistent user session across multiple UI components **without prop drilling**.
* Similar concept to Redux, but lightweight and easier to use for small-to-medium fullstack projects.

---

## Getting Started

```bash
git clone https://github.com/RunMyProject/FrankStack.git
cd FrankStack/frank-react-vite
./start.sh
```

Open your browser at `http://localhost:5173` to see the chat in action.

---

## Tech Stack

* **Front-end:** React + TypeScript + TailwindCSS + **Vite**
* **State management:** **Zustand** (user session)
* **AI:** Ollama with GPT-OSS 20B model
* **Back-end:** Spring Boot API orchestrated on AWS
* **DevOps:** cloud orchestration, full end-to-end API call management (**pipeline**)
* **Debug & Logs:** real-time debug panel

---

## Contribution

The project is an end-to-end demo to test **fullstack AI orchestration**. Each part of the stack is observable and editable, using **Scrum methodology**, showcasing modern development practices.

---

