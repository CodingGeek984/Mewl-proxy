<p align="center">
  <br>
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/security/security.png" width="100" />
  <br>
</p>

<h1 align="center">Meowl Proxy</h1>

<p align="center">
  <b>Ультимативный веб-прокси и инструмент безопасности / The Next-Generation Web Security & Proxy Tool</b><br>
  <i>Там, где чистая мощь Burp Suite встречается с удобством Postman.</i>
</p>

<p align="center">
  <a href="#ru">🇷🇺 Русский</a> | <a href="#en">🇬🇧 English</a>
</p>

---

<a name="ru"></a>
# 🇷🇺 Русский

<p align="center">
  <a href="#-о-проекте-meowl">О проекте</a> •
  <a href="#-ключевые-возможности">Фичи</a> •
  <a href="#%EF%B8%8F-установка-и-запуск">Установка</a> •
  <a href="#-как-пользоваться">Как пользоваться</a> •
  <a href="#-архитектура">Архитектура</a>
</p>

## 🚀 О проекте Meowl

**Meowl** — это высокопроизводительный кроссплатформенный прокси-сервер для перехвата HTTP/HTTPS трафика и анализа уязвимостей. Созданный для DevSecOps, багхантеров, пентестеров и разработчиков, Meowl дает вам абсолютный контроль над всем сетевым взаимодействием веб-приложений.

Забудьте про медленные и перегруженные Java-интерфейсы. Meowl предлагает мгновенно откликающийся, кинематографичный дизайн в стиле "Tokyo Night" (React & Vite), работающий поверх невероятно быстрого сетевого ядра на Go (Golang).

## ✨ Ключевые возможности

- **🛡️ Полный перехват HTTP/HTTPS (MITM):** Прозрачный перехват HTTP/1.1, HTTP/2 и HTTP/3 (QUIC) трафика.
- **⏸️ Интерактивный Interceptor:** Ставьте трафик на паузу, модифицируйте и отбрасывайте запросы/ответы "на лету" до того, как они дойдут до сервера или браузера.
- **🔄 Умный Repeater (Повторитель):** Интерфейс в стиле Postman для ручного редактирования сырых HTTP-запросов, быстрого переключения методов (GET/POST/др.) и мгновенной повторной отправки.
- **🎯 Карта сайта (Target Site Map):** Автоматическое построение иерархического дерева целей для удобной навигации и настройки области тестирования (Scope).
- **⚡ Кастомные скрипты (JavaScript):** Пишите собственные правила на JS (выполняются через `goja`) для автоматической модификации трафика на лету. Без перекомпиляции ядра!
- **🔍 Пассивный сканер уязвимостей (Titus):** Фоновый анализ проходящего трафика на наличие проблем безопасности без создания лишней нагрузки на целевой сервер.
- **🔨 Fuzzer & Intruder:** Автоматизация атак и внедрения пейлоадов с поддержкой продвинутых режимов (Sniper, Battering Ram, Pitchfork, Cluster Bomb).

## 🛠️ Установка и запуск

### Требования (Prerequisites)

Для сборки и запуска Meowl из исходников вам понадобятся:
- **[Go](https://golang.org/dl/)** (1.21 или новее)
- **[Node.js & npm](https://nodejs.org/)** (v18 или новее)
- **[Python 3](https://www.python.org/downloads/)** (Для скрипта сборки)
- **[Wails CLI](https://wails.io/docs/gettingstarted/installation)**:
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```

### Быстрый старт

1. **Склонируйте репозиторий:**
   ```bash
   git clone https://github.com/your-username/meowl.git
   cd meowl
   ```

2. **Установите зависимости фронтенда:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Запустите приложение (Режим разработчика):**
   Мы подготовили удобный Python-скрипт, который сделает всё за вас.
   ```bash
   python meowl.py
   ```
   *Эта команда автоматически поднимет Vite dev-сервер и запустит десктопное приложение Wails.*

### Сборка для Production

Чтобы собрать готовый исполняемый файл для вашей операционной системы:
```bash
# Сборка под вашу текущую ОС (Файлы появятся в папке build/bin/)
python meowl.py --rebuild

# Собрать конкретно для Windows (.exe)
python meowl.py --rebuild exe

# Собрать конкретно для Linux (.deb)
python meowl.py --rebuild deb
```

## 📖 Как пользоваться

### 1. Настройка Прокси
По умолчанию прокси-ядро Meowl слушает порт `127.0.0.1:8081`. 
Настройте ваш браузер (или используйте расширения вроде FoxyProxy) для маршрутизации HTTP/HTTPS трафика через этот IP и порт.

### 2. Добавление CA-сертификата (Для перехвата HTTPS)
Чтобы перехватывать зашифрованный HTTPS-трафик без ошибок безопасности в браузере, необходимо довериться корневому сертификату Meowl (Root CA):
1. Откройте Meowl и перейдите в **Settings** (Настройки) или вкладку Certificates.
2. Нажмите **Download CA Certificate**.
3. Установите скачанный файл `meowl-ca.pem` в хранилище **Trusted Root Certification Authorities** (Доверенные корневые центры сертификации) вашего браузера или ОС.

### 3. Базовый воркфлоу
- **История трафика:** Как только прокси настроен, перейдите на вкладку **Proxy** в Meowl. Вы увидите весь трафик в реальном времени.
- **Перехват (Intercept):** Включите **Intercept**. При следующем клике в браузере запрос "зависнет" в Meowl. Вы можете изменить сырой текст пакета и нажать **Forward** (Отправить дальше).
- **Repeater (Повторитель):** Найдите интересный запрос в Истории, нажмите ПКМ -> отправить в **Repeater**. Там вы можете менять метод (GET/POST), изменять JSON-тело, токены и многократно отправлять запрос, чтобы тестировать эндпоинты API.

## 🏗️ Архитектура

Meowl построен на базе фреймворка **Wails**, что позволяет полностью отделить высоконагруженное ядро от современного UI:

- **Backend (Go):** Отвечает за многопоточный прокси-движок (`goproxy`), сохранение данных в SQLite (WAL), вычисление правил (CEL/Regex) и выполнение JavaScript-скриптов (`goja`).
- **Frontend (React/TypeScript):** Написан на React 19 + Vite. Для стилизации используется TailwindCSS + Radix UI. Общение с бэкендом происходит в реальном времени через WebSockets.

---

<br><br>

<a name="en"></a>
# 🇬🇧 English

<p align="center">
  <a href="#-about-meowl">About</a> •
  <a href="#-key-features">Features</a> •
  <a href="#%EF%B8%8F-installation">Installation</a> •
  <a href="#-how-to-use">How To Use</a> •
  <a href="#-architecture">Architecture</a>
</p>

## 🚀 About Meowl

**Meowl** is a high-performance, cross-platform HTTP/S interception proxy and security analysis tool. Built for DevSecOps, bug bounty hunters, and developers, Meowl gives you complete control over your web traffic. 

Instead of dealing with clunky, outdated Java interfaces, Meowl offers a cinematic, lightning-fast "Tokyo Night" user interface powered by React & Vite, backed by the raw networking speed of Go (Golang). 

## ✨ Key Features

- **🛡️ Full HTTP/S Interception (MITM):** Transparently intercept HTTP/1.1, HTTP/2, and HTTP/3 (QUIC) traffic.
- **⏸️ Interactive Interceptor:** Pause, modify, and drop requests/responses on the fly before they reach the server or browser.
- **🔄 Smart Repeater:** A Postman-style interface to manually edit raw HTTP requests, change methods via UI toggles, and replay them instantly.
- **🎯 Target Site Map:** Automatically builds a hierarchical tree of the target web application to manage your testing scope easily.
- **⚡ JavaScript Custom Extensions:** Write custom JS rules (executed via `goja`) to automatically modify traffic on the fly. No need to recompile the proxy!
- **🔍 Passive Vulnerability Scanner (Titus):** Analyzes traffic in the background for security misconfigurations without sending additional requests.
- **🔨 Fuzzer & Intruder:** Automate payload injection with advanced attack types (Sniper, Battering Ram, Pitchfork, Cluster Bomb).

## 🛠️ Installation

### Prerequisites

To build and run Meowl from source, you need to have the following installed on your system:
- **[Go](https://golang.org/dl/)** (1.21 or newer)
- **[Node.js & npm](https://nodejs.org/)** (v18 or newer)
- **[Python 3](https://www.python.org/downloads/)** (For the build script)
- **[Wails CLI](https://wails.io/docs/gettingstarted/installation)**:
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/meowl.git
   cd meowl
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Run the Application (Development Mode):**
   We have included a convenient Python script to handle everything for you.
   ```bash
   python meowl.py
   ```
   *This command will start the Vite frontend server and launch the Wails desktop application automatically.*

### Building for Production

To build a standalone executable for your operating system:
```bash
# Build for your current OS (Outputs to build/bin/)
python meowl.py --rebuild

# Build specifically for Windows (.exe)
python meowl.py --rebuild exe

# Build specifically for Linux (.deb)
python meowl.py --rebuild deb
```

## 📖 How To Use

### 1. Setting up the Proxy
By default, Meowl's proxy engine listens on `127.0.0.1:8081`. 
Configure your browser (or use an extension like FoxyProxy) or operating system network settings to route HTTP/HTTPS traffic through this address and port.

### 2. Trusting the CA Certificate (For HTTPS Interception)
To intercept encrypted HTTPS traffic without browser security warnings, you must trust Meowl's Root CA:
1. Open Meowl and go to **Settings** (or the Certificates tab).
2. Click **Download CA Certificate**.
3. Import the downloaded `meowl-ca.pem` file into your browser's **Trusted Root Certification Authorities** store.

### 3. Basic Workflow
- **Traffic History:** Once your proxy is set, navigate to the **Proxy** tab in Meowl to see all traffic flowing through your browser in real-time.
- **Intercepting:** Turn on **Intercept**. The next time you click a link in your browser, the request will pause in Meowl. You can edit the raw text and click **Forward**.
- **Repeater:** Find an interesting request in your History, right-click it, and send it to the **Repeater**. From there, you can change the method (GET/POST), modify JSON bodies, and replay the request to test API endpoints.

## 🏗️ Architecture

Meowl is built using the **Wails** framework, completely separating the high-performance backend from the modern frontend:

- **Backend (Go):** Handles the heavily multi-threaded proxy engine (`goproxy`), SQLite persistence, Rules evaluation (CEL/Regex), and the JavaScript execution engine (`goja`).
- **Frontend (React/TypeScript):** A React 19 application built with Vite and styled using TailwindCSS + Radix UI, communicating with the backend in real-time via WebSockets.

---
<p align="center">Made with ❤️ for the cyber security community.</p>
