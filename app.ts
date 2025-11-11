const BASE_URL: string = "http://146.185.154.90:8000/blog/";
const MAIL: string = "cooldcoolt@gmai.com";

// Константы для конфигурации
const POLLING_INTERVAL: number = 3000; // Интервал опроса новых сообщений (мс)
const MESSAGE_REFRESH_DELAY: number = 1500; // Задержка обновления после отправки (мс)
const MAX_MESSAGES_TO_SHOW: number = 20; // Максимальное количество отображаемых сообщений
const MESSAGE_LIMIT_THRESHOLD: number = 19; // Порог для ограничения сообщений

let lastMessageDate: string | Date | null;
let pollingIntervalId: ReturnType<typeof setInterval> | null = null;
let isSubmittingMessage: boolean = false;

const root = document.getElementById("root") as HTMLDivElement;

const container = document.createElement("div") as HTMLDivElement;
container.classList.add("container");

const mainsec = document.createElement("div") as HTMLDivElement;
mainsec.classList.add("mainsec");

const loader = document.querySelector(".loader-cn") as HTMLDivElement;

interface Profile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Утилита для показа уведомлений
const showNotification = (message: string, type: "success" | "error" = "success"): void => {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === "success" ? "#28a745" : "#dc3545"};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;
  notification.textContent = message;

  // Добавляем стиль анимации если его еще нет
  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// Валидация email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const builUserInfo = async (baseUrl: string, method: string): Promise<void> => {
  try {
    let profileOb = await postMessage12<Profile>(baseUrl, method, null);

    localStorage.setItem("profile", JSON.stringify(profileOb));

    let userinfo = document.createElement("div") as HTMLDivElement;
    userinfo.classList.add("userinfo");
    userinfo.setAttribute("email", profileOb.email);

    let ava = document.createElement("strong") as HTMLElement;
    ava.classList.add("ava");

    let leter: string = profileOb.firstName?.[0]?.toUpperCase() || "U";

    ava.textContent = leter;
    ava.style.backgroundColor = getColorFromName(leter);
    userinfo.appendChild(ava);

    let userName1 = document.createElement("span") as HTMLElement;
    userName1.classList.add("userName");
    userName1.textContent = `${profileOb.firstName || ""} ${profileOb.lastName || ""}`.trim() || "Пользователь";

    userinfo.appendChild(userName1);

    let btn = document.createElement("button");
    btn.classList.add("profBtn");
    btn.setAttribute("aria-label", "Редактировать профиль");
    userinfo.appendChild(btn);

    let sbc = document.createElement("button");
    sbc.classList.add("sbcBtn");
    sbc.setAttribute("aria-label", "Подписаться на обновления");
    userinfo.appendChild(sbc);

    let chatName = document.createElement("h3") as HTMLElement;
    chatName.classList.add("chatName");
    chatName.textContent = "Atrractor chat";
    userinfo.appendChild(chatName);

    let isExist = mainsec.querySelector(".userinfo");

    if (isExist) {
      isExist.replaceWith(userinfo);
    } else {
      mainsec.appendChild(userinfo);
    }

    container.appendChild(mainsec);
    root.appendChild(container);

    // Добавляем обработчики событий
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      controlUser();
    });

    sbc.addEventListener("click", (event) => {
      event.preventDefault();
      subscribe();
    });
  } catch (error) {
    console.error("Ошибка при загрузке профиля:", error);
    showNotification("Не удалось загрузить профиль. Попробуйте обновить страницу.", "error");
    throw error;
  }
};

const controlUser = async (): Promise<void> => {
  let overlay = root.querySelector(".overlay") as HTMLDivElement;
  if (!overlay) return;
  
  overlay.style.display = "flex";

  let form = overlay.querySelector(".login") as HTMLFormElement;
  let inputName = form.querySelector(".inputName") as HTMLInputElement;
  let inputLastName = form.querySelector(".inputLastName") as HTMLInputElement;

  let button = form.querySelector(".inputButton") as HTMLButtonElement;
  let exitButton = form.querySelector(".exitButton") as HTMLButtonElement;

  // Загружаем текущие данные профиля
  const profileStr = localStorage.getItem("profile");
  if (profileStr) {
    try {
      const profile: Profile = JSON.parse(profileStr);
      inputName.value = profile.firstName || "";
      inputLastName.value = profile.lastName || "";
    } catch (e) {
      console.error("Ошибка при загрузке профиля:", e);
    }
  }

  // Удаляем старые обработчики
  const newInputName = inputName.cloneNode(true) as HTMLInputElement;
  const newInputLastName = inputLastName.cloneNode(true) as HTMLInputElement;
  const newButton = button.cloneNode(true) as HTMLButtonElement;
  const newExitButton = exitButton.cloneNode(true) as HTMLButtonElement;

  inputName.replaceWith(newInputName);
  inputLastName.replaceWith(newInputLastName);
  button.replaceWith(newButton);
  exitButton.replaceWith(newExitButton);

  inputName = newInputName;
  inputLastName = newInputLastName;
  button = newButton;
  exitButton = newExitButton;

  const validateInputs = () => {
    const firstName = inputName.value.trim();
    const lastName = inputLastName.value.trim();
    button.disabled = firstName === "" || lastName === "";
  };

  validateInputs();

  inputName.addEventListener("input", validateInputs);
  inputLastName.addEventListener("input", validateInputs);

  // Обработка отправки формы
  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    const firstName = inputName.value.trim();
    const lastName = inputLastName.value.trim();

    if (!firstName || !lastName) {
      showNotification("Пожалуйста, заполните все поля", "error");
      return;
    }

    try {
      loaderControl(true);
      const body = new URLSearchParams();
      body.append("firstName", firstName);
      body.append("lastName", lastName);
      
      await postMessage12(BASE_URL + MAIL + "/profile", "POST", body);
      await builUserInfo(BASE_URL + MAIL + "/profile", "GET");
      
      overlay.style.display = "none";
      inputName.value = "";
      inputLastName.value = "";
      showNotification("Профиль успешно обновлен!", "success");
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      showNotification("Не удалось обновить профиль. Попробуйте еще раз.", "error");
    } finally {
      loaderControl(false);
    }
  };

  form.addEventListener("submit", handleSubmit);
  button.addEventListener("click", handleSubmit);

  exitButton.addEventListener("click", (event) => {
    event.preventDefault();
    overlay.style.display = "none";
    inputName.value = "";
    inputLastName.value = "";
  });

  // Закрытие по клику на overlay
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.style.display = "none";
      inputName.value = "";
      inputLastName.value = "";
    }
  });
};

const buildInput = (): void => {
  // Проверяем, не создан ли уже input
  if (mainsec.querySelector(".messagePost")) {
    return;
  }

  let messagePost = document.createElement("div") as HTMLDivElement;
  messagePost.classList.add("messagePost");

  let messagePostForm = document.createElement("form") as HTMLFormElement;
  messagePostForm.classList.add("messagePostForm");
  messagePostForm.action = "submit";
  messagePostForm.id = "myForm";

  let txt = document.createElement("textarea") as HTMLTextAreaElement;
  txt.id = "myInput";
  txt.placeholder = "Написать сообщение...";
  txt.setAttribute("aria-label", "Поле ввода сообщения");
  messagePostForm.appendChild(txt);

  let sbt = document.createElement("button") as HTMLButtonElement;
  sbt.type = "submit";
  sbt.setAttribute("aria-label", "Отправить сообщение");
  messagePostForm.appendChild(sbt);

  messagePost.appendChild(messagePostForm);
  mainsec.appendChild(messagePost);
  container.appendChild(mainsec);

  messagePostForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    if (isSubmittingMessage) {
      return;
    }

    const ms = txt.value.trim();
    if (ms === "") {
      showNotification("Сообщение не может быть пустым", "error");
      return;
    }

    // Ограничение длины сообщения
    if (ms.length > 1000) {
      showNotification("Сообщение слишком длинное (максимум 1000 символов)", "error");
      return;
    }

    isSubmittingMessage = true;
    sbt.disabled = true;
    const originalPlaceholder = txt.placeholder;
    txt.placeholder = "Отправка...";

    try {
      let body = new URLSearchParams();
      body.append("message", ms);
      await postMessage12(BASE_URL + MAIL + "/posts", "POST", body);

      // Очищаем форму после успешной отправки
      txt.value = "";
      txt.placeholder = originalPlaceholder;
      
      // Обновляем сообщения
      setTimeout(() => {
        buildMessage(BASE_URL + MAIL + "/posts").catch((error) => {
          console.error("Ошибка при обновлении сообщений:", error);
        });
      }, MESSAGE_REFRESH_DELAY);
      
      showNotification("Сообщение отправлено!", "success");
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      showNotification("Не удалось отправить сообщение. Попробуйте еще раз.", "error");
      txt.placeholder = originalPlaceholder;
    } finally {
      isSubmittingMessage = false;
      sbt.disabled = false;
      txt.focus();
    }
  });

  // Автоматическое изменение размера textarea
  txt.addEventListener("input", () => {
    txt.style.height = "auto";
    txt.style.height = `${Math.min(txt.scrollHeight, 150)}px`;
  });
};

interface Message {
  _id: string;
  userId: string;
  message: string;
  datetime: Date;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

const buildMessage = async (url: string): Promise<void> => {
  try {
    const message = await postMessage12<Message[]>(url, "GET", null);

    let curentUsr: Profile | null = null;

    let profileStr = localStorage.getItem("profile");

    if (profileStr) {
      try {
        curentUsr = JSON.parse(profileStr) as Profile;
      } catch (e) {
        console.error("Ошибка при парсинге профиля:", e);
      }
    }

    if (!message || message.length < 1) {
      return;
    }

    let messageBlock = mainsec.querySelector(
      ".messageBlock"
    ) as HTMLElement | null;

    if (!messageBlock) {
      messageBlock = document.createElement("div");
      messageBlock.classList.add("messageBlock");
      mainsec.appendChild(messageBlock);
    }

    // Сохраняем текущую позицию скролла
    const wasScrolledToBottom = 
      messageBlock.scrollHeight - messageBlock.scrollTop <= messageBlock.clientHeight + 50;
    const oldScrollHeight = messageBlock.scrollHeight;

    // Создаем фрагмент для более эффективного добавления в DOM
    const fragment = document.createDocumentFragment();
    const existingMessages = new Set<string>();

    // Сохраняем существующие сообщения
    messageBlock.querySelectorAll(".message").forEach((msg) => {
      const msgId = msg.getAttribute("data-message-id");
      if (msgId) {
        existingMessages.add(msgId);
      }
    });

    // Определяем диапазон сообщений для отображения
    const startIndex = message.length > MESSAGE_LIMIT_THRESHOLD 
      ? message.length - MAX_MESSAGES_TO_SHOW 
      : 0;

    // Добавляем только новые сообщения
    for (let i = message.length - 1; i >= startIndex; i--) {
      const msgId = message[i]._id;
      if (existingMessages.has(msgId)) {
        continue;
      }

      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", "fade-in");
      messageDiv.setAttribute("email", message[i].user?.email || "");
      messageDiv.setAttribute("data-message-id", msgId);

      if (message[i].user?.email === curentUsr?.email) {
        messageDiv.style.marginLeft = "auto";
        messageDiv.classList.add("own-message");
      }

      const ava1 = document.createElement("strong");
      ava1.classList.add("ava1");
      const firstName = message[i].user?.firstName || "U";
      const lt = firstName[0]?.toUpperCase() || "U";
      ava1.textContent = lt;
      ava1.style.backgroundColor = getColorFromName(lt);
      ava1.setAttribute("aria-label", `Аватар пользователя ${firstName}`);
      messageDiv.appendChild(ava1);

      const messageContent = document.createElement("div");
      messageContent.classList.add("messageContent");

      const usrName = document.createElement("span");
      usrName.classList.add("userName1");
      const fullName = `${message[i].user?.firstName || ""} ${message[i].user?.lastName || ""}`.trim() || "Неизвестный пользователь";
      usrName.textContent = fullName;
      messageContent.appendChild(usrName);

      const messageText = document.createElement("p");
      messageText.classList.add("messageText");
      // Безопасное отображение текста (защита от XSS)
      messageText.textContent = message[i].message || "";
      messageContent.appendChild(messageText);

      const postDate = document.createElement("span");
      postDate.classList.add("postDate");
      try {
        const date = new Date(message[i].datetime);
        postDate.textContent = date.toLocaleString("ru-RU", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        postDate.textContent = "Неизвестная дата";
      }
      messageContent.appendChild(postDate);
      messageDiv.appendChild(messageContent);
      
      // Добавляем в начало для правильного порядка
      if (messageBlock.firstChild) {
        messageBlock.insertBefore(messageDiv, messageBlock.firstChild);
      } else {
        fragment.appendChild(messageDiv);
      }
    }

    if (fragment.hasChildNodes()) {
      messageBlock.insertBefore(fragment, messageBlock.firstChild);
    }

    // Ограничиваем количество сообщений в DOM
    const allMessages = messageBlock.querySelectorAll(".message");
    if (allMessages.length > MAX_MESSAGES_TO_SHOW * 2) {
      for (let i = allMessages.length - 1; i >= MAX_MESSAGES_TO_SHOW * 2; i--) {
        allMessages[i].remove();
      }
    }

    // Восстанавливаем позицию скролла
    if (wasScrolledToBottom) {
      messageBlock.scrollTop = messageBlock.scrollHeight;
    } else {
      const newScrollHeight = messageBlock.scrollHeight;
      messageBlock.scrollTop = newScrollHeight - oldScrollHeight + messageBlock.scrollTop;
    }

    // Обновляем дату последнего сообщения
    if (message.length > 0) {
      lastMessageDate = message[message.length - 1]?.datetime || lastMessageDate;
    }
  } catch (error) {
    console.error("Ошибка при загрузке сообщений:", error);
    // Не показываем ошибку пользователю при каждом polling, только в консоль
  }
};

const listenToMessages = async (): Promise<void> => {
  try {
    if (lastMessageDate !== null && lastMessageDate !== undefined) {
      const dateString = typeof lastMessageDate === 'string' 
        ? lastMessageDate 
        : new Date(lastMessageDate).toISOString();
      const url = `${BASE_URL}${MAIL}/posts?datetime=${encodeURIComponent(dateString)}`;
      await buildMessage(url);
    } else {
      // Если нет последней даты, загружаем все сообщения
      await buildMessage(`${BASE_URL}${MAIL}/posts`);
    }
  } catch (error) {
    // Тихо обрабатываем ошибки polling, чтобы не спамить пользователя
    console.error("Ошибка при проверке новых сообщений:", error);
  }
};

const COLORS = new Map<string, string>([
  ["A", "#007bff"],
  ["B", "#28a745"],
  ["C", "#ffc107"],
  ["D", "#fd7e14"],
  ["E", "#6f42c1"],
  ["F", "#e83e8c"],
  ["G", "#20c997"],
  ["H", "#dc3545"],
  ["I", "#6c757d"],
  ["J", "#6610f2"],
  ["K", "#0dcaf0"],
  ["L", "#198754"],
  ["M", "#ffc107"],
  ["N", "#0d6efd"],
  ["O", "#6f42c1"],
  ["P", "#d63384"],
  ["Q", "#fd7e14"],
  ["R", "#20c997"],
  ["S", "#198754"],
  ["T", "#0dcaf0"],
  ["U", "#6c757d"],
  ["V", "#6610f2"],
  ["W", "#e83e8c"],
  ["X", "#dc3545"],
  ["Y", "#ffc107"],
  ["Z", "#007bff"],
  ["А", "#007bff"],
  ["Б", "#28a745"],
  ["В", "#ffc107"],
  ["Г", "#fd7e14"],
  ["Д", "#6f42c1"],
  ["Е", "#e83e8c"],
  ["Ё", "#20c997"],
  ["Ж", "#dc3545"],
  ["З", "#6c757d"],
  ["И", "#6610f2"],
  ["Й", "#0dcaf0"],
  ["К", "#198754"],
  ["Л", "#ffc107"],
  ["М", "#0d6efd"],
  ["Н", "#6f42c1"],
  ["О", "#d63384"],
  ["П", "#fd7e14"],
  ["Р", "#20c997"],
  ["С", "#198754"],
  ["Т", "#0dcaf0"],
  ["У", "#6c757d"],
  ["Ф", "#6610f2"],
  ["Х", "#e83e8c"],
  ["Ц", "#dc3545"],
  ["Ч", "#ffc107"],
  ["Ш", "#007bff"],
  ["Щ", "#28a745"],
  ["Ъ", "#ffc107"],
  ["Ы", "#fd7e14"],
  ["Ь", "#6f42c1"],
  ["Э", "#e83e8c"],
  ["Ю", "#20c997"],
  ["Я", "#dc3545"],
]);

const getColorFromName = (leter: string) => {
  return COLORS.get(leter) || "grey";
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    loaderControl(true);

    await builUserInfo(BASE_URL + MAIL + "/profile", "GET");
    await buildMessage(BASE_URL + MAIL + "/posts");
    buildInput();

    // Запускаем polling для новых сообщений
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }
    pollingIntervalId = setInterval(() => {
      listenToMessages();
    }, POLLING_INTERVAL);

    // Обработка видимости страницы для оптимизации
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Останавливаем polling когда страница не видна
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId);
          pollingIntervalId = null;
        }
      } else {
        // Возобновляем polling когда страница видна
        if (!pollingIntervalId) {
          pollingIntervalId = setInterval(() => {
            listenToMessages();
          }, POLLING_INTERVAL);
          // Сразу проверяем новые сообщения при возврате
          listenToMessages();
        }
      }
    });
  } catch (error) {
    console.error("Ошибка при инициализации приложения:", error);
    showNotification("Не удалось загрузить приложение. Обновите страницу.", "error");
  } finally {
    loaderControl(false);
  }
});

const postMessage12 = async <T>(
  url: string,
  method: string,
  searchParams: URLSearchParams | null
): Promise<T> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: searchParams ? searchParams.toString() : null,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      throw new Error(`Ошибка запроса: ${res.status} ${errorText}`);
    }

    const result = (await res.json()) as unknown;
    return result as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Превышено время ожидания ответа от сервера");
      }
      throw error;
    }
    throw new Error("Произошла неизвестная ошибка при выполнении запроса");
  }
};

const loaderControl = (isOn: boolean) => {
  if (isOn) {
    loader.style.opacity = "1";
    loader.style.visibility = "visible";
  } else {
    loader.style.opacity = "0";
    loader.style.visibility = "hidden";
  }
};

const subscribe = async (): Promise<void> => {
  let overlay = root.querySelector(".overlay2") as HTMLDivElement;
  if (!overlay) return;
  
  overlay.style.display = "flex";

  let form = overlay.querySelector(".login") as HTMLFormElement;
  let inputName = form.querySelector(".inputName") as HTMLInputElement;

  let button = form.querySelector(".inputButton") as HTMLButtonElement;
  let exitButton = form.querySelector(".exitButton") as HTMLButtonElement;

  // Удаляем старые обработчики
  const newInputName = inputName.cloneNode(true) as HTMLInputElement;
  const newButton = button.cloneNode(true) as HTMLButtonElement;
  const newExitButton = exitButton.cloneNode(true) as HTMLButtonElement;

  inputName.replaceWith(newInputName);
  button.replaceWith(newButton);
  exitButton.replaceWith(newExitButton);

  inputName = newInputName;
  button = newButton;
  exitButton = newExitButton;

  // Устанавливаем правильный тип для email input
  inputName.type = "email";
  inputName.setAttribute("aria-label", "Email для подписки");

  const validateInputs = () => {
    const email = inputName.value.trim();
    button.disabled = email === "" || !isValidEmail(email);
  };

  validateInputs();

  inputName.addEventListener("input", validateInputs);

  // Обработка отправки формы
  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    const email = inputName.value.trim();

    if (!email) {
      showNotification("Пожалуйста, введите email", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showNotification("Пожалуйста, введите корректный email адрес", "error");
      return;
    }

    try {
      loaderControl(true);
      const body = new URLSearchParams();
      body.append("email", email);

      await postMessage12(BASE_URL + MAIL + "/subscribe", "POST", body);
      await builUserInfo(BASE_URL + MAIL + "/profile", "GET");
      
      overlay.style.display = "none";
      inputName.value = "";
      showNotification("Вы успешно подписались на обновления!", "success");
    } catch (error) {
      console.error("Ошибка при подписке:", error);
      showNotification("Не удалось выполнить подписку. Попробуйте еще раз.", "error");
    } finally {
      loaderControl(false);
    }
  };

  form.addEventListener("submit", handleSubmit);
  button.addEventListener("click", handleSubmit);

  exitButton.addEventListener("click", (event) => {
    event.preventDefault();
    overlay.style.display = "none";
    inputName.value = "";
  });

  // Закрытие по клику на overlay
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.style.display = "none";
      inputName.value = "";
    }
  });
};
